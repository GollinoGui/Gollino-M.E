import { useState, useEffect } from 'react'
import { Search, FileText, CheckCircle, Clock, ExternalLink, Copy, Check, Loader2, Printer, AlertTriangle, Plug, Pencil } from 'lucide-react'
import { fmtQtd } from '../utils/formatQtd'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Qtd/Valor da NF-e manual são digitados à mão (produtos por KG usam vírgula,
// ex: "39,000") — sem isso, Number("39,000") vira NaN e a Bling recebe 1.
function parseNum(v) {
  return parseFloat(String(v).replace(',', '.')) || 0
}

function enderecoCompleto(c) {
  if (!c) return ''
  const linha1 = [c.endereco, c.numero].filter(Boolean).join(', ')
  const linha2 = [c.bairro, c.cidade, c.uf].filter(Boolean).join(' - ')
  return [linha1, c.complemento, linha2, c.cep].filter(Boolean).join(' — ')
}

function montarResumoTexto(v, detalhes) {
  const c = detalhes?.cliente
  const linhas = [
    `Venda #${v.orcamento} — ${fmtDate(v.data)}`,
    '',
    'CLIENTE',
    `Nome/Razão social: ${c?.nome || v.nome_cliente || 'Consumidor'}`,
  ]
  if (c?.cpf) linhas.push(`CPF: ${c.cpf}`)
  if (c?.cgc) linhas.push(`CNPJ: ${c.cgc}`)
  if (c?.ie) linhas.push(`IE: ${c.ie}`)
  if (enderecoCompleto(c)) linhas.push(`Endereço: ${enderecoCompleto(c)}`)
  if (c?.telefone || c?.celular) linhas.push(`Telefone: ${c.telefone || c.celular}`)
  if (c?.email) linhas.push(`E-mail: ${c.email}`)
  linhas.push('', 'ITENS')
  for (const it of detalhes?.itens || []) {
    linhas.push(`${fmtQtd(it.quantidade, it.unidade)}x ${it.descricao} — ${fmt(it.preco_unitario)} = ${fmt(it.valor_total)}`)
  }
  linhas.push('', `Valor total: ${fmt(v.valor_total)}`)
  return linhas.join('\n')
}

function fmtDate(d) {
  if (!d) return ''
  const [y, m, dia] = d.split('-')
  return `${dia}/${m}/${y}`
}

function hoje() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function primeiroDiaMes() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

// Códigos de situação da NF-e na Bling (ver electron/bling.js)
const SITUACAO_BLING = {
  1: { texto: 'Enviando…', cor: '#92400E', bg: '#FFFBEB' },
  3: { texto: 'Aguardando recibo', cor: '#92400E', bg: '#FFFBEB' },
  4: { texto: 'Rejeitada', cor: '#991B1B', bg: '#FEF2F2' },
  5: { texto: 'Autorizada', cor: '#15803D', bg: '#F0FDF4' },
  6: { texto: 'Autorizada', cor: '#15803D', bg: '#F0FDF4' },
  8: { texto: 'Aguardando protocolo', cor: '#92400E', bg: '#FFFBEB' },
  9: { texto: 'Denegada', cor: '#991B1B', bg: '#FEF2F2' },
  11: { texto: 'Bloqueada', cor: '#991B1B', bg: '#FEF2F2' },
}
const SITUACOES_EM_ANDAMENTO = [1, 3, 8, 10]

export default function NotaFiscal() {
  const [vendas, setVendas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('todos')
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes())
  const [dataFim, setDataFim] = useState(hoje())
  const [modal, setModal] = useState(null) // { orcamento, nome_cliente, valor_total, numero_nfe }
  const [nfeInput, setNfeInput] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [portalUrl, setPortalUrl] = useState('')
  const [detalhes, setDetalhes] = useState(null)
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false)
  const [copiado, setCopiado] = useState('')
  const [blingAutorizado, setBlingAutorizado] = useState(null) // null = ainda não checou
  const [conectando, setConectando] = useState(false)
  const [emitindo, setEmitindo] = useState(null) // orcamento em emissão/consulta agora

  // --- Conferência de itens antes de emitir (evita mandar descrição errada
  // pra Bling/SEFAZ sem chance de revisão — ver incidente 2026-09-24) ---
  const [conferencia, setConferencia] = useState(null) // venda sendo conferida
  const [itensConferencia, setItensConferencia] = useState([])
  const [carregandoConferencia, setCarregandoConferencia] = useState(false)

  // --- Modal "+ Nova NF-e" (venda avulsa, devolução ou outra — não presa a
  // uma venda já registrada, igual o "Novo" do Orlasoft) ---
  const [modalManual, setModalManual] = useState(false)
  const [tipoManual, setTipoManual] = useState(null) // 'venda' | 'devolucao' | 'outra'
  const [buscaCliente, setBuscaCliente] = useState('')
  const [opcoesCliente, setOpcoesCliente] = useState([])
  const [clienteSelecionado, setClienteSelecionado] = useState(null)
  const [clienteAvulso, setClienteAvulso] = useState(false)
  const [destAvulso, setDestAvulso] = useState({ nome: '', cpf: '', cgc: '', ie: '', endereco: '', numero: '', bairro: '', cep: '', cidade: '', uf: '', telefone: '', email: '' })
  const [itensManuais, setItensManuais] = useState([{ codigo: '', descricao: '', unidade: 'UN', quantidade: 1, valor: 0, ncm: '', cest: '', origem: 0 }])
  const [buscaProdutoIdx, setBuscaProdutoIdx] = useState(null)
  const [opcoesProduto, setOpcoesProduto] = useState([])
  const [naturezasBling, setNaturezasBling] = useState([])
  const [formasBling, setFormasBling] = useState([])
  const [naturezaManual, setNaturezaManualDesc] = useState('')
  const [formaPagManual, setFormaPagManual] = useState('Dinheiro')
  const [dataManual, setDataManual] = useState(hoje())
  const [vencimentoManual, setVencimentoManual] = useState(hoje())
  const [observacaoManual, setObservacaoManual] = useState('')
  const [emitindoManual, setEmitindoManual] = useState(false)
  const [resultadoManual, setResultadoManual] = useState(null) // { situacao, numero, linkDanfe, erro }

  // --- Histórico de notas avulsas (emitidas pelo "+ Nova NF-e", não presas
  // a uma venda registrada — só existiam na Bling até essa tela) ---
  const [modalAvulsas, setModalAvulsas] = useState(false)
  const [avulsas, setAvulsas] = useState([])
  const [carregandoAvulsas, setCarregandoAvulsas] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      const dados = await window.api.nfe.listar({ dataInicio, dataFim, status, busca })
      setVendas(dados || [])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    window.api.config.get('empresa').then((empresa) => setPortalUrl(empresa?.portal_nfe_url || ''))
    window.api.nfe.blingStatusAutorizacao().then((r) => setBlingAutorizado(Boolean(r?.autorizado)))
  }, [])

  async function conectarBling() {
    setConectando(true)
    try {
      const r = await window.api.nfe.blingAutorizar()
      if (r?.sucesso) {
        setBlingAutorizado(true)
        setSucesso('Conectado com a Bling')
        setTimeout(() => setSucesso(''), 3000)
      } else {
        window.alert(r?.erro || 'Não foi possível concluir a autorização.')
      }
    } finally {
      setConectando(false)
    }
  }

  function espera(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async function emitirComBling(v, itensNfe) {
    setEmitindo(v.orcamento)
    try {
      const r = await window.api.nfe.emitirBling(v.orcamento, itensNfe)
      if (!r?.sucesso) {
        window.alert(r?.erro || 'Falha ao emitir a NF-e.')
        await carregar()
        return
      }
      // Aguarda a SEFAZ processar — consulta a cada 3s por até 1 minuto.
      for (let tentativa = 0; tentativa < 20; tentativa++) {
        await espera(3000)
        const resultado = await window.api.nfe.consultarBling(v.orcamento)
        if (resultado?.erro) {
          window.alert(resultado.erro)
          break
        }
        if (!SITUACOES_EM_ANDAMENTO.includes(resultado?.situacao)) break
      }
      await carregar()
    } finally {
      setEmitindo(null)
    }
  }

  // Antes de emitir de verdade pra Bling/SEFAZ, mostra os itens (com a
  // descrição gravada na venda) pra secretária confirmar — se algo saiu
  // errado no cadastro do produto na hora da venda, dá pra corrigir aqui
  // sem precisar cancelar a nota depois.
  async function abrirConferencia(v) {
    setConferencia(v)
    setItensConferencia([])
    setCarregandoConferencia(true)
    try {
      const d = await window.api.nfe.detalhes(v.orcamento)
      setItensConferencia((d?.itens || []).map((it) => ({ ...it })))
    } finally {
      setCarregandoConferencia(false)
    }
  }

  function atualizarDescricaoConferencia(id, valor) {
    setItensConferencia((lista) => lista.map((it) => (it.id === id ? { ...it, descricao: valor } : it)))
  }

  function confirmarEmissao() {
    const v = conferencia
    const itensNfe = itensConferencia.map((it) => ({ id: it.id, descricao: it.descricao.trim() }))
    setConferencia(null)
    emitirComBling(v, itensNfe)
  }

  function imprimirDanfe(link) {
    if (!link) return
    window.api.nfe.abrirPortal(link)
  }

  async function abrirAvulsas() {
    setModalAvulsas(true)
    setCarregandoAvulsas(true)
    try {
      const dados = await window.api.nfe.listarAvulsas()
      setAvulsas(dados || [])
    } finally {
      setCarregandoAvulsas(false)
    }
  }

  function abrirNovaNfe() {
    setTipoManual(null)
    setBuscaCliente('')
    setOpcoesCliente([])
    setClienteSelecionado(null)
    setClienteAvulso(false)
    setDestAvulso({ nome: '', cpf: '', cgc: '', ie: '', endereco: '', numero: '', bairro: '', cep: '', cidade: '', uf: '', telefone: '', email: '' })
    setItensManuais([{ codigo: '', descricao: '', unidade: 'UN', quantidade: 1, valor: 0, ncm: '', cest: '', origem: 0 }])
    setNaturezaManualDesc('')
    setFormaPagManual('Dinheiro')
    setDataManual(hoje())
    setVencimentoManual(hoje())
    setObservacaoManual('')
    setResultadoManual(null)
    setModalManual(true)
    if (!formasBling.length) window.api.nfe.blingFormasPagamento().then((r) => setFormasBling(r || []))
  }

  function escolherTipoManual(tipo) {
    setTipoManual(tipo)
    if (tipo === 'outra' && !naturezasBling.length) {
      window.api.nfe.blingNaturezas().then((r) => setNaturezasBling(r || []))
    }
  }

  async function buscarClientesModal(texto) {
    setBuscaCliente(texto)
    setClienteSelecionado(null)
    if (texto.trim().length < 2) return setOpcoesCliente([])
    const r = await window.api.clientes.listar({ busca: texto })
    setOpcoesCliente((r || []).slice(0, 8))
  }

  function selecionarClienteModal(c) {
    setClienteSelecionado(c)
    setBuscaCliente(`${c.nome}${c.codigo ? ` (#${c.codigo})` : ''}`)
    setOpcoesCliente([])
  }

  async function buscarProdutosModal(idx, texto) {
    atualizarItem(idx, 'descricao', texto)
    setBuscaProdutoIdx(idx)
    if (texto.trim().length < 2) return setOpcoesProduto([])
    const r = await window.api.produtos.listar({ busca: texto })
    setOpcoesProduto((r || []).slice(0, 8))
  }

  function selecionarProdutoModal(idx, p) {
    setItensManuais((lista) => lista.map((it, i) => (i === idx ? {
      ...it,
      codigo: p.codigo,
      descricao: p.descricao,
      unidade: p.unidade || 'UN',
      ncm: p.ncm || '',
      cest: p.codigo_cest || '',
      origem: Number(p.origem_mercadoria) || 0,
      valor: p.preco_venda_vista || 0,
    } : it)))
    setOpcoesProduto([])
    setBuscaProdutoIdx(null)
  }

  function atualizarItem(idx, campo, valor) {
    setItensManuais((lista) => lista.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)))
  }

  function adicionarItemManual() {
    setItensManuais((lista) => [...lista, { codigo: '', descricao: '', unidade: 'UN', quantidade: 1, valor: 0, ncm: '', cest: '', origem: 0 }])
  }

  function removerItemManual(idx) {
    setItensManuais((lista) => lista.filter((_, i) => i !== idx))
  }

  async function emitirManualSubmit() {
    const destinatario = clienteAvulso ? destAvulso : clienteSelecionado
    if (!destinatario) return window.alert('Selecione um cliente ou preencha os dados do destinatário.')
    if (!(destinatario.nome || '').trim()) return window.alert('Informe o nome do destinatário.')

    // Normaliza qtd/valor aqui (aceita vírgula decimal) antes de checar e de
    // mandar pra Bling — evita o valor digitado "não bater" na nota emitida.
    const itensParaEnviar = itensManuais.map((it) => ({
      ...it,
      quantidade: parseNum(it.quantidade),
      valor: parseNum(it.valor),
    }))
    if (itensParaEnviar.some((it) => !it.descricao || !it.ncm || !it.valor || !it.quantidade)) {
      return window.alert('Preencha descrição, NCM, quantidade e valor de todos os itens.')
    }
    if (tipoManual === 'outra' && !naturezaManual) return window.alert('Escolha a natureza de operação.')

    setEmitindoManual(true)
    setResultadoManual(null)
    try {
      const r = await window.api.nfe.emitirManual({
        tipoOperacao: tipoManual,
        destinatario,
        itens: itensParaEnviar,
        formaPagamentoDescricao: formaPagManual,
        dataOperacao: dataManual,
        dataVencimento: vencimentoManual,
        naturezaDescricao: tipoManual === 'outra' ? naturezaManual : undefined,
        observacoes: observacaoManual.trim() || undefined,
      })
      if (!r?.sucesso) {
        setResultadoManual({ erro: r?.erro || 'Falha ao emitir.' })
        return
      }
      for (let tentativa = 0; tentativa < 20; tentativa++) {
        await espera(3000)
        const status = await window.api.nfe.consultarBlingPorId(r.blingId)
        setResultadoManual(status)
        if (status?.erro || !SITUACOES_EM_ANDAMENTO.includes(status?.situacao)) break
      }
      await carregar()
    } finally {
      setEmitindoManual(false)
    }
  }

  async function abrirModal(v) {
    setModal(v)
    setNfeInput(v.numero_nfe || '')
    setDetalhes(null)
    setCarregandoDetalhes(true)
    try {
      const d = await window.api.nfe.detalhes(v.orcamento)
      setDetalhes(d)
    } finally {
      setCarregandoDetalhes(false)
    }
  }

  function copiar(texto, campo) {
    if (!texto) return
    navigator.clipboard.writeText(texto)
    setCopiado(campo)
    setTimeout(() => setCopiado(''), 1500)
  }

  function abrirPortal() {
    if (!portalUrl) return
    window.api.nfe.abrirPortal(portalUrl)
  }

  async function salvarNfe() {
    if (!modal) return
    setSalvando(true)
    try {
      await window.api.nfe.registrar({ orcamento: modal.orcamento, numero_nfe: nfeInput.trim() || null })
      setSucesso(`NF-e ${nfeInput.trim() ? 'registrada' : 'removida'} para venda #${modal.orcamento}`)
      setTimeout(() => setSucesso(''), 3000)
      setModal(null)
      await carregar()
    } finally {
      setSalvando(false)
    }
  }

  const comNfe = vendas.filter(v => v.numero_nfe).length
  const semNfe = vendas.filter(v => !v.numero_nfe).length
  const totalComNfe = vendas.filter(v => v.numero_nfe).reduce((s, v) => s + (v.valor_total || 0), 0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <style>{'@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }'}</style>
      {sucesso && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#15803D', color: '#fff', padding: '9px 22px', borderRadius: 8,
          fontSize: 13, fontWeight: 500, zIndex: 999,
        }}>
          {sucesso}
        </div>
      )}

      {/* Modal registrar NF-e */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500,
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 12, padding: 28,
            width: 480, maxHeight: '86vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Registrar NF-e
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Venda #{modal.orcamento} — {modal.nome_cliente}{modal.codigo_cliente ? ` (#${modal.codigo_cliente})` : ''} — {fmt(modal.valor_total)}
            </div>

            <button
              onClick={abrirPortal}
              disabled={!portalUrl}
              title={portalUrl ? '' : 'Configure o link em Configurações → Dados fiscais'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%',
                height: 36, borderRadius: 7, border: '1px solid var(--blue-700)',
                background: portalUrl ? 'var(--blue-700)' : 'var(--gray-200)',
                color: portalUrl ? '#fff' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 600, cursor: portalUrl ? 'pointer' : 'not-allowed', marginBottom: 16,
              }}
            >
              <ExternalLink size={14} /> Abrir portal da prefeitura
            </button>

            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Dados para a nota
                </span>
                <button
                  onClick={() => copiar(montarResumoTexto(modal, detalhes), 'tudo')}
                  disabled={carregandoDetalhes}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6,
                    border: '1px solid var(--border)', background: 'transparent', fontSize: 11, fontWeight: 500,
                    color: 'var(--text-secondary)', cursor: 'pointer',
                  }}
                >
                  {copiado === 'tudo' ? <Check size={12} color='#15803D' /> : <Copy size={12} />} Copiar tudo
                </button>
              </div>

              {carregandoDetalhes ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Carregando…</div>
              ) : (
                <>
                  {[
                    { campo: 'nome', label: 'Nome / Razão social', valor: detalhes?.cliente?.nome || modal.nome_cliente },
                    { campo: 'cpf', label: 'CPF', valor: detalhes?.cliente?.cpf },
                    { campo: 'cnpj', label: 'CNPJ', valor: detalhes?.cliente?.cgc },
                    { campo: 'ie', label: 'IE', valor: detalhes?.cliente?.ie },
                    { campo: 'endereco', label: 'Endereço', valor: enderecoCompleto(detalhes?.cliente) },
                    { campo: 'contato', label: 'Contato', valor: detalhes?.cliente?.email || detalhes?.cliente?.telefone || detalhes?.cliente?.celular },
                  ].filter(l => l.valor).map(l => (
                    <div key={l.campo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.valor}</div>
                      </div>
                      <button
                        onClick={() => copiar(l.valor, l.campo)}
                        style={{ flexShrink: 0, padding: 5, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        {copiado === l.campo ? <Check size={13} color='#15803D' /> : <Copy size={13} />}
                      </button>
                    </div>
                  ))}

                  {detalhes?.itens?.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Itens</div>
                      {detalhes.itens.map(it => (
                        <div key={it.id} style={{ fontSize: 12, padding: '3px 0', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmtQtd(it.quantidade, it.unidade)}x <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>#{it.codigo_produto}</span> {it.descricao}</span>
                          <span style={{ flexShrink: 0, fontWeight: 500 }}>{fmt(it.valor_total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Número da NF-e
            </label>
            <input
              autoFocus
              value={nfeInput}
              onChange={e => setNfeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && salvarNfe()}
              placeholder='Ex: 000001234 ou chave de acesso'
              style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13, marginBottom: 20 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModal(null)}
                style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              {modal.numero_nfe && (
                <button
                  onClick={() => { setNfeInput(''); salvarNfe() }}
                  style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #FCA5A5', color: '#991B1B', fontSize: 13, cursor: 'pointer' }}
                >
                  Remover NF-e
                </button>
              )}
              <button
                onClick={salvarNfe}
                disabled={salvando || !nfeInput.trim()}
                style={{
                  padding: '8px 20px', borderRadius: 7, background: nfeInput.trim() ? 'var(--blue-700)' : 'var(--gray-200)',
                  color: nfeInput.trim() ? '#fff' : 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal conferência — última checagem dos itens antes de emitir de verdade */}
      {conferencia && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 550,
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 12, padding: 28,
            width: 560, maxHeight: '86vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Conferir antes de emitir
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Venda #{conferencia.orcamento} — {conferencia.nome_cliente} — {fmt(conferencia.valor_total)}
            </div>

            {carregandoConferencia ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '20px 0' }}>Carregando…</div>
            ) : (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Descrição dos itens que vão pra nota
                </div>
                {itensConferencia.map((it) => (
                  <div key={it.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 70, flexShrink: 0 }}>
                      {fmtQtd(it.quantidade, it.unidade)}x
                    </span>
                    <input
                      value={it.descricao}
                      onChange={(e) => atualizarDescricaoConferencia(it.id, e.target.value)}
                      style={{ flex: 1, height: 34, padding: '0 10px', borderRadius: 7, border: `1px solid ${it.descricao.trim() ? 'var(--border)' : '#FCA5A5'}`, fontSize: 13 }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', width: 70, textAlign: 'right', flexShrink: 0 }}>
                      {fmt(it.valor_total)}
                    </span>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginBottom: 20 }}>
                  Corrigir aqui muda só o texto que vai pra nota fiscal — não altera o registro da venda.
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConferencia(null)}
                style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEmissao}
                disabled={carregandoConferencia || itensConferencia.some((it) => !it.descricao.trim())}
                style={{
                  padding: '8px 20px', borderRadius: 7,
                  background: carregandoConferencia || itensConferencia.some((it) => !it.descricao.trim()) ? 'var(--gray-200)' : 'var(--blue-700)',
                  color: carregandoConferencia || itensConferencia.some((it) => !it.descricao.trim()) ? 'var(--text-muted)' : '#fff',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Confirmar e emitir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal "+ Nova NF-e" — Venda avulsa / Devolução / Outra */}
      {modalManual && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600,
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 12, padding: 28,
            width: 640, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Nova NF-e</div>
              <button onClick={() => setModalManual(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>✕</button>
            </div>

            {!tipoManual ? (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Qual o tipo dessa NF-e?</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { id: 'venda', label: 'Venda' },
                    { id: 'devolucao', label: 'Devolução' },
                    { id: 'outra', label: 'Outra' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => escolherTipoManual(t.id)}
                      style={{ flex: 1, padding: '22px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : resultadoManual ? (
              <div>
                {resultadoManual.erro ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 14, borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: 13, marginBottom: 16 }}>
                    <AlertTriangle size={16} /> {resultadoManual.erro}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 8, background: SITUACAO_BLING[resultadoManual.situacao]?.bg || '#FFFBEB', border: `1px solid ${SITUACAO_BLING[resultadoManual.situacao]?.cor || '#FDE68A'}40`, marginBottom: 16 }}>
                    {SITUACOES_EM_ANDAMENTO.includes(resultadoManual.situacao) && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                    <div style={{ fontSize: 13, fontWeight: 600, color: SITUACAO_BLING[resultadoManual.situacao]?.cor }}>
                      {SITUACAO_BLING[resultadoManual.situacao]?.texto || 'Processando…'}{resultadoManual.numero ? ` — Nº ${resultadoManual.numero}` : ''}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  {resultadoManual.linkDanfe && (
                    <button onClick={() => imprimirDanfe(resultadoManual.linkDanfe)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 7, border: 'none', background: 'var(--blue-700)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      <Printer size={13} /> Imprimir
                    </button>
                  )}
                  <button onClick={() => setModalManual(false)}
                    style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer' }}>
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <button onClick={() => setTipoManual(null)} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>← trocar tipo</button>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: 'var(--gray-50)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    {tipoManual}
                  </span>
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>Destinatário</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, cursor: 'pointer' }}>
                  <input type='checkbox' checked={clienteAvulso} onChange={(e) => { setClienteAvulso(e.target.checked); setClienteSelecionado(null); setBuscaCliente('') }} />
                  Cliente não cadastrado (digitar na mão)
                </label>

                {!clienteAvulso ? (
                  <div style={{ position: 'relative', marginBottom: 16 }}>
                    <input
                      value={buscaCliente}
                      onChange={(e) => buscarClientesModal(e.target.value)}
                      placeholder='Buscar cliente por nome, CPF/CNPJ ou código…'
                      style={{ width: '100%', height: 36, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13 }}
                    />
                    {opcoesCliente.length > 0 && (
                      <div style={{ position: 'absolute', top: 38, left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 10, maxHeight: 200, overflowY: 'auto' }}>
                        {opcoesCliente.map((c) => (
                          <div key={c.codigo} onClick={() => selecionarClienteModal(c)}
                            style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                            {c.nome} <span style={{ color: 'var(--text-muted)' }}>(#{c.codigo}){c.cgc ? ` — ${c.cgc}` : c.cpf ? ` — ${c.cpf}` : ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    <input placeholder='Nome / Razão social' value={destAvulso.nome} onChange={(e) => setDestAvulso({ ...destAvulso, nome: e.target.value })} style={{ gridColumn: '1 / 3', height: 34, padding: '0 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12 }} />
                    <input placeholder='CPF' value={destAvulso.cpf} onChange={(e) => setDestAvulso({ ...destAvulso, cpf: e.target.value })} style={{ height: 34, padding: '0 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12 }} />
                    <input placeholder='CNPJ' value={destAvulso.cgc} onChange={(e) => setDestAvulso({ ...destAvulso, cgc: e.target.value })} style={{ height: 34, padding: '0 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12 }} />
                    <input placeholder='Inscrição Estadual (se contribuinte)' value={destAvulso.ie} onChange={(e) => setDestAvulso({ ...destAvulso, ie: e.target.value })} style={{ gridColumn: '1 / 3', height: 34, padding: '0 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12 }} />
                    <input placeholder='Endereço' value={destAvulso.endereco} onChange={(e) => setDestAvulso({ ...destAvulso, endereco: e.target.value })} style={{ height: 34, padding: '0 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12 }} />
                    <input placeholder='Número' value={destAvulso.numero} onChange={(e) => setDestAvulso({ ...destAvulso, numero: e.target.value })} style={{ height: 34, padding: '0 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12 }} />
                    <input placeholder='Bairro' value={destAvulso.bairro} onChange={(e) => setDestAvulso({ ...destAvulso, bairro: e.target.value })} style={{ height: 34, padding: '0 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12 }} />
                    <input placeholder='CEP' value={destAvulso.cep} onChange={(e) => setDestAvulso({ ...destAvulso, cep: e.target.value })} style={{ height: 34, padding: '0 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12 }} />
                    <input placeholder='Cidade' value={destAvulso.cidade} onChange={(e) => setDestAvulso({ ...destAvulso, cidade: e.target.value })} style={{ height: 34, padding: '0 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12 }} />
                    <input placeholder='UF' maxLength={2} value={destAvulso.uf} onChange={(e) => setDestAvulso({ ...destAvulso, uf: e.target.value.toUpperCase() })} style={{ height: 34, padding: '0 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12 }} />
                  </div>
                )}

                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>Itens</div>
                {itensManuais.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'flex-start', position: 'relative' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        value={it.descricao}
                        onChange={(e) => buscarProdutosModal(idx, e.target.value)}
                        placeholder='Produto ou descrição…'
                        style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12 }}
                      />
                      {buscaProdutoIdx === idx && opcoesProduto.length > 0 && (
                        <div style={{ position: 'absolute', top: 34, left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 10, maxHeight: 180, overflowY: 'auto' }}>
                          {opcoesProduto.map((p) => (
                            <div key={p.codigo} onClick={() => selecionarProdutoModal(idx, p)}
                              style={{ padding: '7px 10px', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                              {p.descricao} <span style={{ color: 'var(--text-muted)' }}>(#{p.codigo}){p.ncm ? '' : ' — sem NCM!'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <input value={it.quantidade} onChange={(e) => atualizarItem(idx, 'quantidade', e.target.value)} placeholder='Qtd' style={{ width: 55, height: 32, padding: '0 6px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12 }} />
                    <input value={it.valor} onChange={(e) => atualizarItem(idx, 'valor', e.target.value)} placeholder='Valor un.' style={{ width: 75, height: 32, padding: '0 6px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12 }} />
                    <input value={it.ncm} onChange={(e) => atualizarItem(idx, 'ncm', e.target.value)} placeholder='NCM' style={{ width: 85, height: 32, padding: '0 6px', borderRadius: 6, border: `1px solid ${it.ncm ? 'var(--border)' : '#FCA5A5'}`, fontSize: 12 }} />
                    <button onClick={() => removerItemManual(idx)} disabled={itensManuais.length === 1}
                      style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: itensManuais.length === 1 ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                      ✕
                    </button>
                  </div>
                ))}
                <button onClick={adicionarItemManual} style={{ border: 'none', background: 'transparent', color: 'var(--blue-700)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 0', marginBottom: 16 }}>
                  + Adicionar item
                </button>

                {tipoManual === 'outra' && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Natureza de operação</label>
                    <select value={naturezaManual} onChange={(e) => setNaturezaManualDesc(e.target.value)}
                      style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12 }}>
                      <option value=''>Selecione…</option>
                      {naturezasBling.map((n) => <option key={n.id} value={n.descricao}>{n.descricao}</option>)}
                    </select>
                  </div>
                )}

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Observação (opcional)</label>
                  <textarea value={observacaoManual} onChange={(e) => setObservacaoManual(e.target.value)}
                    placeholder='Ex: nº do pedido de compra, dados bancários para pagamento, etc.'
                    rows={2}
                    style={{ width: '100%', padding: '8px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Forma de pagamento</label>
                    <select value={formaPagManual} onChange={(e) => setFormaPagManual(e.target.value)}
                      style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12 }}>
                      {formasBling.length
                        ? formasBling.map((f) => <option key={f.id} value={f.descricao}>{f.descricao}</option>)
                        : <option value='Dinheiro'>Dinheiro</option>}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Data da operação</label>
                    <input type='date' value={dataManual} onChange={(e) => {
                      setDataManual(e.target.value)
                      setVencimentoManual((v) => (v === dataManual ? e.target.value : v))
                    }}
                      style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Vencimento</label>
                    <input type='date' value={vencimentoManual} onChange={(e) => setVencimentoManual(e.target.value)}
                      style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12 }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setModalManual(false)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={emitirManualSubmit} disabled={emitindoManual}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 7, background: 'var(--blue-700)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: emitindoManual ? 'not-allowed' : 'pointer', border: 'none' }}>
                    {emitindoManual && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                    {emitindoManual ? 'Emitindo…' : 'Emitir'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal histórico de notas avulsas */}
      {modalAvulsas && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500,
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 12, padding: 28,
            width: 780, maxHeight: '86vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Notas avulsas emitidas</div>
              <button onClick={() => setModalAvulsas(false)} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            {carregandoAvulsas ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Carregando…</div>
            ) : avulsas.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma nota avulsa emitida ainda.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '6px 8px' }}>Nº</th>
                    <th style={{ padding: '6px 8px' }}>Data</th>
                    <th style={{ padding: '6px 8px' }}>Destinatário</th>
                    <th style={{ padding: '6px 8px' }}>Valor</th>
                    <th style={{ padding: '6px 8px' }}>Situação</th>
                    <th style={{ padding: '6px 8px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {avulsas.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '6px 8px' }}>{a.numero || '—'}</td>
                      <td style={{ padding: '6px 8px' }}>{fmtDate(a.data_operacao) || '—'}</td>
                      <td style={{ padding: '6px 8px' }}>{a.destinatario_nome}</td>
                      <td style={{ padding: '6px 8px' }}>{fmt(a.valor_total)}</td>
                      <td style={{ padding: '6px 8px' }}>
                        {a.nfe_erro ? (
                          <span title={a.nfe_erro} style={{ color: '#991B1B', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={11} /> Erro
                          </span>
                        ) : SITUACAO_BLING[a.nfe_situacao] ? (
                          <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: SITUACAO_BLING[a.nfe_situacao].bg, color: SITUACAO_BLING[a.nfe_situacao].cor }}>
                            {SITUACAO_BLING[a.nfe_situacao].texto}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        {a.nfe_link_danfe && (
                          <button onClick={() => imprimirDanfe(a.nfe_link_danfe)} title='Ver DANFE'
                            style={{ border: 'none', background: 'transparent', color: 'var(--blue-700)', cursor: 'pointer', display: 'flex' }}>
                            <Printer size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {blingAutorizado === false && (
        <div style={{
          padding: '9px 16px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <span style={{ fontSize: 12, color: '#92400E' }}>
            Sistema ainda não conectado com a Bling — a emissão automática de NF-e não vai funcionar até conectar.
          </span>
          <button
            onClick={conectarBling}
            disabled={conectando}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 7,
              border: 'none', background: '#92400E', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
            }}
          >
            {conectando ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plug size={13} />}
            {conectando ? 'Abrindo navegador…' : 'Conectar com a Bling'}
          </button>
        </div>
      )}

      {/* Filtros */}
      <div style={{
        padding: '10px 16px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && carregar()}
            placeholder='Buscar cliente, venda ou NF-e…'
            style={{ width: '100%', height: 34, paddingLeft: 32, borderRadius: 7, border: '1px solid var(--border)', fontSize: 13 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>De</label>
          <input type='date' value={dataInicio} onChange={e => setDataInicio(e.target.value)}
            style={{ height: 34, padding: '0 8px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Até</label>
          <input type='date' value={dataFim} onChange={e => setDataFim(e.target.value)}
            style={{ height: 34, padding: '0 8px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13 }} />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ height: 34, padding: '0 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13 }}>
          <option value='todos'>Todas</option>
          <option value='com'>Com NF-e</option>
          <option value='sem'>Sem NF-e</option>
        </select>
        <button onClick={carregar}
          style={{ height: 34, padding: '0 18px', borderRadius: 7, background: 'var(--blue-700)', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          {carregando ? 'Buscando…' : 'Buscar'}
        </button>
        <button onClick={abrirNovaNfe}
          title='Devolução, ou qualquer NF-e que não seja de uma venda já registrada'
          style={{ height: 34, padding: '0 16px', borderRadius: 7, background: 'var(--surface)', color: 'var(--blue-700)', fontSize: 13, fontWeight: 600, border: '1px solid var(--blue-700)', cursor: 'pointer' }}>
          + Nova NF-e
        </button>
        <button onClick={abrirAvulsas}
          title='Histórico das NF-e emitidas pelo "+ Nova NF-e"'
          style={{ height: 34, padding: '0 16px', borderRadius: 7, background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer' }}>
          Notas avulsas
        </button>
      </div>

      {/* Cards resumo */}
      <div style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        {[
          { label: 'Com NF-e', valor: comNfe, sub: fmt(totalComNfe), cor: '#15803D', bg: '#F0FDF4', icon: <CheckCircle size={18} color='#15803D' /> },
          { label: 'Sem NF-e', valor: semNfe, sub: `${vendas.length} total`, cor: '#92400E', bg: '#FFFBEB', icon: <Clock size={18} color='#92400E' /> },
        ].map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 8, background: c.bg, border: `1px solid ${c.cor}20`, minWidth: 160 }}>
            {c.icon}
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: c.cor }}>{c.valor}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.label} · {c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 90 }} />
            <col style={{ width: 80 }} />
            <col />
            <col style={{ width: 110 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 190 }} />
          </colgroup>
          <thead>
            <tr>
              {['Venda', 'Data', 'Cliente', 'Total', 'NF-e', 'Ação'].map(h => (
                <th key={h} style={{
                  padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
                  textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)',
                  position: 'sticky', top: 0,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vendas.length === 0 && !carregando && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
                  Nenhuma venda encontrada
                </td>
              </tr>
            )}
            {vendas.map(v => (
              <tr key={v.orcamento}
                style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.08s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '9px 12px', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  #{v.orcamento}
                </td>
                <td style={{ padding: '9px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {fmtDate(v.data)}
                </td>
                <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v.nome_cliente || '—'}{v.codigo_cliente ? ` (#${v.codigo_cliente})` : ''}
                </td>
                <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {fmt(v.valor_total)}
                </td>
                <td style={{ padding: '9px 12px' }}>
                  {v.numero_nfe ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: '#F0FDF4', color: '#15803D', border: '1px solid #86EFAC',
                      padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                    }}>
                      <CheckCircle size={11} /> {v.numero_nfe}
                    </span>
                  ) : SITUACAO_BLING[v.nfe_situacao] ? (
                    <span
                      title={v.nfe_erro || ''}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: SITUACAO_BLING[v.nfe_situacao].bg, color: SITUACAO_BLING[v.nfe_situacao].cor,
                        border: `1px solid ${SITUACAO_BLING[v.nfe_situacao].cor}40`,
                        padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                      }}>
                      {SITUACOES_EM_ANDAMENTO.includes(v.nfe_situacao) && <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />}
                      {v.nfe_situacao === 4 || v.nfe_situacao === 9 ? <AlertTriangle size={11} /> : null}
                      {SITUACAO_BLING[v.nfe_situacao].texto}
                    </span>
                  ) : v.nfe_erro ? (
                    <span title={v.nfe_erro} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5',
                      padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                    }}>
                      <AlertTriangle size={11} /> Erro
                    </span>
                  ) : (
                    <span style={{
                      background: '#FEF9C3', color: '#92400E', border: '1px solid #FDE68A',
                      padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                    }}>
                      Pendente
                    </span>
                  )}
                </td>
                <td style={{ padding: '9px 12px', display: 'flex', gap: 6 }}>
                  {v.numero_nfe ? (
                    <>
                      {v.nfe_link_danfe && (
                        <button
                          onClick={() => imprimirDanfe(v.nfe_link_danfe)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            border: '1px solid var(--blue-700)', background: 'var(--blue-700)', color: '#fff',
                          }}
                        >
                          <Printer size={12} /> Imprimir
                        </button>
                      )}
                      <button
                        onClick={() => abrirModal(v)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          border: '1px solid var(--border)', color: 'var(--text-secondary)',
                        }}
                      >
                        <FileText size={12} /> Editar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => abrirConferencia(v)}
                        disabled={Boolean(emitindo) || blingAutorizado === false}
                        title={blingAutorizado === false ? 'Conecte com a Bling primeiro' : ''}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                          cursor: emitindo || blingAutorizado === false ? 'not-allowed' : 'pointer',
                          border: '1px solid var(--blue-700)',
                          background: blingAutorizado === false ? 'var(--gray-200)' : 'var(--blue-700)',
                          color: blingAutorizado === false ? 'var(--text-muted)' : '#fff',
                        }}
                      >
                        {emitindo === v.orcamento
                          ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                          : <FileText size={12} />}
                        {emitindo === v.orcamento ? 'Emitindo…' : 'Emitir NF-e'}
                      </button>
                      <button
                        onClick={() => abrirModal(v)}
                        title='Registrar número manualmente (fallback)'
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 28, borderRadius: 6, cursor: 'pointer', flexShrink: 0,
                          border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent',
                        }}
                      >
                        <Pencil size={12} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
