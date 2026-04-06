const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')

// Importa o módulo de banco de dados
const db = require('./database')

const isDev = !app.isPackaged

// Pasta onde o banco vai ficar: C:\GollinoME\banco\
function getDbPath() {
  const base = isDev
    ? path.join(__dirname, '..')
    : path.dirname(app.getPath('exe'))
  const dbDir = path.join(base, 'banco')
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
  return path.join(dbDir, 'gollino.db')
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
    title: 'Gollino M.E — Sistema de Gestão',
  })

  // Em dev carrega o Vite; em produção carrega o build
  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.setMenuBarVisibility(false)
}

app.whenReady().then(() => {
  // Inicializa o banco de dados
  db.init(getDbPath())

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ============================================================
// IPC HANDLERS — comunicação React ↔ SQLite
// ============================================================

// --- AUTH ---
ipcMain.handle('auth:login', async (_, { usuario, senha }) => {
  try {
    const result = db.login(usuario, senha)
    return result
  } catch (e) {
    return { sucesso: false, erro: e.message }
  }
})

// Helper: wraps handler with try/catch, retorna { sucesso: false, erro } em caso de falha
function handle(channel, fn) {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return await fn(event, ...args)
    } catch (e) {
      console.error(`[IPC:${channel}]`, e.message)
      return { sucesso: false, erro: e.message }
    }
  })
}

// --- CLIENTES ---
handle('clientes:listar', (_, filtros) => db.clientes.listar(filtros))
handle('clientes:buscar', (_, codigo) => db.clientes.buscar(codigo))
handle('clientes:salvar', (_, dados) => db.clientes.salvar(dados))
handle('clientes:excluir', (_, codigo) => db.clientes.excluir(codigo))

// --- PRODUTOS ---
handle('produtos:listar', (_, filtros) => db.produtos.listar(filtros))
handle('produtos:buscar', (_, codigo) => db.produtos.buscar(codigo))
handle('produtos:salvar', (_, dados) => db.produtos.salvar(dados))
handle('produtos:excluir', (_, codigo) => db.produtos.excluir(codigo))

// --- VENDAS ---
handle('vendas:listar', (_, filtros) => db.vendas.listar(filtros))
handle('vendas:buscar', (_, orcamento) => db.vendas.buscar(orcamento))
handle('vendas:salvar', (_, dados) => db.vendas.salvar(dados))
handle('vendas:cancelar', (_, { orcamento, motivo, usuario }) => db.vendas.cancelar(orcamento, motivo, usuario))
handle('vendas:devolver', (_, dados) => db.vendas.devolver(dados))
handle('vendas:proximoNumero', () => db.vendas.proximoNumero())

// --- CONTAS A RECEBER ---
handle('contasReceber:listar', (_, filtros) => db.contasReceber.listar(filtros))
handle('contasReceber:receber', (_, dados) => db.contasReceber.receber(dados))
handle('contasReceber:totalAberto', () => db.contasReceber.totalAberto())

// --- CONTAS A PAGAR ---
handle('contasPagar:listar', (_, filtros) => db.contasPagar.listar(filtros))
handle('contasPagar:pagar', (_, dados) => db.contasPagar.pagar(dados))
handle('contasPagar:salvar', (_, dados) => db.contasPagar.salvar(dados))
handle('contasPagar:totalAberto', () => db.contasPagar.totalAberto())

// --- CAIXA ---
handle('caixa:status', () => db.caixa.status())
handle('caixa:abrir', (_, dados) => db.caixa.abrir(dados))
handle('caixa:fechar', (_, dados) => db.caixa.fechar(dados))
handle('caixa:sessoesHoje', () => db.caixa.sessoesHoje())
handle('manutencao:corrigirCR', () => db.manutencao.corrigirCROrfaos())

// --- LOG DO SISTEMA ---
handle('log:listar', (_, filtros) => db.log.listar(filtros))

// --- NF-e ---
handle('nfe:listar', (_, filtros) => db.nfe.listar(filtros))
handle('nfe:registrar', (_, { orcamento, numero_nfe }) => db.nfe.registrar(orcamento, numero_nfe))

// --- PEDIDOS DE COMPRA ---
handle('pedidosCompra:listar', (_, filtros) => db.pedidosCompra.listar(filtros))
handle('pedidosCompra:salvar', (_, dados) => db.pedidosCompra.salvar(dados))
handle('pedidosCompra:cancelar', (_, numero) => db.pedidosCompra.cancelar(numero))
handle('pedidosCompra:receber', (_, numero) => db.pedidosCompra.receber(numero))
handle('pedidosCompra:proximoNumero', () => db.pedidosCompra.proximoNumero())

// --- CHEQUES ---
handle('cheques:listar', (_, filtros) => db.cheques.listar(filtros))
handle('cheques:salvar', (_, dados) => db.cheques.salvar(dados))
handle('cheques:baixar', (_, { id, data_compensacao, usuario }) => db.cheques.baixar(id, data_compensacao, usuario))
handle('cheques:devolver', (_, { id, usuario }) => db.cheques.devolver(id, usuario))

// --- LANÇAMENTOS EXTRAS ---
handle('lancamentosExtras:listar', (_, filtros) => db.lancamentosExtras.listar(filtros))
handle('lancamentosExtras:salvar', (_, dados) => db.lancamentosExtras.salvar(dados))
handle('lancamentosExtras:pagar', (_, { id, usuario }) => db.lancamentosExtras.pagar(id, usuario))
handle('lancamentosExtras:cancelar', (_, id) => db.lancamentosExtras.cancelar(id))

// --- REAJUSTES DE PREÇO ---
handle('reajustesPreco:listar', (_, filtros) => db.reajustesPreco.listar(filtros))
handle('reajustesPreco:aplicar', (_, { codigos, percentual, usuario }) => db.reajustesPreco.aplicar(codigos, percentual, usuario))

// --- DASHBOARD ---
handle('dashboard:resumo', (_, periodo) => db.dashboard.resumo(periodo))

// --- CONFIGURACOES ---
handle('config:get', (_, chave) => db.config.get(chave))
handle('config:set', (_, { chave, valor }) => db.config.set(chave, valor))

// --- PRÉ-VENDAS ---
handle('preVendas:listar', (_, filtros) => db.preVendas.listar(filtros))
handle('preVendas:buscar', (_, numero) => db.preVendas.buscar(numero))
handle('preVendas:salvar', (_, dados) => db.preVendas.salvar(dados))
handle('preVendas:cancelar', (_, numero) => db.preVendas.cancelar(numero))
handle('preVendas:baixar', (_, numero) => db.preVendas.baixar(numero))
handle('preVendas:proximoNumero', () => db.preVendas.proximoNumero())

// --- MOVIMENTOS DE ESTOQUE ---
handle('movimentosEstoque:listar', (_, filtros) => db.movimentosEstoque.listar(filtros))
handle('movimentosEstoque:salvar', (_, dados) => db.movimentosEstoque.salvar(dados))

// --- PDF ---
function getVendasDir() {
  const base = isDev
    ? path.join(__dirname, '..')
    : path.dirname(app.getPath('exe'))
  const dir = path.join(base, 'banco', 'vendas')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function fmtPhone(v) {
  const d = (v || '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function gerarHtmlVenda(venda, empresa, cliente, saldoCR, vencimentos) {
  const fmtV = (v) => (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : ''
  const now = new Date()
  const impresso = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR')

  // Endereço da empresa
  const endEmpresa = [empresa.endereco, empresa.numero].filter(Boolean).join(', ')
  const cidEmpresa = [empresa.bairro, empresa.cidade, empresa.uf, empresa.cep].filter(Boolean).join(' ')
  const telEmpresa = [empresa.telefone, empresa.celular].filter(Boolean).map(fmtPhone).join(' / ')

  // Endereço do cliente
  const endCliente = cliente
    ? [cliente.logradouro, cliente.numero].filter(Boolean).join(', ') + (cliente.bairro ? ' ' + cliente.bairro : '') + ' ' + (cliente.cidade || '') + (cliente.uf ? '-' + cliente.uf : '') + (cliente.cep ? ' ' + cliente.cep : '')
    : ''
  const cnpjCliente = cliente ? [cliente.cgc ? `CNPJ: ${cliente.cgc}` : (cliente.cpf ? `CPF: ${cliente.cpf}` : ''), cliente.ie ? `IE: ${cliente.ie}` : ''].filter(Boolean).join(' ') : ''
  const telCliente = cliente ? [cliente.telefone, cliente.celular].filter(Boolean).map(fmtPhone).join(' / ') : ''

  // Itens
  const itens = venda.itens || []
  const totalQtde = itens.reduce((s, i) => s + (i.quantidade || 0), 0)
  const totalDescto = itens.reduce((s, i) => s + (i.valor_desconto || 0), 0)
  const totalProd = itens.reduce((s, i) => s + (i.valor_total || 0), 0)

  const linhasVazias = Math.max(0, 5 - itens.length)
  const itensHtml = itens.map(item => `
    <tr>
      <td style="font-family:monospace">${item.codigo_produto}</td>
      <td>${item.descricao || ''}</td>
      <td style="text-align:center">${item.unidade || 'UN'}</td>
      <td style="text-align:right">${fmtV(item.quantidade)}</td>
      <td style="text-align:right">${fmtV(item.preco_unitario)}</td>
      <td style="text-align:right">${fmtV(item.valor_desconto)}</td>
      <td style="text-align:right;font-weight:600">${fmtV(item.valor_total)}</td>
    </tr>`).join('')
  const vaziosHtml = Array(linhasVazias).fill('<tr><td colspan="7" style="height:18px">&nbsp;</td></tr>').join('')

  // Vencimentos
  const vencHtml = (vencimentos || []).length > 0
    ? vencimentos.map(v => `<tr><td>${fmtDate(v.data_vencimento)}</td><td style="text-align:right">${fmtV(v.valor_docto)}</td></tr>`).join('')
    : '<tr><td colspan="2" style="color:#666">-</td></tr>'

  // Vendedor
  const vendedor = venda.usuario_cadastro || '-'

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#000;padding:10px 14px}
table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:4px}
th,td{border:1px solid #000;padding:2px 5px;vertical-align:top}
th{background:#f0f0f0;font-weight:700;font-size:9px}
.nb{border:none}
.bb{border-bottom:1px solid #000}
.bt{border-top:1px solid #000}
.br{border-right:1px solid #000}
.bl{border-left:1px solid #000}
.outer{border:1px solid #000;margin-bottom:4px}
@page{margin:8mm;size:A4}
</style></head>
<body>

<!-- CABEÇALHO: empresa esquerda, doc direita -->
<table style="margin-bottom:6px">
  <tr>
    <td class="nb" style="width:36px;vertical-align:middle;padding-right:6px">
      <svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
        <rect width="34" height="34" rx="4" fill="#1a56db"/>
        <path d="M6 8h3l3 12h12l2-8H10" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="14" cy="24" r="2" fill="#fff"/><circle cx="22" cy="24" r="2" fill="#fff"/>
      </svg>
    </td>
    <td class="nb" style="vertical-align:top;line-height:1.5">
      <strong style="font-size:13px">${empresa.razao_social}</strong><br>
      ${endEmpresa ? `Endereço: ${endEmpresa} ${cidEmpresa}<br>` : ''}
      CNPJ: ${empresa.cnpj || '—'}${empresa.ie ? ` &nbsp; IE: ${empresa.ie}` : ''}<br>
      ${telEmpresa ? `Telefone(s): ${telEmpresa}<br>` : ''}
      ${empresa.email ? `Email: ${empresa.email}` : ''}
    </td>
    <td class="nb" style="text-align:right;vertical-align:top;line-height:1.6;font-size:9px;white-space:nowrap">
      Impresso em: ${impresso}<br>
      Página: 1<br>
      <strong>Pedido de Venda</strong><br>
      <strong style="font-size:14px">${venda.orcamento}</strong>
    </td>
  </tr>
</table>

<!-- CLIENTE -->
<table style="margin-bottom:4px">
  <tr>
    <td style="border:1px solid #000;padding:3px 5px">
      <table style="margin:0;border:none">
        <tr>
          <td class="nb" style="width:100%">
            <strong>Cliente: ${venda.codigo_cliente || ''} - ${venda.nome_cliente || 'Consumidor'}</strong>
          </td>
          <td class="nb" style="white-space:nowrap;text-align:right;padding-left:16px">
            <strong>Saldo CR (dívida): ${fmtV(saldoCR)}</strong>
          </td>
        </tr>
        ${endCliente ? `<tr><td class="nb" colspan="2">Endereço: ${endCliente.trim()}</td></tr>` : ''}
        ${cnpjCliente ? `<tr><td class="nb" colspan="2">${cnpjCliente}</td></tr>` : ''}
        <tr>
          <td class="nb">${telCliente ? `Telefone(s): ${telCliente}` : ''}</td>
          <td class="nb" style="text-align:right;white-space:nowrap;padding-left:16px"><strong>Haver (crédito): ${fmtV(cliente?.haver || 0)}</strong></td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- VENDEDOR / DATA -->
<table style="margin-bottom:4px">
  <tr>
    <td style="border:1px solid #000;padding:3px 5px">
      <strong>Vendedor: ${vendedor}</strong>
      &nbsp;&nbsp;&nbsp; ${fmtDate(venda.data)}
      &nbsp;&nbsp;&nbsp; ${venda.orcamento}
    </td>
  </tr>
  <tr>
    <td style="border:1px solid #000;padding:3px 5px">
      <strong>Observação:</strong> ${venda.observacao || ''}
    </td>
  </tr>
</table>

<!-- PRODUTOS -->
<table>
  <thead>
    <tr>
      <th style="width:80px">Produto</th>
      <th>Descrição</th>
      <th style="width:36px;text-align:center">UN.</th>
      <th style="width:50px;text-align:right">Qtde</th>
      <th style="width:72px;text-align:right">Unitário</th>
      <th style="width:60px;text-align:right">Descto</th>
      <th style="width:80px;text-align:right">Total</th>
    </tr>
  </thead>
  <tbody>
    ${itensHtml}
    ${vaziosHtml}
    <tr style="background:#f0f0f0;font-weight:700">
      <td colspan="3" style="text-align:right">Total Produtos:</td>
      <td style="text-align:right">${fmtV(totalQtde)}</td>
      <td></td>
      <td style="text-align:right">${fmtV(totalDescto)}</td>
      <td style="text-align:right">${fmtV(totalProd)}</td>
    </tr>
  </tbody>
</table>

<!-- FORMAS DE PAGAMENTO + TOTAIS -->
<table>
  <thead>
    <tr>
      <th colspan="8" style="text-align:left">Formas de Pagamento</th>
      <th colspan="4" style="text-align:right">Totais</th>
    </tr>
    <tr>
      <th style="text-align:right">Dinheiro</th>
      <th style="text-align:right">Cheque</th>
      <th style="text-align:right">C. Crédito</th>
      <th style="text-align:right">C. Débito</th>
      <th style="text-align:right">Haver (crédito)</th>
      <th style="text-align:right">Outros</th>
      <th style="text-align:right">Convênio</th>
      <th style="text-align:right">Troco</th>
      <th style="text-align:right">Frete</th>
      <th style="text-align:right">Acréscimos</th>
      <th style="text-align:right">Descontos</th>
      <th style="text-align:right;font-weight:700">Total Venda</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:right">${fmtV(venda.valor_pago_dinheiro)}</td>
      <td style="text-align:right">${fmtV(venda.valor_pago_cheque)}</td>
      <td style="text-align:right">${fmtV(venda.valor_pago_cartao_credito)}</td>
      <td style="text-align:right">${fmtV(venda.valor_pago_cartao_debito)}</td>
      <td style="text-align:right">${fmtV(venda.valor_pago_haver)}</td>
      <td style="text-align:right">0,00</td>
      <td style="text-align:right">${fmtV(venda.codigo_forma_pagamento1 === 'Convênio' ? venda.valor_total : 0)}</td>
      <td style="text-align:right">${fmtV(venda.valor_troco)}</td>
      <td style="text-align:right">${fmtV(venda.taxa_entrega)}</td>
      <td style="text-align:right">${fmtV(venda.valor_acrescimo)}</td>
      <td style="text-align:right">${fmtV(venda.valor_descontos_itens)}</td>
      <td style="text-align:right;font-weight:700">${fmtV(venda.valor_total)}</td>
    </tr>
  </tbody>
</table>

<!-- VENCIMENTOS -->
<table style="width:200px;margin-bottom:6px">
  <thead>
    <tr><th colspan="2" style="text-align:left">Vencimento(s)</th></tr>
  </thead>
  <tbody>${vencHtml}</tbody>
</table>

<!-- ASSINATURAS -->
<table style="margin-top:20px">
  <tr>
    <td style="border:none;border-top:1px solid #000;width:50%;text-align:center;padding-top:3px;font-size:9px">Retirado Por:</td>
    <td style="border:none;border-top:1px solid #000;width:50%;text-align:center;padding-top:3px;font-size:9px">Conferido Por:</td>
  </tr>
</table>

</body></html>`
}

ipcMain.handle('pdf:gerarVenda', async (_, orcamento) => {
  try {
    const venda = db.vendas.buscar(orcamento)
    if (!venda) return { sucesso: false, erro: 'Venda não encontrada' }

    // Empresa: tenta JSON blob primeiro, depois fallback nos campos individuais
    const configs = db.config.get()
    const cfgMap = {}
    for (const c of configs) cfgMap[c.chave] = c.valor
    const blob = cfgMap['empresa'] ? (() => { try { return JSON.parse(cfgMap['empresa']) } catch { return null } })() : null
    const empresa = blob ? {
      razao_social: blob.razao_social || cfgMap['empresa_razao_social'] || 'ELTER GOLLINO',
      nome_fantasia: blob.nome_fantasia || cfgMap['empresa_nome_fantasia'] || 'GOLLINO M.E',
      cnpj: blob.cnpj || cfgMap['empresa_cnpj'] || '',
      ie: blob.ie || '',
      telefone: blob.telefone || '',
      celular: blob.celular || '',
      email: blob.email || '',
      endereco: blob.endereco || '',
      numero: blob.numero || '',
      bairro: blob.bairro || '',
      cidade: blob.cidade || cfgMap['empresa_cidade'] || 'Orlândia',
      uf: blob.uf || cfgMap['empresa_uf'] || 'SP',
      cep: blob.cep || '',
    } : {
      razao_social: cfgMap['empresa_razao_social'] || 'ELTER GOLLINO',
      nome_fantasia: cfgMap['empresa_nome_fantasia'] || 'GOLLINO M.E',
      cnpj: cfgMap['empresa_cnpj'] || '',
      ie: '', telefone: '', celular: '', email: '',
      endereco: '', numero: '', bairro: '',
      cidade: cfgMap['empresa_cidade'] || 'Orlândia',
      uf: cfgMap['empresa_uf'] || 'SP', cep: '',
    }

    // Cliente completo
    const cliente = venda.codigo_cliente ? db.clientes.buscar(venda.codigo_cliente) : null

    // Saldo CR em aberto do cliente
    let saldoCR = 0
    if (venda.codigo_cliente) {
      try { saldoCR = db.contasReceber.saldoCliente(venda.codigo_cliente) } catch (_) {}
    }

    // Vencimentos desta venda
    let vencimentos = []
    try { vencimentos = db.contasReceber.porOrcamento(venda.orcamento) } catch (_) {}

    const html = gerarHtmlVenda(venda, empresa, cliente, saldoCR, vencimentos)

    const win = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    })

    await win.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
    )

    const pdfBuffer = await win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: false,
      marginsType: 1,
    })

    win.close()

    const dir = getVendasDir()
    const fileName = `venda_${orcamento}_${new Date().toISOString().slice(0, 10)}.pdf`
    const filePath = path.join(dir, fileName)
    fs.writeFileSync(filePath, pdfBuffer)

    await shell.openPath(filePath)

    return { sucesso: true, caminho: filePath }
  } catch (err) {
    console.error('Erro ao gerar PDF:', err)
    return { sucesso: false, erro: err.message }
  }
})

// --- BACKUP ---
ipcMain.handle('backup:exportar', async () => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Salvar Backup',
    defaultPath: `backup_gollino_${new Date().toISOString().slice(0, 10)}.db`,
    filters: [{ name: 'Banco de Dados', extensions: ['db'] }],
  })
  if (filePath) {
    fs.copyFileSync(getDbPath(), filePath)
    return { sucesso: true, caminho: filePath }
  }
  return { sucesso: false }
})

ipcMain.handle('backup:importar', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Selecionar arquivo de backup',
    filters: [{ name: 'Banco de Dados', extensions: ['db'] }],
    properties: ['openFile'],
  })
  if (!filePaths || filePaths.length === 0) return { sucesso: false }
  const origem = filePaths[0]
  const destino = getDbPath()
  // Cria cópia de segurança do banco atual antes de sobrescrever
  const seguranca = destino.replace('.db', `_antes_restauracao_${new Date().toISOString().slice(0,10)}.db`)
  fs.copyFileSync(destino, seguranca)
  fs.copyFileSync(origem, destino)
  return { sucesso: true, seguranca }
})

// --- HAVER ---
handle('haver:listar', (_, busca) => db.haver.listar(busca))
handle('haver:ajustar', (_, dados) => db.haver.ajustar(dados))
handle('haver:totalGeral', () => db.haver.totalGeral())

// --- IMPORTAÇÃO CSV ---
ipcMain.handle('importar:abrirArquivo', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Selecionar arquivo CSV',
    filters: [{ name: 'CSV', extensions: ['csv', 'txt'] }],
    properties: ['openFile'],
  })
  if (!filePaths || filePaths.length === 0) return null
  return fs.readFileSync(filePaths[0], 'utf-8')
})

handle('importar:produtos', (_, linhas) => db.importar.produtos(linhas))
handle('importar:clientes', (_, linhas) => db.importar.clientes(linhas))

// --- RELATÓRIOS GERENCIAIS ---
handle('relatorios:inventario', () => db.relatorios.inventario())
handle('relatorios:itenisVendidos', (_, f) => db.relatorios.itenisVendidos(f.dataInicio, f.dataFim))
handle('relatorios:entradasMercadoria', (_, f) => db.relatorios.entradasMercadoria(f.dataInicio, f.dataFim))
handle('relatorios:extrato', (_, f) => db.relatorios.extrato(f.dataInicio, f.dataFim))
