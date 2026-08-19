import { useState, useEffect } from 'react'
import { Search, Filter, DollarSign, RefreshCw, Trash2 } from 'lucide-react'
import ThOrdenavel from '../components/ThOrdenavel'
import { BotoesRelatorio } from '../components/BotoesRelatorio'
import ModalBaixarPrejuizo from '../components/ModalBaixarPrejuizo'
import StatusBadge from '../components/StatusBadge'
import { STATUS_CFG, getSituacao, isCartaoAutomatico } from '../utils/statusContas'
import { useOrdenacao } from '../utils/ordenacao'
import {
  exportarCSV,
  buscarEmpresa,
  gerarHtmlListaSimples,
  gerarHtmlSecoes,
  gerarPdfRelatorio,
  fmtMoedaBR,
} from '../utils/relatorios'
import { hojeLocal } from '../utils/data'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDate = (d) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-'

// Confirmação de recebimento — cobre tanto uma conta única (onde ainda dá pra
// ajustar o valor recebido, ex: recebimento parcial) quanto um lote de várias
// contas selecionadas (cada uma quitada pelo próprio valor em aberto). É a
// etapa de "conferir antes de receber": lista as contas resumidas e só
// efetiva ao clicar em Receber de novo, aqui dentro.
function ModalConfirmarRecebimento({ contas, onClose, onConfirm }) {
  const unico = contas.length === 1
  const emAberto = (c) => c.valor_docto - (c.valor_pagamento || 0)
  const totalEmAberto = contas.reduce((s, c) => s + emAberto(c), 0)
  // Quita a dívida mais antiga primeiro — é como o valor informado é
  // distribuído quando o cliente paga menos que o total das contas
  // selecionadas (ex: 2 contas de R$399,10 e R$240,10, cliente paga só
  // R$600 — a mais antiga quita inteira, a outra fica parcial).
  const contasOrdenadas = [...contas].sort((a, b) =>
    (a.data_vencimento || '9999-99-99').localeCompare(b.data_vencimento || '9999-99-99'),
  )
  const [forma, setForma] = useState(null)
  const [valorInformado, setValorInformado] = useState(totalEmAberto.toFixed(2))
  const [data, setData] = useState(hojeLocal())
  const [salvando, setSalvando] = useState(false)

  const valorFinal = parseFloat(valorInformado) || 0
  // Mesma tolerância de 0,01 que a RPC contas_receber_receber já usa pra
  // não rejeitar no front algo que o backend aceitaria (arredondamento).
  const excedeSaldo = parseFloat(valorInformado) > totalEmAberto + 0.01
  const valorValido = parseFloat(valorInformado) > 0 && !excedeSaldo
  const podeConfirmar = !!forma && valorValido

  let restante = valorFinal
  const alocacoes = contasOrdenadas.map((c) => {
    const aberto = emAberto(c)
    const aplicado = Math.max(0, Math.min(restante, aberto))
    restante = Math.max(0, restante - aplicado)
    return { conta: c, aberto, aplicado, falta: aberto - aplicado }
  })
  const falta = Math.max(totalEmAberto - valorFinal, 0)

  async function handleConfirm() {
    if (!podeConfirmar) return
    setSalvando(true)
    const pagamentos = alocacoes
      .filter((a) => a.aplicado > 0)
      .map((a) => ({ id: a.conta.id, valor_pagamento: a.aplicado }))
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
              ? `${contas[0].nome_cliente || '—'} (#${contas[0].codigo_cliente})${contas[0].telefone_cliente ? ' · ' + contas[0].telefone_cliente : ''}`
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
            {alocacoes.map((a, i) => (
              <div
                key={a.conta.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '8px 12px',
                  borderBottom: i < alocacoes.length - 1 ? '1px solid var(--border)' : 'none',
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
                    {a.conta.nome_cliente || '—'} (#{a.conta.codigo_cliente})
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    Venc. {fmtDate(a.conta.data_vencimento)}
                    {a.conta.nro_docto ? ` · Doc: ${a.conta.nro_docto}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: 600, color: a.aplicado > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {a.aplicado > 0 ? fmt(a.aplicado) : 'não recebe agora'}
                  </div>
                  {a.falta > 0.01 && (
                    <div style={{ fontSize: 10.5, color: '#B7791F' }}>
                      de {fmt(a.aberto)} · falta {fmt(a.falta)}
                    </div>
                  )}
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
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                {unico ? 'Valor recebido' : 'Total a receber agora'}
              </label>
              <input
                value={valorInformado}
                onChange={(e) => setValorInformado(e.target.value)}
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
              {valorInformado !== '' && excedeSaldo && (
                <div style={{ fontSize: 11, color: '#C53030', marginTop: 4 }}>
                  Valor não pode ser maior que o saldo em aberto ({fmt(totalEmAberto)}).
                </div>
              )}
              {valorInformado !== '' && !excedeSaldo && parseFloat(valorInformado) <= 0 && (
                <div style={{ fontSize: 11, color: '#C53030', marginTop: 4 }}>
                  Informe um valor maior que zero.
                </div>
              )}
              {valorValido && falta > 0.01 && (
                <div style={{ fontSize: 11, color: '#B7791F', marginTop: 4 }}>
                  Pagamento parcial — vai ficar faltando {fmt(falta)}
                  {!unico ? ` (veja o detalhe de cada conta acima)` : ''}.
                </div>
              )}
            </div>
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

// Depois de confirmar um recebimento, pergunta o que entra no PDF em vez de
// gerar sempre as mesmas 3 seções (recebido + aberto geral + vencido geral) —
// no dia a dia o que importa é mostrar pro cliente o que ele ainda deve, não
// a carteira inteira da loja.
function ModalOpcoesRelatorioBaixa({ recebidas, onFechar, onGerar }) {
  const [emAbertoCliente, setEmAbertoCliente] = useState(true)
  const [emAbertoGeral, setEmAbertoGeral] = useState(false)
  const [vencidasGeral, setVencidasGeral] = useState(false)

  const nomesClientes = [
    ...new Set(
      recebidas
        .map((r) => (r.conta?.nome_cliente ? `${r.conta.nome_cliente} (#${r.conta.codigo_cliente})` : r.conta?.codigo_cliente))
        .filter(Boolean),
    ),
  ]

  const opcoes = [
    {
      chave: 'emAbertoCliente',
      valor: emAbertoCliente,
      set: setEmAbertoCliente,
      label: `Em aberto — ${nomesClientes.length === 1 ? nomesClientes[0] : 'cliente(s) atendido(s)'}`,
      desc: 'O que esse(s) cliente(s) ainda deve, pra mostrar junto do recibo.',
    },
    {
      chave: 'emAbertoGeral',
      valor: emAbertoGeral,
      set: setEmAbertoGeral,
      label: 'Em aberto — todos os clientes',
      desc: 'Carteira inteira em aberto, dentro do prazo.',
    },
    {
      chave: 'vencidasGeral',
      valor: vencidasGeral,
      set: setVencidasGeral,
      label: 'Vencidas — todos os clientes',
      desc: 'Carteira inteira já vencida.',
    },
  ]

  return (
    <div
      style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 250,
      }}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border-md)',
          width: 400, padding: 22, boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Gerar relatório?</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Recebimento confirmado. Escolha o que entra no PDF.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {opcoes.map((o) => (
            <label
              key={o.chave}
              style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}
            >
              <input
                type='checkbox'
                checked={o.valor}
                onChange={(e) => o.set(e.target.checked)}
                style={{ width: 15, height: 15, marginTop: 2, flexShrink: 0 }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{o.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onFechar}
            style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-muted)' }}
          >
            Pular
          </button>
          <button
            onClick={() => onGerar({ emAbertoCliente, emAbertoGeral, vencidasGeral })}
            disabled={!emAbertoCliente && !emAbertoGeral && !vencidasGeral}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600,
              background: (emAbertoCliente || emAbertoGeral || vencidasGeral) ? '#185FA5' : 'var(--border-md)',
              color: (emAbertoCliente || emAbertoGeral || vencidasGeral) ? '#fff' : 'var(--text-muted)',
              cursor: (emAbertoCliente || emAbertoGeral || vencidasGeral) ? 'pointer' : 'not-allowed',
            }}
          >
            Gerar PDF
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Aba "Faturamento" ──────────────────────────────────────────
// Foco em duas perguntas do dono: quanto entrou (vendas do período, à vista
// x a prazo) e o que a carteira de contas a receber já devolveu em caixa
// (recebido no período, por forma) x o que ainda falta receber (saldo em
// aberto — este último é sempre "hoje", não faz sentido prender ao período).
function calcPeriodo(tipo) {
  const hoje = new Date()
  const hojeStr = hojeLocal()
  if (tipo === 'hoje') return { ini: hojeStr, fim: hojeStr }
  if (tipo === 'semana') {
    const d = new Date(hoje)
    d.setDate(d.getDate() - 6)
    return { ini: d.toISOString().slice(0, 10), fim: hojeStr }
  }
  if (tipo === 'mes') {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    return { ini: d.toISOString().slice(0, 10), fim: hojeStr }
  }
  const d = new Date(hoje.getFullYear(), 0, 1)
  return { ini: d.toISOString().slice(0, 10), fim: hojeStr }
}

const PERIODOS_FATURAMENTO = [
  { chave: 'hoje', label: 'Hoje' },
  { chave: 'semana', label: '7 dias' },
  { chave: 'mes', label: 'Este mês' },
  { chave: 'ano', label: 'Este ano' },
  { chave: 'custom', label: 'Personalizado' },
]

// ── Modal de detalhe: "de que compra é esse dinheiro?" ──────────────────
// Documento em contas_receber pode ser tipo_docto='VD' (nasceu de uma venda
// no sistema — busca os itens) ou outro tipo (ex: 'AB', saldo de abertura
// importado na migração, sem venda vinculada) — nesse caso avisa em vez de
// fingir que achou algo.
function ModalDetalheDocumento({ nroDocto, contaResumo, pagamentoContexto, onClose }) {
  const [venda, setVenda] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    window.api.vendas
      .buscar(nroDocto)
      .then((v) => {
        if (!cancelado) setVenda(v)
      })
      .catch((err) => console.error('Erro ao buscar venda:', err))
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [nroDocto])

  const itens = venda?.itens || []
  const totalItens = itens.reduce((s, i) => s + (i.valor_total || 0), 0)
  const temPago = contaResumo?.valor_pagamento != null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 220,
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 14,
          border: '1px solid var(--border-md)',
          width: 580,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
          overflow: 'hidden',
        }}
      >
        <div style={{ background: '#185FA5', padding: '16px 20px' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 2 }}>
            {contaResumo?.nome_cliente || venda?.nome_cliente || '—'}
            {contaResumo?.codigo_cliente ? ` (#${contaResumo.codigo_cliente})` : ''}
          </div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>Documento {nroDocto}</div>
        </div>

        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
          {pagamentoContexto && (
            <div
              style={{
                background: '#EAFBF0',
                border: '1px solid #B7E4C7',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 12, color: '#22863A', fontWeight: 600, marginBottom: 2 }}>
                Pago em {fmtDate(pagamentoContexto.data_pagamento)} · {pagamentoContexto.forma_recebimento || 'forma não informada'}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#22863A' }}>
                {fmt(pagamentoContexto.valor_pagamento)}
              </div>
              {pagamentoContexto.valor_desconto > 0 && (
                <div style={{ fontSize: 11, color: '#C53030', marginTop: 2 }}>
                  Desconto concedido: {fmt(pagamentoContexto.valor_desconto)}
                </div>
              )}
            </div>
          )}

          {contaResumo?.valor_docto != null && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: temPago ? 'repeat(3,1fr)' : '1fr',
                gap: 10,
                marginBottom: 18,
              }}
            >
              <Kpi label='Valor do documento' value={fmt(contaResumo.valor_docto)} color='var(--text-primary)' />
              {temPago && (
                <>
                  <Kpi label='Pago até agora' value={fmt(contaResumo.valor_pagamento)} color='#22863A' />
                  <Kpi
                    label='Em aberto'
                    value={fmt(contaResumo.valor_docto - contaResumo.valor_pagamento)}
                    color='#B7791F'
                  />
                </>
              )}
            </div>
          )}

          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 0.3 }}>
            ITENS DA VENDA
          </div>

          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Carregando...
            </div>
          ) : !venda ? (
            <div
              style={{
                padding: 16,
                color: 'var(--text-muted)',
                fontSize: 13,
                background: 'var(--gray-50)',
                borderRadius: 8,
              }}
            >
              <div style={{ textAlign: contaResumo?.observacao ? 'left' : 'center' }}>
                Esse documento não está vinculado a uma venda no sistema.
              </div>
              {contaResumo?.observacao && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Observação do lançamento:</strong> {contaResumo.observacao}
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                Venda #{venda.orcamento} · {fmtDate(venda.data)}
                {venda.usuario_cadastro ? ` · ${venda.usuario_cadastro}` : ''}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Produto', 'Un.', 'Qtd', 'Valor unit.', 'Total'].map((h, i) => (
                      <th key={h} style={{ ...thStyle, textAlign: i >= 2 ? 'right' : 'left' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {itens.map((it) => (
                    <tr key={it.id}>
                      <td style={tdStyle}>{it.descricao || it.desc_produto || it.codigo_produto}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{it.unidade || '-'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{it.quantidade}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(it.preco_unitario)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(it.valor_total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--gray-50)', borderTop: '2px solid var(--border-md)', fontWeight: 700 }}>
                    <td colSpan={4} style={{ ...tdStyle, fontSize: 12 }}>
                      TOTAL DOS ITENS
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(totalItens)}</td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-md)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-muted)' }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, color }) {
  return (
    <div
      style={{
        background: 'var(--gray-50)',
        borderRadius: 8,
        padding: '10px 14px',
        border: '1px solid var(--border-md)',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color }}>{value}</div>
    </div>
  )
}

function AbaFaturamento() {
  const [periodo, setPeriodo] = useState('mes')
  const mesAtual = calcPeriodo('mes')
  const [dataInicioCustom, setDataInicioCustom] = useState(mesAtual.ini)
  const [dataFimCustom, setDataFimCustom] = useState(mesAtual.fim)

  const auto = periodo !== 'custom' ? calcPeriodo(periodo) : null
  const dataInicio = auto ? auto.ini : dataInicioCustom
  const dataFim = auto ? auto.fim : dataFimCustom

  const [recebimentos, setRecebimentos] = useState([])
  const [vendasPeriodo, setVendasPeriodo] = useState([])
  const [chequesPorDocto, setChequesPorDocto] = useState({})
  const [totalEmAbertoGeral, setTotalEmAbertoGeral] = useState(0)
  const [loading, setLoading] = useState(true)
  const [detalhe, setDetalhe] = useState(null)

  async function carregar() {
    setLoading(true)
    try {
      const [pagtos, vds, aberto, chqs] = await Promise.all([
        window.api.contasReceber.listarPagamentos({ dataInicio, dataFim }),
        window.api.vendas.listar({ dataInicio, dataFim, situacao: 'N' }),
        window.api.contasReceber.totalAberto(),
        window.api.cheques.listar({ tipo: 'R' }),
      ])
      setRecebimentos(pagtos || [])
      setVendasPeriodo(vds || [])
      setTotalEmAbertoGeral(aberto?.total || 0)
      // cheque recebido na venda vira "Cheques a receber" com nro_docto = orçamento
      // (ver Vendas.jsx) — usado só pra saber se o cheque já era bom pra depositar
      // no dia da venda (à vista) ou é pré-datado (a prazo).
      const mapa = {}
      ;(chqs || []).forEach((c) => {
        if (c.nro_docto) mapa[c.nro_docto] = c
      })
      setChequesPorDocto(mapa)
    } catch (err) {
      console.error('Erro ao carregar faturamento:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicio, dataFim])

  const totalRecebidoPeriodo = recebimentos.reduce((s, r) => s + (r.valor_pagamento || 0), 0)
  const qtdContasRecebidas = new Set(recebimentos.map((r) => r.contas_receber_id)).size

  const porForma = {}
  recebimentos.forEach((r) => {
    const f = r.forma_recebimento || 'Não informado'
    porForma[f] = (porForma[f] || 0) + (r.valor_pagamento || 0)
  })

  // valor_pago_* (dinheiro/cartão/pix/...) não são preenchidos pelo fluxo
  // atual de venda — quem carrega o que foi pago na hora x o que foi pra
  // conta é valor_entrada (pago no ato) e valor_restante (vira contas a
  // receber), setados em Vendas.jsx ao finalizar. Ver checagem em produção
  // antes desta versão: valor_pago_contas_receber ficava sempre 0.
  //
  // Cheque é um caso à parte dentro de valor_entrada: só é "à vista" de
  // verdade se já pode ser depositado no dia da venda (já assinado, valor
  // certo). Cheque pré-datado (vencimento depois da venda) é a mesma
  // lógica de "pegar e pagar depois" da carteira — o dinheiro não está na
  // mão ainda — então reclassifica esse valor de à vista pra a prazo.
  const totalVendasPeriodo = vendasPeriodo.reduce((s, v) => s + (v.valor_total || 0), 0)
  const totalChequePreDatado = vendasPeriodo.reduce((s, v) => {
    if (!(v.valor_pago_cheque > 0)) return s
    const cheque = chequesPorDocto[v.orcamento]
    const preDatado = cheque?.data_vencimento && v.data && cheque.data_vencimento > v.data
    return preDatado ? s + v.valor_pago_cheque : s
  }, 0)
  const totalVistaBruto = vendasPeriodo.reduce((s, v) => s + (v.valor_entrada ?? (v.valor_total - (v.valor_restante || 0))), 0)
  const totalVista = totalVistaBruto - totalChequePreDatado
  const totalPrazo = vendasPeriodo.reduce((s, v) => s + (v.valor_restante || 0), 0) + totalChequePreDatado

  const recebimentosOrdenados = [...recebimentos].sort((a, b) =>
    (b.data_pagamento || '').localeCompare(a.data_pagamento || ''),
  )

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border-md)' }}>
        <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {PERIODOS_FATURAMENTO.map((p) => (
            <button
              key={p.chave}
              onClick={() => setPeriodo(p.chave)}
              style={{
                height: 32,
                padding: '0 14px',
                borderRadius: 8,
                fontSize: 12.5,
                border: periodo === p.chave ? '2px solid #185FA5' : '1px solid var(--border-md)',
                background: periodo === p.chave ? '#EBF3FC' : 'var(--surface)',
                color: periodo === p.chave ? '#185FA5' : 'var(--text-secondary)',
                fontWeight: periodo === p.chave ? 600 : 400,
              }}
            >
              {p.label}
            </button>
          ))}
          {periodo === 'custom' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>De</label>
                <input
                  type='date'
                  value={dataInicioCustom}
                  onChange={(e) => setDataInicioCustom(e.target.value)}
                  style={{ height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Até</label>
                <input
                  type='date'
                  value={dataFimCustom}
                  onChange={(e) => setDataFimCustom(e.target.value)}
                  style={{ height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13 }}
                />
              </div>
            </>
          )}
          <button
            onClick={carregar}
            style={{
              height: 32,
              padding: '0 10px',
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

        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.3 }}>
          VENDAS DO PERÍODO
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
          <Kpi label={`Total vendido (${vendasPeriodo.length} venda${vendasPeriodo.length === 1 ? '' : 's'})`} value={fmt(totalVendasPeriodo)} color='var(--text-primary)' />
          <Kpi label='Vendido à vista' value={fmt(totalVista)} color='#22863A' />
          <Kpi label='Vendido a prazo' value={fmt(totalPrazo)} color='#185FA5' />
        </div>
        {totalChequePreDatado > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -8, marginBottom: 14 }}>
            Inclui {fmt(totalChequePreDatado)} em cheque pré-datado, contado como a prazo (não como à vista).
          </div>
        )}

        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.3 }}>
          CONTAS A RECEBER
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          <Kpi label='Recebido no período' value={fmt(totalRecebidoPeriodo)} color='#22863A' />
          <Kpi label='Contas recebidas no período' value={String(qtdContasRecebidas)} color='var(--text-primary)' />
          <Kpi label='Ainda falta receber (hoje)' value={fmt(totalEmAbertoGeral)} color='#B7791F' />
        </div>

        {Object.keys(porForma).length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {Object.entries(porForma).map(([forma, valor]) => (
              <div
                key={forma}
                style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '7px 12px', border: '1px solid var(--border-md)' }}
              >
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{forma}: </span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#185FA5' }}>{fmt(valor)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</div>
        ) : recebimentosOrdenados.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Nenhum recebimento no período.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Data pagto.', 'Documento', 'Cliente', 'Forma', 'Valor recebido'].map((h) => (
                  <th
                    key={h}
                    style={{
                      ...thStyle,
                      textAlign: h === 'Valor recebido' ? 'right' : 'left',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recebimentosOrdenados.map((r) => (
                <tr
                  key={r.id}
                  onClick={() =>
                    setDetalhe({
                      nroDocto: r.nro_docto,
                      contaResumo: {
                        valor_docto: r.valor_docto,
                        nome_cliente: r.nome_cliente,
                        codigo_cliente: r.codigo_cliente,
                        observacao: r.observacao,
                      },
                      pagamentoContexto: {
                        data_pagamento: r.data_pagamento,
                        forma_recebimento: r.forma_recebimento,
                        valor_pagamento: r.valor_pagamento,
                        valor_desconto: r.valor_desconto,
                      },
                    })
                  }
                  style={{ cursor: 'pointer', transition: 'background 0.08s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  title='Ver detalhes da venda'
                >
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmtDate(r.data_pagamento)}</td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12, color: '#185FA5', textDecoration: 'underline' }}>
                    {r.nro_docto}
                  </td>
                  <td style={tdStyle}>
                    {r.nome_cliente || '—'} (#{r.codigo_cliente})
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{r.forma_recebimento || '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#22863A' }}>
                    {fmt(r.valor_pagamento)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--gray-50)', borderTop: '2px solid var(--border-md)', fontWeight: 700 }}>
                <td colSpan={4} style={{ ...tdStyle, fontSize: 12 }}>
                  TOTAL — {recebimentosOrdenados.length} recebimento(s)
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', color: '#22863A' }}>{fmt(totalRecebidoPeriodo)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {detalhe && (
        <ModalDetalheDocumento
          nroDocto={detalhe.nroDocto}
          contaResumo={detalhe.contaResumo}
          pagamentoContexto={detalhe.pagamentoContexto}
          onClose={() => setDetalhe(null)}
        />
      )}
    </div>
  )
}

export default function ContasReceber({ usuario }) {
  const [abaAtiva, setAbaAtiva] = useState('Contas')
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('aberto')
  const [selecionadas, setSelecionadas] = useState([])
  const [loteRecebimento, setLoteRecebimento] = useState(null)
  const [sucesso, setSucesso] = useState('')
  const [modalPrejuizo, setModalPrejuizo] = useState(false)
  const [aguardandoAprovacao, setAguardandoAprovacao] = useState(false)
  const [opcoesRelatorioBaixa, setOpcoesRelatorioBaixa] = useState(null) // recebidas | null
  const [detalheDocumento, setDetalheDocumento] = useState(null)
  const [dadosTotais, setDadosTotais] = useState([])

  // ── Carrega do banco ─────────────────────────────────────────
  // dados = respeita o filtro de status (o que a TABELA mostra). dadosTotais
  // = sempre todas as situações (exceto cancelada) — os cards do topo (Em
  // aberto/Recebido/Total vendido a prazo) não podem depender de qual filtro
  // está selecionado, senão "Total vendido a prazo" olhando só pro filtro
  // "Aberto" vira mentira (mostra só uma fatia do que já foi vendido, não o
  // total real).
  async function carregar() {
    setLoading(true)
    try {
      const filtros = {}
      if (filtroStatus === 'aberto') filtros.situacao = 'A'
      if (filtroStatus === 'baixado') filtros.situacao = 'P'
      if (filtroStatus === 'prejuizo') filtros.situacao = 'X'
      if (busca) filtros.cliente = busca

      const filtrosTotais = {}
      if (busca) filtrosTotais.cliente = busca

      const [result, totais] = await Promise.all([
        window.api.contasReceber.listar(filtros),
        window.api.contasReceber.listar(filtrosTotais),
      ])
      setDados(result)
      setDadosTotais(totais)
    } catch (err) {
      console.error('Erro ao carregar contas a receber:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [filtroStatus])

  const buscaLocal = (c) => {
    if (!busca) return true
    const b = busca.toLowerCase()
    return (
      (c.nome_cliente || '').toLowerCase().includes(b) ||
      (c.nro_docto || '').includes(busca) ||
      (c.codigo_cliente || '').includes(busca)
    )
  }

  // Busca local (já filtra pelo banco quando muda status)
  const filtrados = dados.filter(buscaLocal)

  // totaisFiltrados ignora o dropdown de status (só respeita a busca) — é a
  // base dos 3 cards do topo, pra "Total vendido a prazo" continuar sendo o
  // total de verdade mesmo com a tabela mostrando só "Aberto".
  const totaisFiltrados = dadosTotais.filter(buscaLocal)

  // Totalizadores (cards do topo)
  const totalEmAberto = totaisFiltrados
    .filter((c) => c.situacao_docto === 'A')
    .reduce((s, c) => s + (c.valor_docto - (c.valor_pagamento || 0)), 0)

  // Inclui recebimentos parciais em contas ainda abertas — antes só contava
  // documento 100% quitado (situacao_docto==='P'), então um pagamento
  // parcial recente ficava fora do "Recebido" mostrado ao dono.
  const totalPago = totaisFiltrados
    .filter((c) => c.situacao_docto !== 'C')
    .reduce((s, c) => s + (c.valor_pagamento || 0), 0)

  const totalDocto = totaisFiltrados
    .filter((c) => c.situacao_docto !== 'C')
    .reduce((s, c) => s + (c.valor_docto || 0), 0)

  // Parte de conta baixada por prejuízo (situacao_docto==='X') que nunca foi
  // paga — sem esse card, "Total vendido a prazo" continua incluindo esse
  // valor (a venda aconteceu de verdade), mas ele some de "Em aberto" (só
  // olha 'A') sem aparecer em "Recebido" (só entra o que foi pago antes da
  // baixa, se houve). Com o card, a identidade fecha:
  // Total vendido a prazo = Em aberto + Recebido + Prejuízo.
  const totalPrejuizo = totaisFiltrados
    .filter((c) => c.situacao_docto === 'X')
    .reduce((s, c) => s + (c.valor_docto - (c.valor_pagamento || 0)), 0)

  // Totais das linhas atualmente na TABELA (respeitam o filtro de status),
  // usados só nos relatórios Excel/PDF — o "TOTAL GERAL" do PDF tem que
  // bater com as linhas impressas nele, diferente dos cards do topo (sempre
  // gerais, ver totaisFiltrados acima).
  const totalPagoFiltrados = filtrados.reduce((s, c) => s + (c.valor_pagamento || 0), 0)
  const totalDoctoTabela = filtrados
    .filter((c) => c.situacao_docto !== 'C')
    .reduce((s, c) => s + (c.valor_docto || 0), 0)
  const totalEmAbertoTabela = filtrados
    .filter((c) => c.situacao_docto === 'A')
    .reduce((s, c) => s + (c.valor_docto - (c.valor_pagamento || 0)), 0)

  const { ordenados, coluna, direcao, alternar } = useOrdenacao(filtrados, {
    acessores: {
      nome_cliente: (c) => c.nome_cliente || c.codigo_cliente || '',
      em_aberto: (c) => c.valor_docto - (c.valor_pagamento || 0),
      situacao: (c) => getSituacao(c),
    },
  })

  // ── Relatório (Excel/PDF), em ordem de vencimento ───────────────────────
  function exportarExcel() {
    const porVencimento = [...filtrados].sort((a, b) =>
      (a.data_vencimento || '').localeCompare(b.data_vencimento || ''),
    )
    const linhas = porVencimento.map((c) => ({
      Documento: c.nro_docto || '—',
      Cliente: c.codigo_cliente ? `${c.nome_cliente} (#${c.codigo_cliente})` : c.nome_cliente,
      Vencimento: fmtDate(c.data_vencimento),
      'Valor (R$)': (c.valor_docto || 0).toFixed(2).replace('.', ','),
      'Pago (R$)': (c.valor_pagamento || 0).toFixed(2).replace('.', ','),
      'Em Aberto (R$)': (c.valor_docto - (c.valor_pagamento || 0)).toFixed(2).replace('.', ','),
      Situação: STATUS_CFG[getSituacao(c)].label,
    }))
    linhas.push({
      Documento: '',
      Cliente: 'TOTAL GERAL',
      Vencimento: '',
      'Valor (R$)': totalDoctoTabela.toFixed(2).replace('.', ','),
      'Pago (R$)': totalPagoFiltrados.toFixed(2).replace('.', ','),
      'Em Aberto (R$)': totalEmAbertoTabela.toFixed(2).replace('.', ','),
      Situação: '',
    })
    exportarCSV(linhas, `contas_receber_${new Date().toISOString().slice(0, 10)}`)
  }

  async function gerarRelatorioPDF() {
    const empresa = await buscarEmpresa()
    const porVencimento = [...filtrados].sort((a, b) =>
      (a.data_vencimento || '').localeCompare(b.data_vencimento || ''),
    )
    const colunas = [
      { label: 'Documento' },
      { label: 'Cliente' },
      { label: 'Vencimento' },
      { label: 'Valor', num: true },
      { label: 'Pago', num: true },
      { label: 'Em Aberto', num: true },
      { label: 'Situação' },
    ]
    const html = gerarHtmlListaSimples({
      empresa,
      titulo: 'Contas a Receber',
      subtitulo: `${filtrados.length} parcela(s), ordenadas por vencimento — gerado em ${fmtDate(new Date().toISOString().slice(0, 10))}`,
      colunas,
      linhas: porVencimento,
      montarLinha: (c) => {
        const emAberto = c.valor_docto - (c.valor_pagamento || 0)
        return `<tr><td>${c.nro_docto || '—'}</td><td>${c.nome_cliente || c.codigo_cliente || '—'}</td><td>${fmtDate(c.data_vencimento)}</td><td class="num">${fmtMoedaBR(c.valor_docto)}</td><td class="num">${fmtMoedaBR(c.valor_pagamento || 0)}</td><td class="num">${fmtMoedaBR(emAberto)}</td><td>${STATUS_CFG[getSituacao(c)].label}</td></tr>`
      },
      montarTotalGeral: () =>
        `<td colspan="3">TOTAL GERAL</td><td class="num">${fmtMoedaBR(totalDoctoTabela)}</td><td class="num">${fmtMoedaBR(totalPagoFiltrados)}</td><td class="num">${fmtMoedaBR(totalEmAbertoTabela)}</td><td></td>`,
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
            .map((f) => `• ${f.conta?.nome_cliente || '—'} (#${f.conta?.codigo_cliente || '?'}): ${f.erro}`)
            .join('\n'),
      )
    }

    if (recebidas.length > 0) {
      setSucesso(`✅ ${recebidas.length} conta(s) recebida(s)!`)
      setTimeout(() => setSucesso(''), 2500)
      setOpcoesRelatorioBaixa(recebidas)
    }
  }

  // Relatório em seções escolhidas pela secretária no ModalOpcoesRelatorioBaixa
  // — "recebidas nesta operação" sempre entra; "em aberto do cliente atendido",
  // "em aberto geral" e "vencidas geral" são opcionais, pra não imprimir a
  // carteira inteira da loja quando só interessa o que aquele cliente deve.
  async function gerarRelatorioRecebimento(recebidas, opcoes) {
    const codigosClientes = new Set(recebidas.map((r) => r.conta?.codigo_cliente).filter(Boolean))
    const empresa = await buscarEmpresa()
    const colunas = [
      { label: 'Cliente' },
      { label: 'Documento' },
      { label: 'Vencimento' },
      { label: 'Valor', num: true },
    ]
    const montarLinhaConta = (c) => {
      const emAberto = c.valor_docto - (c.valor_pagamento || 0)
      return `<tr><td>${c.nome_cliente || '—'} (#${c.codigo_cliente})</td><td>${c.nro_docto || '—'}</td><td>${fmtDate(c.data_vencimento)}</td><td class="num">${fmtMoedaBR(emAberto)}</td></tr>`
    }
    const montarLinhaRecebida = (r) =>
      `<tr><td>${r.conta?.nome_cliente || '—'} (#${r.conta?.codigo_cliente || '?'})</td><td>${r.conta?.nro_docto || '—'}</td><td>${fmtDate(r.conta?.data_vencimento)}</td><td class="num">${fmtMoedaBR(r.valor)}</td></tr>`
    const totalPorLista = (lista) => lista.reduce((s, c) => s + (c.valor_docto - (c.valor_pagamento || 0)), 0)

    const totalRecebido = recebidas.reduce((s, r) => s + r.valor, 0)
    const secoes = [
      {
        titulo: 'Recebidas nesta operação',
        colunas,
        linhas: recebidas,
        montarLinha: montarLinhaRecebida,
        montarTotal: () => `<td colspan="3">Total recebido</td><td class="num">${fmtMoedaBR(totalRecebido)}</td>`,
      },
    ]

    if (opcoes.emAbertoCliente || opcoes.emAbertoGeral || opcoes.vencidasGeral) {
      const abertas = (await window.api.contasReceber.listar({ situacao: 'A' })).filter(
        (c) => !isCartaoAutomatico(c),
      )
      const hoje = hojeLocal()

      if (opcoes.emAbertoCliente) {
        const doCliente = abertas.filter((c) => codigosClientes.has(c.codigo_cliente))
        secoes.push({
          titulo: 'Em aberto — cliente(s) atendido(s)',
          colunas,
          linhas: doCliente,
          montarLinha: montarLinhaConta,
          montarTotal: () => `<td colspan="3">Total em aberto</td><td class="num">${fmtMoedaBR(totalPorLista(doCliente))}</td>`,
        })
      }
      if (opcoes.emAbertoGeral) {
        const emAbertoList = abertas.filter((c) => !c.data_vencimento || c.data_vencimento >= hoje)
        secoes.push({
          titulo: 'Em aberto — todos os clientes',
          colunas,
          linhas: emAbertoList,
          montarLinha: montarLinhaConta,
          montarTotal: () => `<td colspan="3">Total em aberto</td><td class="num">${fmtMoedaBR(totalPorLista(emAbertoList))}</td>`,
        })
      }
      if (opcoes.vencidasGeral) {
        const vencidasList = abertas.filter((c) => c.data_vencimento && c.data_vencimento < hoje)
        secoes.push({
          titulo: 'Vencidas — todos os clientes',
          colunas,
          linhas: vencidasList,
          montarLinha: montarLinhaConta,
          montarTotal: () => `<td colspan="3">Total vencido</td><td class="num">${fmtMoedaBR(totalPorLista(vencidasList))}</td>`,
        })
      }
    }

    const html = gerarHtmlSecoes({
      empresa,
      titulo: 'Recebimento de Contas',
      subtitulo: `Gerado em ${fmtDate(new Date().toISOString().slice(0, 10))}`,
      secoes,
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
          cliente: c.nome_cliente ? `${c.nome_cliente} (#${c.codigo_cliente})` : c.codigo_cliente,
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

      {opcoesRelatorioBaixa && (
        <ModalOpcoesRelatorioBaixa
          recebidas={opcoesRelatorioBaixa}
          onFechar={() => setOpcoesRelatorioBaixa(null)}
          onGerar={async (opcoes) => {
            const recebidas = opcoesRelatorioBaixa
            setOpcoesRelatorioBaixa(null)
            try {
              await gerarRelatorioRecebimento(recebidas, opcoes)
            } catch (err) {
              console.error('Erro ao gerar relatório de recebimento:', err)
            }
          }}
        />
      )}

      {detalheDocumento && (
        <ModalDetalheDocumento
          nroDocto={detalheDocumento.nroDocto}
          contaResumo={detalheDocumento.contaResumo}
          onClose={() => setDetalheDocumento(null)}
        />
      )}

      {/* ── Abas ── */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-md)',
          background: 'var(--surface)',
          flexShrink: 0,
          padding: '0 16px',
        }}
      >
        {['Contas', 'Faturamento'].map((aba) => (
          <button
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            style={{
              padding: '11px 14px',
              fontSize: 13,
              fontWeight: abaAtiva === aba ? 600 : 400,
              color: abaAtiva === aba ? '#185FA5' : 'var(--text-secondary)',
              borderBottom: abaAtiva === aba ? '2px solid #185FA5' : '2px solid transparent',
              marginBottom: -1,
              transition: 'all 0.12s',
            }}
          >
            {aba}
          </button>
        ))}
      </div>

      {abaAtiva === 'Faturamento' ? (
        <AbaFaturamento />
      ) : (
        <>
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
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 10,
          }}
        >
          {[
            { label: 'Em aberto', value: fmt(totalEmAberto), color: '#185FA5' },
            { label: 'Recebido', value: fmt(totalPago), color: '#22863A' },
            { label: 'Prejuízo', value: fmt(totalPrejuizo), color: '#C53030' },
            { label: 'Total vendido a prazo', value: fmt(totalDocto), color: 'var(--text-primary)' },
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
              <col style={{ width: 85 }} />
              <col style={{ width: 85 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 85 }} />
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
                  { label: 'Data pagto.', chave: 'data_pagamento' },
                  { label: 'Vencimento', chave: 'data_vencimento' },
                  { label: 'Valor doc.', chave: 'valor_docto' },
                  { label: 'Pago', chave: 'valor_pagamento' },
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
                        color: '#185FA5',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDetalheDocumento({ nroDocto: c.nro_docto, contaResumo: c })
                      }}
                      title='Ver detalhes da venda'
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
                        {c.nome_cliente || '—'} (#{c.codigo_cliente})
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
                        color: c.data_pagamento ? '#22863A' : 'var(--text-muted)',
                        fontWeight: c.data_pagamento ? 500 : 400,
                      }}
                    >
                      {c.data_pagamento ? fmtDate(c.data_pagamento) : '-'}
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
                        color: c.valor_pagamento > 0 ? '#22863A' : 'var(--text-muted)',
                      }}
                    >
                      {c.valor_pagamento > 0 ? fmt(c.valor_pagamento) : '-'}
                    </td>
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
        </>
      )}
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
