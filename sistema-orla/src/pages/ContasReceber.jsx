import { useState, useEffect } from 'react'
import { Search, Filter, DollarSign, RefreshCw, Trash2 } from 'lucide-react'
import ThOrdenavel from '../components/ThOrdenavel'
import { BotoesRelatorio } from '../components/BotoesRelatorio'
import ModalBaixarPrejuizo from '../components/ModalBaixarPrejuizo'
import { useOrdenacao } from '../utils/ordenacao'
import {
  exportarCSV,
  agruparPorPessoa,
  buscarEmpresa,
  gerarHtmlAgrupadoPorPessoa,
  gerarHtmlSecoes,
  gerarPdfRelatorio,
  fmtMoedaBR,
} from '../utils/relatorios'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDate = (d) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-'

const STATUS_CFG = {
  ABERTO: { bg: '#EBF3FC', color: '#185FA5', label: 'Aberto' },
  BAIXADO: { bg: '#EAF6EE', color: '#22863A', label: 'Baixado' },
  VENCIDO: { bg: '#FFF0F0', color: '#C53030', label: 'Vencido' },
  CANCELADO: { bg: '#F7F7F7', color: 'var(--text-muted)', label: 'Cancelado' },
  CARTAO: { bg: '#F3EEFC', color: '#6B3FA0', label: 'Cartão (auto)' },
  PREJUIZO: { bg: '#3A3A3A', color: '#fff', label: 'Prejuízo' },
}

// Conta gerada automaticamente por venda no cartão de crédito: o repasse é
// automático da operadora, então não precisa (nem pode) ser confirmada na mão.
function isCartaoAutomatico(c) {
  return c.tipo_docto === 'CC' && c.situacao_docto === 'A'
}

// Calcula situação real com base na data de vencimento
function getSituacao(c) {
  if (c.situacao_docto === 'P') return 'BAIXADO'
  if (c.situacao_docto === 'C') return 'CANCELADO'
  if (c.situacao_docto === 'X') return 'PREJUIZO'
  if (isCartaoAutomatico(c)) return 'CARTAO'
  const hoje = new Date().toISOString().slice(0, 10)
  if (c.data_vencimento && c.data_vencimento < hoje) return 'VENCIDO'
  return 'ABERTO'
}

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.ABERTO
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: '2px 9px',
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {s.label}
    </span>
  )
}

// Confirmação de recebimento — cobre tanto uma conta única (onde ainda dá pra
// ajustar o valor recebido, ex: recebimento parcial) quanto um lote de várias
// contas selecionadas (cada uma quitada pelo próprio valor em aberto). É a
// etapa de "conferir antes de receber": lista as contas resumidas e só
// efetiva ao clicar em Receber de novo, aqui dentro.
function ModalConfirmarRecebimento({ contas, onClose, onConfirm }) {
  const unico = contas.length === 1
  const emAberto = (c) => c.valor_docto - (c.valor_pagamento || 0)
  const totalEmAberto = contas.reduce((s, c) => s + emAberto(c), 0)
  const [forma, setForma] = useState(null)
  const [valorUnico, setValorUnico] = useState(unico ? emAberto(contas[0]).toFixed(2) : '')
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [salvando, setSalvando] = useState(false)

  const valorFinal = unico ? parseFloat(valorUnico) || 0 : totalEmAberto
  const valorValido = unico ? parseFloat(valorUnico) > 0 : true
  const podeConfirmar = !!forma && valorValido

  async function handleConfirm() {
    if (!podeConfirmar) return
    setSalvando(true)
    const pagamentos = contas.map((c) => ({
      id: c.id,
      valor_pagamento: unico ? valorFinal : emAberto(c),
    }))
    await onConfirm(pagamentos, forma, data)
    setSalvando(false)
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 14,
          border: '1px solid var(--border-md)',
          width: 460,
          boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
          overflow: 'hidden',
        }}
      >
        <div style={{ background: '#185FA5', padding: '16px 20px' }}>
          <div
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 12,
              marginBottom: 2,
            }}
          >
            {unico
              ? `${contas[0].nome_cliente || contas[0].codigo_cliente}${contas[0].telefone_cliente ? ' · ' + contas[0].telefone_cliente : ''}`
              : `${contas.length} conta(s) selecionada(s)`}
          </div>
          <div style={{ color: 'var(--surface)', fontSize: 22, fontWeight: 600 }}>
            {fmt(valorFinal)}
          </div>
          {unico && (
            <div
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 11,
                marginTop: 2,
              }}
            >
              Vencimento: {fmtDate(contas[0].data_vencimento)} · Doc: {contas[0].nro_docto}
            </div>
          )}
        </div>
        <div style={{ padding: '18px 20px' }}>
          {/* Conferência — lista resumida do que está prestes a virar "recebido" */}
          <div
            style={{
              border: '1px solid var(--border-md)',
              borderRadius: 8,
              maxHeight: 160,
              overflowY: 'auto',
              marginBottom: 16,
            }}
          >
            {contas.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '8px 12px',
                  borderBottom: i < contas.length - 1 ? '1px solid var(--border)' : 'none',
                  fontSize: 12.5,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.nome_cliente || c.codigo_cliente}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    Venc. {fmtDate(c.data_vencimento)}
                    {c.nro_docto ? ` · Doc: ${c.nro_docto}` : ''}
                  </div>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {fmt(emAberto(c))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              FORMA DE PAGAMENTO
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {['Dinheiro', 'Cartão', 'Cheque', 'Haver', 'PIX'].map((f) => (
                <button
                  key={f}
                  onClick={() => setForma(f)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    border:
                      forma === f ? '2px solid #185FA5' : '1px solid var(--border-md)',
                    background: forma === f ? '#EBF3FC' : 'var(--surface)',
                    color: forma === f ? '#185FA5' : 'var(--text-secondary)',
                    fontWeight: forma === f ? 600 : 400,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {unico ? (
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Valor recebido
                </label>
                <input
                  value={valorUnico}
                  onChange={(e) => setValorUnico(e.target.value)}
                  type='number'
                  step='0.01'
                  style={{
                    width: '100%',
                    height: 36,
                    padding: '0 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border-md)',
                  }}
                  autoFocus
                />
                {valorUnico !== '' && !valorValido && (
                  <div style={{ fontSize: 11, color: '#C53030', marginTop: 4 }}>
                    Informe um valor maior que zero.
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Total a receber
                </label>
                <div
                  style={{
                    height: 36,
                    padding: '0 10px',
                    display: 'flex',
                    alignItems: 'center',
                    background: '#F7F7F7',
                    border: '1px solid var(--border-md)',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {fmt(totalEmAberto)}
                </div>
              </div>
            )}
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Data do recebimento
              </label>
              <input
                value={data}
                onChange={(e) => setData(e.target.value)}
                type='date'
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border-md)',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: '1px solid var(--border-md)',
                fontSize: 13,
                color: 'var(--text-muted)',
              }}
            >
              Cancelar
            </button>
            <button
              disabled={!podeConfirmar || salvando}
              onClick={handleConfirm}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                background: podeConfirmar ? '#185FA5' : 'var(--border-md)',
                color: podeConfirmar ? 'var(--surface)' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: 600,
                cursor: podeConfirmar ? 'pointer' : 'not-allowed',
              }}
            >
              {salvando ? 'Salvando...' : 'Receber'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContasReceber({ usuario }) {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [selecionadas, setSelecionadas] = useState([])
  const [loteRecebimento, setLoteRecebimento] = useState(null)
  const [sucesso, setSucesso] = useState('')
  const [modalPrejuizo, setModalPrejuizo] = useState(false)
  const [aguardandoAprovacao, setAguardandoAprovacao] = useState(false)

  // ── Carrega do banco ─────────────────────────────────────────
  async function carregar() {
    setLoading(true)
    try {
      const filtros = {}
      if (filtroStatus === 'aberto') filtros.situacao = 'A'
      if (filtroStatus === 'baixado') filtros.situacao = 'P'
      if (filtroStatus === 'prejuizo') filtros.situacao = 'X'
      if (busca) filtros.cliente = busca

      const result = await window.api.contasReceber.listar(filtros)
      setDados(result)
    } catch (err) {
      console.error('Erro ao carregar contas a receber:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [filtroStatus])

  // Busca local (já filtra pelo banco quando muda status)
  const filtrados = dados.filter((c) => {
    if (!busca) return true
    const b = busca.toLowerCase()
    return (
      (c.nome_cliente || '').toLowerCase().includes(b) ||
      (c.nro_docto || '').includes(busca) ||
      (c.codigo_cliente || '').includes(busca)
    )
  })

  // Totalizadores
  const totalEmAberto = filtrados
    .filter((c) => c.situacao_docto === 'A')
    .reduce((s, c) => s + (c.valor_docto - (c.valor_pagamento || 0)), 0)

  const totalPago = filtrados
    .filter((c) => c.situacao_docto === 'P')
    .reduce((s, c) => s + (c.valor_pagamento || 0), 0)

  const totalDocto = filtrados
    .filter((c) => c.situacao_docto !== 'C')
    .reduce((s, c) => s + (c.valor_docto || 0), 0)

  const { ordenados, coluna, direcao, alternar } = useOrdenacao(filtrados, {
    acessores: {
      nome_cliente: (c) => c.nome_cliente || c.codigo_cliente || '',
      em_aberto: (c) => c.valor_docto - (c.valor_pagamento || 0),
      situacao: (c) => getSituacao(c),
    },
  })

  // ── Relatório (Excel/PDF), agrupado por cliente e em ordem alfabética ──
  function exportarExcel() {
    const grupos = agruparPorPessoa(filtrados, { codigoKey: 'codigo_cliente', nomeKey: 'nome_cliente' })
    const linhas = []
    for (const g of grupos) {
      for (const c of g.itens) {
        linhas.push({
          Documento: c.nro_docto || '—',
          Cliente: g.nome,
          Vencimento: fmtDate(c.data_vencimento),
          'Valor (R$)': (c.valor_docto || 0).toFixed(2).replace('.', ','),
          'Em Aberto (R$)': (c.valor_docto - (c.valor_pagamento || 0)).toFixed(2).replace('.', ','),
          Situação: STATUS_CFG[getSituacao(c)].label,
        })
      }
      const subDocto = g.itens.reduce((s, c) => s + (c.valor_docto || 0), 0)
      const subAberto = g.itens.reduce((s, c) => s + (c.valor_docto - (c.valor_pagamento || 0)), 0)
      linhas.push({
        Documento: '',
        Cliente: `SUBTOTAL — ${g.nome}`,
        Vencimento: '',
        'Valor (R$)': subDocto.toFixed(2).replace('.', ','),
        'Em Aberto (R$)': subAberto.toFixed(2).replace('.', ','),
        Situação: '',
      })
    }
    linhas.push({
      Documento: '',
      Cliente: 'TOTAL GERAL',
      Vencimento: '',
      'Valor (R$)': totalDocto.toFixed(2).replace('.', ','),
      'Em Aberto (R$)': totalEmAberto.toFixed(2).replace('.', ','),
      Situação: '',
    })
    exportarCSV(linhas, `contas_receber_${new Date().toISOString().slice(0, 10)}`)
  }

  async function gerarRelatorioPDF() {
    const empresa = await buscarEmpresa()
    const grupos = agruparPorPessoa(filtrados, { codigoKey: 'codigo_cliente', nomeKey: 'nome_cliente' })
    const colunas = [
      { label: 'Documento' },
      { label: 'Vencimento' },
      { label: 'Valor', num: true },
      { label: 'Em Aberto', num: true },
      { label: 'Situação' },
    ]
    const html = gerarHtmlAgrupadoPorPessoa({
      empresa,
      titulo: 'Contas a Receber',
      subtitulo: `${filtrados.length} parcela(s) — gerado em ${fmtDate(new Date().toISOString().slice(0, 10))}`,
      colunas,
      grupos,
      montarLinha: (c) => {
        const emAberto = c.valor_docto - (c.valor_pagamento || 0)
        return `<tr><td>${c.nro_docto || '—'}</td><td>${fmtDate(c.data_vencimento)}</td><td class="num">${fmtMoedaBR(c.valor_docto)}</td><td class="num">${fmtMoedaBR(emAberto)}</td><td>${STATUS_CFG[getSituacao(c)].label}</td></tr>`
      },
      montarSubtotal: (g) => {
        const subDocto = g.itens.reduce((s, c) => s + (c.valor_docto || 0), 0)
        const subAberto = g.itens.reduce((s, c) => s + (c.valor_docto - (c.valor_pagamento || 0)), 0)
        return `<td colspan="2">Subtotal</td><td class="num">${fmtMoedaBR(subDocto)}</td><td class="num">${fmtMoedaBR(subAberto)}</td><td></td>`
      },
      montarTotalGeral: () =>
        `<td colspan="2">TOTAL GERAL</td><td class="num">${fmtMoedaBR(totalDocto)}</td><td class="num">${fmtMoedaBR(totalEmAberto)}</td><td></td>`,
    })
    await gerarPdfRelatorio(html, `contas_receber_${new Date().toISOString().slice(0, 10)}`)
  }

  // Só faz sentido marcar como "selecionada" uma conta ainda em aberto (nem
  // baixada/cancelada/prejuízo, nem o repasse automático do cartão) — por
  // isso a seleção em si já filtra isso, em vez de deixar marcar qualquer
  // linha e só bloquear os botões depois.
  function toggleSel(id) {
    const conta = dados.find((c) => c.id === id)
    if (!conta) return
    if (conta.situacao_docto !== 'A' || isCartaoAutomatico(conta)) return
    setSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  // Recebe a lista já conferida no modal (uma conta ou um lote) e quita cada
  // uma via a mesma RPC de sempre — não existe um "receber em lote" no banco,
  // então repete a chamada já auditada por conta em vez de criar uma via de
  // escrita direta na tabela.
  async function confirmarRecebimento(pagamentos, forma, data) {
    const contasAlvo = dados.filter((c) => pagamentos.some((p) => p.id === c.id))
    const recebidas = []
    const falhas = []
    for (const p of pagamentos) {
      const conta = contasAlvo.find((c) => c.id === p.id)
      try {
        const resultado = await window.api.contasReceber.receber({
          id: p.id,
          valor_pagamento: p.valor_pagamento,
          forma,
          data_pagamento: data,
          usuario: usuario?.usuario || 'sistema',
        })
        if (resultado?.sucesso) recebidas.push({ conta, valor: p.valor_pagamento })
        else falhas.push({ conta, erro: resultado?.erro || 'Erro desconhecido.' })
      } catch (err) {
        falhas.push({ conta, erro: err.message })
      }
    }

    setLoteRecebimento(null)
    setSelecionadas([])
    await carregar()

    if (falhas.length > 0) {
      await window.api.dialog.alert(
        `${recebidas.length} conta(s) recebida(s) com sucesso.\n${falhas.length} falharam:\n` +
          falhas
            .map((f) => `• ${f.conta?.nome_cliente || f.conta?.codigo_cliente || '?'}: ${f.erro}`)
            .join('\n'),
      )
    }

    if (recebidas.length > 0) {
      setSucesso(`✅ ${recebidas.length} conta(s) recebida(s)!`)
      setTimeout(() => setSucesso(''), 2500)
      try {
        await gerarRelatorioRecebimento(recebidas)
      } catch (err) {
        console.error('Erro ao gerar relatório de recebimento:', err)
      }
    }
  }

  // Relatório em três seções: o que acabou de ser recebido nesta operação,
  // o que ainda está em aberto (dentro do prazo) e o que já está vencido —
  // não só o que está filtrado na tela no momento, é a conferência completa
  // que a secretária leva pro Elter.
  async function gerarRelatorioRecebimento(recebidas) {
    const abertas = (await window.api.contasReceber.listar({ situacao: 'A' })).filter(
      (c) => !isCartaoAutomatico(c),
    )
    const hoje = new Date().toISOString().slice(0, 10)
    const emAbertoList = abertas.filter((c) => !c.data_vencimento || c.data_vencimento >= hoje)
    const vencidasList = abertas.filter((c) => c.data_vencimento && c.data_vencimento < hoje)

    const empresa = await buscarEmpresa()
    const colunas = [
      { label: 'Cliente' },
      { label: 'Documento' },
      { label: 'Vencimento' },
      { label: 'Valor', num: true },
    ]
    const montarLinhaConta = (c) => {
      const emAberto = c.valor_docto - (c.valor_pagamento || 0)
      return `<tr><td>${c.nome_cliente || c.codigo_cliente}</td><td>${c.nro_docto || '—'}</td><td>${fmtDate(c.data_vencimento)}</td><td class="num">${fmtMoedaBR(emAberto)}</td></tr>`
    }
    const montarLinhaRecebida = (r) =>
      `<tr><td>${r.conta?.nome_cliente || r.conta?.codigo_cliente || '?'}</td><td>${r.conta?.nro_docto || '—'}</td><td>${fmtDate(r.conta?.data_vencimento)}</td><td class="num">${fmtMoedaBR(r.valor)}</td></tr>`

    const totalRecebido = recebidas.reduce((s, r) => s + r.valor, 0)
    const totalAberto = emAbertoList.reduce((s, c) => s + (c.valor_docto - (c.valor_pagamento || 0)), 0)
    const totalVencido = vencidasList.reduce((s, c) => s + (c.valor_docto - (c.valor_pagamento || 0)), 0)

    const html = gerarHtmlSecoes({
      empresa,
      titulo: 'Recebimento de Contas',
      subtitulo: `Gerado em ${fmtDate(new Date().toISOString().slice(0, 10))}`,
      secoes: [
        {
          titulo: 'Recebidas nesta operação',
          colunas,
          linhas: recebidas,
          montarLinha: montarLinhaRecebida,
          montarTotal: () => `<td colspan="3">Total recebido</td><td class="num">${fmtMoedaBR(totalRecebido)}</td>`,
        },
        {
          titulo: 'Em aberto',
          colunas,
          linhas: emAbertoList,
          montarLinha: montarLinhaConta,
          montarTotal: () => `<td colspan="3">Total em aberto</td><td class="num">${fmtMoedaBR(totalAberto)}</td>`,
        },
        {
          titulo: 'Vencidas',
          colunas,
          linhas: vencidasList,
          montarLinha: montarLinhaConta,
          montarTotal: () => `<td colspan="3">Total vencido</td><td class="num">${fmtMoedaBR(totalVencido)}</td>`,
        },
      ],
    })
    await gerarPdfRelatorio(html, `recebimento_contas_${new Date().toISOString().slice(0, 10)}`)
  }

  // A seleção já só admite contas em aberto (ver toggleSel), então serve
  // tanto para "Receber" quanto para "Baixar por prejuízo".
  const contasSelecionadas = dados.filter((c) => selecionadas.includes(c.id))
  const podeReceber = contasSelecionadas.length > 0

  // ── Baixa por prejuízo (dívida incobrável) ──────────────────────
  const podeBaixarPrejuizo = contasSelecionadas.length > 0
  const podeExcluirDireto = (usuario?.nivel ?? 0) >= 2

  async function confirmarBaixaPrejuizo(motivo) {
    const nomeUsuario = usuario?.nome || usuario?.usuario || 'sistema'
    if (podeExcluirDireto) {
      const resultado = await window.api.contasReceber.baixarPrejuizo({
        ids: contasSelecionadas.map((c) => c.id),
        usuario: nomeUsuario,
        motivo,
      })
      if (!resultado.sucesso) throw new Error(resultado.erro)
      setModalPrejuizo(false)
      setSelecionadas([])
      setSucesso('✅ Conta(s) baixada(s) por prejuízo!')
      setTimeout(() => setSucesso(''), 2500)
      await carregar()
    } else {
      const resultado = await window.api.aprovacoes.solicitar({
        tipo: 'BAIXA_PREJUIZO_CR',
        itens: contasSelecionadas.map((c) => ({
          id: c.id,
          nro_docto: c.nro_docto,
          cliente: c.nome_cliente || c.codigo_cliente,
          valor: c.valor_docto - (c.valor_pagamento || 0),
          motivo,
        })),
        usuario_solicitante: nomeUsuario,
      })
      if (!resultado.sucesso) throw new Error(resultado.erro)
      setModalPrejuizo(false)
      setSelecionadas([])
      setAguardandoAprovacao(true)
      setTimeout(() => setAguardandoAprovacao(false), 4000)
    }
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        position: 'relative',
      }}
    >
      {/* Toast de sucesso */}
      {sucesso && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#22863A',
            color: 'var(--surface)',
            padding: '9px 22px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 300,
          }}
        >
          {sucesso}
        </div>
      )}

      {aguardandoAprovacao && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#6B21A8',
            color: '#fff',
            padding: '9px 22px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 300,
          }}
        >
          📨 Pedido de exclusão por prejuízo enviado para aprovação!
        </div>
      )}

      {loteRecebimento && (
        <ModalConfirmarRecebimento
          contas={loteRecebimento}
          onClose={() => setLoteRecebimento(null)}
          onConfirm={confirmarRecebimento}
        />
      )}

      {modalPrejuizo && (
        <ModalBaixarPrejuizo
          contas={contasSelecionadas}
          podeExcluirDireto={podeExcluirDireto}
          onFechar={() => setModalPrejuizo(false)}
          onConfirmar={confirmarBaixaPrejuizo}
        />
      )}

      {/* ── TOPO: busca + filtros + totais ── */}
      <div
        style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border-md)' }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && carregar()}
              placeholder='Buscar por cliente ou documento...'
              style={{
                width: '100%',
                height: 34,
                paddingLeft: 32,
                borderRadius: 8,
                border: '1px solid var(--border-md)',
                fontSize: 13,
              }}
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            style={{
              height: 34,
              padding: '0 10px',
              borderRadius: 8,
              border: '1px solid var(--border-md)',
              fontSize: 13,
            }}
          >
            <option value='todos'>Todos</option>
            <option value='aberto'>Aberto</option>
            <option value='baixado'>Baixado</option>
            <option value='prejuizo'>Prejuízo</option>
          </select>
          <button
            onClick={carregar}
            style={{
              height: 34,
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid var(--border-md)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
            title='Atualizar'
          >
            <RefreshCw size={13} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 10,
          }}
        >
          {[
            { label: 'Em aberto', value: fmt(totalEmAberto), color: '#185FA5' },
            { label: 'Recebido', value: fmt(totalPago), color: '#22863A' },
            { label: 'Total faturado', value: fmt(totalDocto), color: 'var(--text-primary)' },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                background: 'var(--gray-50)',
                borderRadius: 8,
                padding: '10px 14px',
                border: '1px solid var(--border-md)',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                {c.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: c.color }}>
                {c.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABELA ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            Carregando...
          </div>
        ) : filtrados.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            Nenhum registro encontrado.
          </div>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 36 }} />
              <col />
              <col style={{ width: 90 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 95 }} />
              <col style={{ width: 95 }} />
              <col style={{ width: 85 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thStyle}></th>
                {[
                  { label: 'Documento', chave: 'nro_docto' },
                  { label: 'Seq', chave: 'seq_docto' },
                  { label: 'Cliente', chave: 'nome_cliente' },
                  { label: 'Data', chave: 'data_docto' },
                  { label: 'Vencimento', chave: 'data_vencimento' },
                  { label: 'Valor doc.', chave: 'valor_docto' },
                  { label: 'Em aberto', chave: 'em_aberto' },
                  { label: 'Situação', chave: 'situacao' },
                ].map((h) => (
                  <ThOrdenavel
                    key={h.chave}
                    label={h.label}
                    chave={h.chave}
                    colunaAtual={coluna}
                    direcao={direcao}
                    onOrdenar={alternar}
                    style={thStyle}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {ordenados.map((c) => {
                const sel = selecionadas.includes(c.id)
                const sit = getSituacao(c)
                const vencido = sit === 'VENCIDO'
                const auto = isCartaoAutomatico(c)
                const selecionavel = c.situacao_docto === 'A' && !auto
                const emAberto = c.valor_docto - (c.valor_pagamento || 0)
                return (
                  <tr
                    key={c.id}
                    onClick={() => toggleSel(c.id)}
                    onDoubleClick={() => selecionavel && setLoteRecebimento([c])}
                    style={{
                      background: sel
                        ? '#EBF3FC'
                        : vencido
                          ? '#FFF5F5'
                          : 'transparent',
                      cursor: selecionavel ? 'pointer' : 'default',
                      opacity: selecionavel ? 1 : 0.75,
                      transition: 'background 0.08s',
                    }}
                    onMouseEnter={(e) => {
                      if (!sel && selecionavel)
                        e.currentTarget.style.background = vencido
                          ? '#FEE2E2'
                          : 'var(--gray-50)'
                    }}
                    onMouseLeave={(e) => {
                      if (!sel && selecionavel)
                        e.currentTarget.style.background = vencido
                          ? '#FFF5F5'
                          : 'transparent'
                    }}
                  >
                    <td style={tdStyle}>
                      <input
                        type='checkbox'
                        checked={sel}
                        disabled={!selecionavel}
                        onChange={() => toggleSel(c.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: 14, height: 14, cursor: selecionavel ? 'pointer' : 'not-allowed' }}
                        title={auto ? 'Recebimento automático da operadora de cartão' : undefined}
                      />
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                    >
                      {c.nro_docto}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: 'center',
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      {c.seq_docto || '-'}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>
                        {c.nome_cliente || c.codigo_cliente}
                      </div>
                      {c.telefone_cliente && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {c.telefone_cliente}
                        </div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12 }}>
                      {fmtDate(c.data_docto)}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontSize: 12,
                        color: vencido ? '#C53030' : undefined,
                        fontWeight: vencido ? 500 : 400,
                      }}
                    >
                      {fmtDate(c.data_vencimento)}
                    </td>
                    <td style={tdStyle}>{fmt(c.valor_docto)}</td>
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 500,
                        color: emAberto > 0 ? '#185FA5' : 'var(--text-muted)',
                      }}
                    >
                      {c.situacao_docto === 'C' ? '-' : fmt(emAberto)}
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={sit} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── RODAPÉ ── */}
      <div
        style={{
          background: 'var(--gray-50)',
          borderTop: '1px solid var(--border-md)',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {filtrados.length} registro(s) · Selecionadas: {selecionadas.length}
        </span>
        <BotoesRelatorio onExportarExcel={exportarExcel} onGerarPDF={gerarRelatorioPDF} abrirParaCima />
        <div style={{ flex: 1 }} />
        <button
          disabled={!podeReceber}
          onClick={() => podeReceber && setLoteRecebimento(contasSelecionadas)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 34,
            padding: '0 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: podeReceber ? '#185FA5' : 'var(--border-md)',
            color: podeReceber ? 'var(--surface)' : 'var(--text-muted)',
            cursor: podeReceber ? 'pointer' : 'not-allowed',
          }}
        >
          <DollarSign size={14} />
          {selecionadas.length > 1 ? `Receber (${selecionadas.length})` : 'Receber'}
        </button>
        <button
          disabled={!podeBaixarPrejuizo}
          onClick={() => setModalPrejuizo(true)}
          title={podeExcluirDireto ? 'Excluir por prejuízo' : 'Solicitar exclusão por prejuízo'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 34,
            padding: '0 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: 'transparent',
            border: podeBaixarPrejuizo ? '1px solid #FCA5A5' : '1px solid var(--border-md)',
            color: podeBaixarPrejuizo ? '#C53030' : 'var(--text-muted)',
            cursor: podeBaixarPrejuizo ? 'pointer' : 'not-allowed',
          }}
        >
          <Trash2 size={14} /> {podeExcluirDireto ? 'Excluir (prejuízo)' : 'Pedir exclusão'}
        </button>
      </div>
    </div>
  )
}

const thStyle = {
  padding: '8px 10px',
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--text-muted)',
  textAlign: 'left',
  background: 'var(--gray-50)',
  borderBottom: '1px solid var(--border-md)',
  position: 'sticky',
  top: 0,
}

const tdStyle = {
  padding: '9px 10px',
  fontSize: 13,
  borderBottom: '1px solid #F0F4FA',
}
