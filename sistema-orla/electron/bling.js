// Integração com a API v3 da Bling (emissão de NF-e a partir das vendas do
// sistema-orla). Roda só no processo main do Electron — o clientSecret nunca
// pode chegar ao renderer.
//
// Fluxo: iniciarAutorizacao() é rodado uma vez pelo Elter (abre o navegador,
// ele loga na Bling e autoriza; um servidor local temporário captura o
// retorno). Daí em diante, o access_token é renovado sozinho via
// refresh_token (validade de 30 dias) a cada emissão.
//
// Referência dos formatos usados aqui: SDK oficial da comunidade
// (github.com/AlexandreBellas/bling-erp-api-js), que documenta os mesmos
// endpoints/campos da documentação oficial developer.bling.com.br.

const fs = require('fs')
const path = require('path')
const http = require('http')
const crypto = require('crypto')
const { app, shell } = require('electron')

const CONFIG_PATH = path.join(__dirname, 'bling-config.json')

// bling-config.json (Client ID/Secret) é só leitura, então pode ficar dentro
// do app.asar. Mas bling-tokens.json precisa ser GRAVADO em runtime — dentro
// do app.asar (empacotado) o filesystem é somente leitura, então usa a pasta
// de dados do usuário, igual getBancoDir() em main.js resolve pro mesmo
// problema com o banco local.
function getTokensPath() {
  const base = app.isPackaged ? app.getPath('userData') : __dirname
  return path.join(base, 'bling-tokens.json')
}

const API_BASE_URL = 'https://api.bling.com.br/Api/v3'
const OAUTH_BASE_URL = 'https://www.bling.com.br/Api/v3'

function carregarConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error('electron/bling-config.json não encontrado — Client ID/Secret da Bling não configurados.')
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
}

function carregarTokens() {
  const tokensPath = getTokensPath()
  if (!fs.existsSync(tokensPath)) return null
  try {
    return JSON.parse(fs.readFileSync(tokensPath, 'utf8'))
  } catch {
    return null
  }
}

function salvarTokens(tokenSet) {
  const expiraEm = Date.now() + (tokenSet.expires_in || 21600) * 1000
  const dados = { ...tokenSet, expira_em: expiraEm }
  fs.writeFileSync(getTokensPath(), JSON.stringify(dados, null, 2))
  return dados
}

function basicAuthHeader() {
  const { clientId, clientSecret } = carregarConfig()
  return 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
}

async function trocarCodePorTokens(code) {
  const resp = await fetch(`${OAUTH_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
      'enable-jwt': '1',
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code }),
  })
  const dados = await resp.json()
  if (!resp.ok) throw new Error(`Falha ao trocar code por token: ${dados?.error_description || dados?.error || resp.status}`)
  return salvarTokens(dados)
}

async function renovarTokens() {
  const tokens = carregarTokens()
  if (!tokens?.refresh_token) throw new Error('Não há refresh_token salvo — rode a autorização novamente.')
  const resp = await fetch(`${OAUTH_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
      'enable-jwt': '1',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token }),
  })
  const dados = await resp.json()
  if (!resp.ok) throw new Error(`Falha ao renovar token da Bling: ${dados?.error_description || dados?.error || resp.status}`)
  return salvarTokens(dados)
}

// Sobe um servidor HTTP local temporário só pra capturar o ?code= do
// redirect do OAuth, depois se encerra sozinho.
function aguardarCallback(porta, caminhoCallback, stateEsperado) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      servidor.close()
      reject(new Error('Tempo esgotado esperando a autorização (5 minutos).'))
    }, 5 * 60 * 1000)

    const servidor = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${porta}`)
      if (url.pathname !== caminhoCallback) {
        res.writeHead(404)
        res.end()
        return
      }
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const erro = url.searchParams.get('error')

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      if (erro || !code) {
        res.end('<html><body><h3>Autorização não concluída.</h3><p>Pode fechar esta aba e tentar de novo no sistema.</p></body></html>')
      } else {
        res.end('<html><body><h3>Autorização concluída!</h3><p>Pode fechar esta aba e voltar pro sistema.</p></body></html>')
      }

      clearTimeout(timeout)
      servidor.close()

      if (erro) return reject(new Error(`Bling recusou a autorização: ${erro}`))
      if (!code) return reject(new Error('Callback da Bling veio sem "code".'))
      if (state !== stateEsperado) return reject(new Error('State do callback não confere (possível ataque CSRF) — autorização abortada.'))
      resolve(code)
    })

    servidor.listen(porta)
  })
}

async function iniciarAutorizacao() {
  const { clientId, redirectUri } = carregarConfig()
  const url = new URL(redirectUri)
  const porta = Number(url.port) || 80

  const state = crypto.randomBytes(16).toString('hex')
  const authorizeUrl = new URL(`${OAUTH_BASE_URL}/oauth/authorize`)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)

  const aguardando = aguardarCallback(porta, url.pathname, state)
  await shell.openExternal(authorizeUrl.toString())
  const code = await aguardando
  await trocarCodePorTokens(code)
  return { sucesso: true }
}

function statusAutorizacao() {
  const tokens = carregarTokens()
  return { autorizado: Boolean(tokens?.refresh_token) }
}

async function obterAccessTokenValido() {
  let tokens = carregarTokens()
  if (!tokens?.access_token) {
    if (!tokens?.refresh_token) throw new Error('Bling não autorizada ainda — conecte antes de emitir notas.')
    tokens = await renovarTokens()
  } else if (Date.now() >= tokens.expira_em - 60_000) {
    tokens = await renovarTokens()
  }
  return tokens.access_token
}

// Chama a API de recursos (não a de OAuth). Se der 401 mesmo com token
// supostamente válido, renova uma vez e tenta de novo.
async function chamarApi(metodo, caminho, corpo) {
  async function tentativa() {
    const accessToken = await obterAccessTokenValido()
    return fetch(`${API_BASE_URL}${caminho}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'enable-jwt': '1',
        'Content-Type': 'application/json',
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    })
  }

  let resp = await tentativa()
  if (resp.status === 401) {
    await renovarTokens()
    resp = await tentativa()
  }

  const texto = await resp.text()
  const dados = texto ? JSON.parse(texto) : null
  if (!resp.ok) {
    const base = dados?.error?.message || dados?.error?.description || resp.status
    const campos = dados?.error?.fields?.length
      ? ' — ' + dados.error.fields.map((f) => `${f.element || f.field || ''}: ${f.msg || f.message || ''}`).join('; ')
      : ''
    throw new Error(`Bling API ${metodo} ${caminho}: ${base}${campos}` || `Bling API ${metodo} ${caminho}: ${JSON.stringify(dados)}`)
  }
  return dados
}

// --- Lookups de tabelas de apoio (naturezas de operação, formas de pagamento) ---
// Cacheados em memória pro processo — mudam raramente, não vale bater na API
// toda hora. Se a Bling reiniciar o processo (fecha o app), recarrega.
let cacheNaturezas = null
let cacheFormas = null

async function listarNaturezasOperacao() {
  if (cacheNaturezas) return cacheNaturezas
  const resp = await chamarApi('GET', '/naturezas-operacoes?limite=100')
  cacheNaturezas = resp.data || []
  return cacheNaturezas
}

async function listarFormasPagamento() {
  if (cacheFormas) return cacheFormas
  const resp = await chamarApi('GET', '/formas-pagamentos?limite=100')
  cacheFormas = resp.data || []
  return cacheFormas
}

async function idNaturezaOperacao(descricaoExata) {
  const lista = await listarNaturezasOperacao()
  const alvo = lista.find((n) => (n.descricao || '').trim().toLowerCase() === descricaoExata.trim().toLowerCase())
  if (!alvo) throw new Error(`Natureza de operação "${descricaoExata}" não encontrada na Bling — confira o cadastro lá.`)
  return alvo.id
}

async function idFormaPagamento(descricaoContem) {
  const lista = await listarFormasPagamento()
  const alvo = lista.find((f) => (f.descricao || '').toLowerCase().includes(descricaoContem.toLowerCase()))
  if (!alvo) throw new Error(`Forma de pagamento parecida com "${descricaoContem}" não encontrada na Bling.`)
  return alvo.id
}

// Dado o dicionário de valores pagos da venda (valor_pago_dinheiro, etc.),
// acha qual foi o meio de pagamento dominante — usado só pra rotular a
// parcela da nota, não recalcula nada financeiro (isso continua só no
// sistema-orla).
function formaPagamentoDominante(venda) {
  const opcoes = [
    { campo: 'valor_pago_dinheiro', busca: 'Dinheiro' },
    { campo: 'valor_pago_cartao_credito', busca: 'Cartão de Crédito' },
    { campo: 'valor_pago_cartao_debito', busca: 'Cartão de Débito' },
    { campo: 'valor_pago_pix', busca: 'PIX' },
    { campo: 'valor_pago_cheque', busca: 'Cheque' },
    { campo: 'valor_pago_contas_receber', busca: 'Outros' },
    { campo: 'valor_pago_haver', busca: 'Outros' },
  ]
  let melhor = opcoes[0]
  for (const op of opcoes) {
    if ((venda[op.campo] || 0) > (venda[melhor.campo] || 0)) melhor = op
  }
  return melhor.busca
}

function apenasDigitos(v) {
  return (v || '').replace(/\D/g, '')
}

function montarContato(cliente) {
  if (!cliente) {
    throw new Error('Venda sem cliente vinculado — cadastre um cliente antes de emitir a NF-e.')
  }
  const cnpj = apenasDigitos(cliente.cgc)
  const cpf = apenasDigitos(cliente.cpf)
  const temCnpj = cnpj.length === 14
  const numeroDocumento = temCnpj ? cnpj : cpf
  if (!numeroDocumento) {
    throw new Error(`Cliente "${cliente.nome}" sem CPF/CNPJ cadastrado — obrigatório pra emitir NF-e.`)
  }
  const ehContribuinte = temCnpj && Boolean(cliente.ie)

  return {
    dadosContato: {
      nome: cliente.nome,
      tipoPessoa: temCnpj ? 'J' : 'F',
      numeroDocumento,
      ie: cliente.ie || undefined,
      contribuinte: ehContribuinte ? 1 : 9,
      telefone: cliente.telefone || cliente.celular || undefined,
      email: cliente.email || undefined,
      endereco: cliente.endereco
        ? {
            endereco: cliente.endereco,
            numero: cliente.numero || 'S/N',
            complemento: cliente.complemento || undefined,
            bairro: cliente.bairro || 'Não informado',
            cep: apenasDigitos(cliente.cep) || undefined,
            municipio: cliente.cidade,
            uf: cliente.uf,
            pais: 'Brasil',
          }
        : undefined,
    },
    ehContribuinte,
  }
}

function montarItens(itensVenda, produtosPorCodigo) {
  return itensVenda.map((it) => {
    const produto = produtosPorCodigo[it.codigo_produto]
    if (!produto?.ncm) {
      throw new Error(`Produto "${it.descricao || it.codigo_produto}" sem NCM cadastrado — preencha em Produtos antes de emitir a NF-e.`)
    }
    return {
      codigo: it.codigo_produto,
      descricao: it.descricao,
      unidade: it.unidade || 'UN',
      quantidade: it.quantidade,
      valor: it.preco_unitario,
      tipo: 'P',
      classificacaoFiscal: produto.ncm,
      cest: produto.codigo_cest || undefined,
      origem: Number(produto.origem_mercadoria) || 0,
    }
  })
}

// Igual montarItens, mas pra quando o NCM/CEST/origem já vêm junto no próprio
// item (NF-e manual/devolução/outra) em vez de precisar olhar em `produtos`.
function montarItensManual(itens) {
  return itens.map((it) => {
    if (!it.ncm) {
      throw new Error(`Item "${it.descricao || it.codigo}" sem NCM — obrigatório pra emitir NF-e.`)
    }
    return {
      codigo: it.codigo || it.descricao,
      descricao: it.descricao,
      unidade: it.unidade || 'UN',
      quantidade: Number(it.quantidade) || 1,
      valor: Number(it.valor) || 0,
      tipo: 'P',
      classificacaoFiscal: it.ncm,
      cest: it.cest || undefined,
      origem: Number(it.origem) || 0,
    }
  })
}

// Monta e emite (cria + envia) a NF-e de uma venda já registrada no
// sistema-orla. `detalhes` é o retorno de db.nfe.detalhes(orcamento)
// (venda, cliente, itens), e `produtosPorCodigo` é um mapa codigo->produto
// (pra pegar NCM/CEST/origem, que não ficam salvos em vendas_itens).
async function emitirNfeDaVenda(detalhes, produtosPorCodigo) {
  const { venda, cliente, itens } = detalhes
  if (!itens?.length) throw new Error('Venda sem itens — nada pra emitir.')

  const { dadosContato } = montarContato(cliente)
  const naturezaId = await idNaturezaOperacao('Venda de mercadoria')
  const formaPagId = await idFormaPagamento(formaPagamentoDominante(venda))

  const payload = {
    tipo: 1,
    dataOperacao: `${venda.data} ${venda.hora_cadastro || '00:00:00'}`,
    contato: dadosContato,
    naturezaOperacao: { id: naturezaId },
    finalidade: 1,
    itens: montarItens(itens, produtosPorCodigo),
    parcelas: [
      {
        data: venda.data,
        valor: venda.valor_total,
        formaPagamento: { id: formaPagId },
      },
    ],
  }

  const blingId = await criarEEnviarNfe(payload)
  return { blingId }
}

async function criarEEnviarNfe(payload) {
  const criada = await chamarApi('POST', '/nfe', payload)
  const blingId = criada.data.id
  await chamarApi('POST', `/nfe/${blingId}/enviar`, {})
  return blingId
}

const NATUREZA_POR_TIPO = {
  devolucao: 'Devolução de venda',
  outra: null, // obrigatório vir em dados.naturezaDescricao
}
const FINALIDADE_POR_TIPO = { venda: 1, devolucao: 4, outra: 1 }

// NF-e criada "na mão" pela tela Fiscal > NF-e > "+ Nova NF-e" — não está
// presa a uma venda já registrada (devolução, ou qualquer outro caso que o
// Orlasoft cobria com o tipo "Outra"). `dados.destinatario` aceita tanto uma
// linha de `clientes` quanto um objeto avulso com os mesmos nomes de campo
// (nome, cpf/cgc, ie, endereco, numero, bairro, cep, cidade, uf, ...).
async function emitirNfeManual(dados) {
  const { tipoOperacao, destinatario, itens, formaPagamentoDescricao, dataOperacao, dataVencimento, naturezaDescricao: naturezaManual, finalidade: finalidadeManual, observacoes } = dados
  if (!itens?.length) throw new Error('Adicione ao menos um item.')

  const { dadosContato } = montarContato(destinatario)

  let naturezaDescricao = naturezaManual
  if (!naturezaDescricao) {
    naturezaDescricao = tipoOperacao === 'venda' ? 'Venda de mercadoria' : NATUREZA_POR_TIPO[tipoOperacao]
  }
  if (!naturezaDescricao) throw new Error('Informe a natureza de operação.')

  const naturezaId = await idNaturezaOperacao(naturezaDescricao)
  const formaPagId = await idFormaPagamento(formaPagamentoDescricao || 'Dinheiro')
  const valorTotal = itens.reduce((s, it) => s + (Number(it.valor) || 0) * (Number(it.quantidade) || 1), 0)

  const payload = {
    tipo: 1,
    dataOperacao: dataOperacao || new Date().toISOString().slice(0, 19).replace('T', ' '),
    contato: dadosContato,
    naturezaOperacao: { id: naturezaId },
    finalidade: finalidadeManual || FINALIDADE_POR_TIPO[tipoOperacao] || 1,
    observacoes: observacoes || undefined,
    itens: montarItensManual(itens),
    parcelas: [
      {
        data: (dataVencimento || dataOperacao || new Date().toISOString()).slice(0, 10),
        valor: valorTotal,
        formaPagamento: { id: formaPagId },
      },
    ],
  }

  const blingId = await criarEEnviarNfe(payload)
  return { blingId }
}

async function consultarNfe(blingId) {
  const resp = await chamarApi('GET', `/nfe/${blingId}`)
  return resp.data
}

module.exports = {
  iniciarAutorizacao,
  statusAutorizacao,
  emitirNfeDaVenda,
  emitirNfeManual,
  consultarNfe,
  listarNaturezasOperacao,
  listarFormasPagamento,
}
