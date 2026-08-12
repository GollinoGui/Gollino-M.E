import { useState, useEffect, useCallback, useRef } from 'react'
import {
  RefreshCw, TrendingUp, TrendingDown, Settings2, Save,
  ArrowUpRight, ArrowDownRight, PlusCircle, CreditCard,
  Target, Plus, Trash2, Pencil, Search,
} from 'lucide-react'

const fmt = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtPct = (v) => `${(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
const fmtDate = (d) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-')
const fmtCompacto = (v) => (v || 0).toLocaleString('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
function mesLabel(mesStr) {
  if (!mesStr) return ''
  const [y, m] = mesStr.split('-')
  return `${MESES_ABREV[Number(m) - 1]}/${y.slice(2)}`
}

function mesAtual() {
  const hoje = new Date()
  const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  const fim = hoje.toISOString().slice(0, 10)
  return { ini, fim }
}

function mesAnterior() {
  const hoje = new Date()
  const ini = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().slice(0, 10)
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0).toISOString().slice(0, 10)
  return { ini, fim }
}

function anoAtual() {
  const hoje = new Date()
  const ini = new Date(hoje.getFullYear(), 0, 1).toISOString().slice(0, 10)
  const fim = hoje.toISOString().slice(0, 10)
  return { ini, fim }
}

// Período imediatamente anterior, com a mesma duração do período selecionado
function periodoAnterior(ini, fim) {
  const iniD = new Date(`${ini}T00:00:00`)
  const fimD = new Date(`${fim}T00:00:00`)
  const spanMs = fimD - iniD
  const prevFimD = new Date(iniD)
  prevFimD.setDate(prevFimD.getDate() - 1)
  const prevIniD = new Date(prevFimD.getTime() - spanMs)
  return { ini: prevIniD.toISOString().slice(0, 10), fim: prevFimD.toISOString().slice(0, 10) }
}

function mesAtualStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Primeiro e último dia do mês 'YYYY-MM', pra reaproveitar financeiro.resumoPeriodo
function limitesDoMes(mesStr) {
  const [y, m] = mesStr.split('-').map(Number)
  const ini = `${mesStr}-01`
  const fim = new Date(y, m, 0).toISOString().slice(0, 10)
  return { ini, fim }
}

const CHAVES_TAXA = {
  taxa_cartao_debito: 'Débito',
  taxa_cartao_credito_avista: 'Crédito à vista',
  taxa_cartao_credito_2_6x: 'Crédito 2x-6x',
  taxa_cartao_credito_7_12x: 'Crédito 7x-12x',
}

function roundedTopRectPath(x, y, w, h, r = 4) {
  if (h <= 0 || w <= 0) return ''
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`
}

function Card({ label, valor, cor, destaque, icon: Icon }) {
  return (
    <div style={{
      background: destaque ? 'var(--blue-50)' : 'var(--gray-50)',
      border: `1px solid ${destaque ? 'var(--blue-100)' : 'var(--border-md)'}`,
      borderRadius: 10, padding: '12px 16px', minWidth: 160, flex: destaque ? '1 1 220px' : '1 1 160px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
        {Icon && <Icon size={12} style={{ color: cor || 'var(--text-muted)' }} />}
        {label}
      </div>
      <div style={{ fontSize: destaque ? 22 : 16, fontWeight: 700, color: cor || 'var(--text-primary)' }}>{valor}</div>
    </div>
  )
}

function Legenda({ itens }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
      {itens.map((it) => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: it.cor, display: 'inline-block', flexShrink: 0 }} />
          {it.label}
        </div>
      ))}
    </div>
  )
}

// ── Hero: lucro real em destaque, com variação vs período anterior ──
function HeroLucro({ lucro, margem, lucroAnterior }) {
  const positivo = lucro >= 0
  const cor = positivo ? 'var(--green-500)' : 'var(--red-500)'
  const bg = positivo ? 'var(--green-50)' : 'var(--red-50)'
  const borda = positivo ? 'var(--green-100)' : 'var(--red-100)'
  const delta = lucroAnterior != null ? lucro - lucroAnterior : null
  const deltaBom = delta != null ? delta >= 0 : null

  return (
    <div style={{
      background: bg, border: `1px solid ${borda}`, borderRadius: 14,
      padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, minHeight: 148,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: cor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {positivo ? 'Lucro real do período' : 'Prejuízo no período'}
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, color: cor, letterSpacing: '-1px', lineHeight: 1 }}>
        {fmt(lucro)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--surface)', padding: '3px 10px', borderRadius: 99 }}>
          Margem {fmtPct(margem)}
        </span>
        {delta != null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: deltaBom ? 'var(--green-500)' : 'var(--red-500)' }}>
            {deltaBom ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {fmt(Math.abs(delta))} vs. período anterior
          </span>
        )}
      </div>
    </div>
  )
}

// ── Composição do período: de onde veio e para onde foi o dinheiro ──
function CompositionBar({ resumo }) {
  const [hover, setHover] = useState(null)
  const receitaTotal = (resumo.receita_bruta || 0) + (resumo.outras_receitas || 0)
  const custosSum = (resumo.custo_produtos || 0) + (resumo.taxa_cartao || 0) + (resumo.frete_compras || 0) + (resumo.despesas || 0) + (resumo.perdas_inadimplencia || 0)
  const lucro = resumo.lucro_real || 0
  const positivo = lucro >= 0
  const basis = Math.max(positivo ? receitaTotal : custosSum, 1)

  const categorias = [
    { key: 'custo', label: 'Custo de produtos', valor: resumo.custo_produtos || 0, cor: 'var(--chart-custo)' },
    { key: 'taxa', label: 'Taxa de cartão', valor: resumo.taxa_cartao || 0, cor: 'var(--chart-taxa)' },
    { key: 'frete', label: 'Frete de compras', valor: resumo.frete_compras || 0, cor: 'var(--chart-frete)' },
    { key: 'despesas', label: 'Despesas / Salários', valor: resumo.despesas || 0, cor: 'var(--chart-despesas)' },
    { key: 'perdas', label: 'Perdas (inadimplência)', valor: resumo.perdas_inadimplencia || 0, cor: '#8B2E2E' },
  ]
  const segmentos = categorias
    .filter((c) => c.valor > 0)
    .map((c) => ({ ...c, pct: (c.valor / basis) * 100 }))
  if (positivo && lucro > 0) {
    segmentos.push({ key: 'lucro', label: 'Lucro real', valor: lucro, cor: 'var(--green-500)', pct: (lucro / basis) * 100 })
  }

  return (
    <div>
      <div style={{ display: 'flex', height: 30, borderRadius: 8, background: 'var(--gray-100)' }}>
        {segmentos.map((s, i) => (
          <div
            key={s.key}
            onMouseEnter={() => setHover(s.key)}
            onMouseLeave={() => setHover(null)}
            style={{
              flex: `0 0 ${Math.max(s.pct, 0.6)}%`,
              background: s.cor,
              marginRight: i < segmentos.length - 1 ? 2 : 0,
              borderRadius: segmentos.length === 1 ? 8 : i === 0 ? '8px 0 0 8px' : i === segmentos.length - 1 ? '0 8px 8px 0' : 0,
              position: 'relative',
              filter: hover === s.key ? 'brightness(1.12)' : 'none',
              transition: 'filter .15s',
            }}
          >
            {hover === s.key && (
              <div style={{
                position: 'absolute', bottom: '100%', left: '50%', transform: 'translate(-50%, -8px)',
                background: 'var(--gray-800)', color: '#fff', padding: '6px 10px', borderRadius: 8,
                fontSize: 11, whiteSpace: 'nowrap', zIndex: 5, boxShadow: '0 4px 14px rgba(0,0,0,0.25)', pointerEvents: 'none',
              }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{fmt(s.valor)}</div>
                <div style={{ opacity: 0.8 }}>{s.label} · {s.pct.toFixed(1)}%</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {!positivo && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--red-50)', border: '1px solid var(--red-100)', borderRadius: 8, fontSize: 12, color: 'var(--red-700)', fontWeight: 600 }}>
          Custos superaram as entradas neste período — prejuízo de {fmt(Math.abs(lucro))}.
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <Legenda itens={[
          ...categorias.map((c) => ({ label: c.label, cor: c.cor })),
          positivo ? { label: 'Lucro real', cor: 'var(--green-500)' } : { label: 'Prejuízo', cor: 'var(--red-500)' },
        ]} />
      </div>
    </div>
  )
}

// ── Tendência do lucro real ao longo dos meses (linha/área divergente) ──
function TrendChart({ dados }) {
  const wrapRef = useRef(null)
  const [hover, setHover] = useState(null)
  if (!dados || dados.length === 0) {
    return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Sem histórico suficiente.</div>
  }

  const W = 900, H = 220
  const padL = 46, padR = 14, padT = 16, padB = 26
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const n = dados.length

  const valores = dados.map((d) => d.lucro || 0)
  const maxV = Math.max(...valores, 0)
  const minV = Math.min(...valores, 0)
  const span = (maxV - minV) || 1

  const yOf = (v) => padT + innerH - ((v - minV) / span) * innerH
  const xOf = (i) => (n <= 1 ? padL + innerW / 2 : padL + (i / (n - 1)) * innerW)
  const yZero = yOf(0)
  let zeroFrac = (yZero - padT) / innerH
  zeroFrac = Math.min(0.995, Math.max(0.005, zeroFrac))

  const pontos = dados.map((d, i) => ({ x: xOf(i), y: yOf(d.lucro || 0), d, i }))
  const linePath = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${pontos[n - 1].x},${yZero} L${pontos[0].x},${yZero} Z`

  const tickVals = [maxV, minV + span / 2, minV]

  function handleMove(e) {
    const rect = wrapRef.current.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * W
    let idx = n <= 1 ? 0 : Math.round(((relX - padL) / innerW) * (n - 1))
    idx = Math.max(0, Math.min(n - 1, idx))
    setHover(idx)
  }

  const hp = hover != null ? pontos[hover] : null
  const last = pontos[n - 1]
  const lastCor = (last.d.lucro || 0) >= 0 ? 'var(--green-500)' : 'var(--red-500)'

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={wrapRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: H, display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="tc-line" x1="0" y1={padT} x2="0" y2={padT + innerH} gradientUnits="userSpaceOnUse">
            <stop offset={zeroFrac} stopColor="var(--green-500)" />
            <stop offset={zeroFrac} stopColor="var(--red-500)" />
          </linearGradient>
          <linearGradient id="tc-area" x1="0" y1={padT} x2="0" y2={padT + innerH} gradientUnits="userSpaceOnUse">
            <stop offset={zeroFrac} stopColor="var(--green-500)" stopOpacity="0.16" />
            <stop offset={zeroFrac} stopColor="var(--red-500)" stopOpacity="0.16" />
          </linearGradient>
        </defs>

        {tickVals.map((v, i) => {
          const y = yOf(v)
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="var(--border-md)" strokeWidth="1" />
              <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="10" fill="var(--text-muted)">{fmtCompacto(v)}</text>
            </g>
          )
        })}
        {minV < 0 && maxV > 0 && (
          <line x1={padL} y1={yZero} x2={padL + innerW} y2={yZero} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="3,3" />
        )}

        <path d={areaPath} fill="url(#tc-area)" stroke="none" />
        <path d={linePath} fill="none" stroke="url(#tc-line)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {dados.map((d, i) => {
          if (i % Math.ceil(n / 12) !== 0 && i !== n - 1) return null
          return (
            <text key={i} x={xOf(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
              {mesLabel(d.mes)}
            </text>
          )
        })}

        <circle cx={last.x} cy={last.y} r={4} fill={lastCor} stroke="var(--surface)" strokeWidth="2" />
        <text x={last.x} y={last.y - 10} textAnchor="end" fontSize="11" fontWeight="700" fill={lastCor}>
          {fmt(last.d.lucro)}
        </text>

        {hp && (
          <g>
            <line x1={hp.x} y1={padT} x2={hp.x} y2={padT + innerH} stroke="var(--border-md)" strokeWidth="1" />
            <circle cx={hp.x} cy={hp.y} r={5} fill={(hp.d.lucro || 0) >= 0 ? 'var(--green-500)' : 'var(--red-500)'} stroke="var(--surface)" strokeWidth="2" />
          </g>
        )}
      </svg>

      {hp && (
        <div style={{
          position: 'absolute', top: 8, left: `${(hp.x / W) * 100}%`, transform: 'translateX(-50%)',
          background: 'var(--gray-800)', color: '#fff', padding: '8px 12px', borderRadius: 10,
          fontSize: 11, whiteSpace: 'nowrap', zIndex: 5, boxShadow: '0 6px 18px rgba(0,0,0,0.3)', pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 12 }}>{mesLabel(hp.d.mes)}</div>
          <div>Receita: <b>{fmt(hp.d.receita)}</b></div>
          <div>Custo produtos: <b>{fmt(hp.d.custo)}</b></div>
          <div>Taxas + frete + despesas: <b>{fmt(hp.d.despesas)}</b></div>
          {hp.d.perdas > 0 && <div>Perdas (inadimplência): <b>{fmt(hp.d.perdas)}</b></div>}
          <div style={{ color: (hp.d.lucro || 0) >= 0 ? '#7CE29B' : '#FF9B9B', marginTop: 2 }}>
            Lucro real: <b>{fmt(hp.d.lucro)}</b>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Receita vs. custos totais, mês a mês ──
function GroupedBars({ dados }) {
  const wrapRef = useRef(null)
  const [hover, setHover] = useState(null)
  if (!dados || dados.length === 0) {
    return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Sem histórico suficiente.</div>
  }

  const W = 900, H = 220
  const padL = 46, padR = 14, padT = 16, padB = 26
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const n = dados.length
  const groupW = innerW / n
  const barW = Math.min(22, (groupW - 16) / 2)
  const gap = 3

  const maxV = Math.max(...dados.map((d) => d.receita || 0), ...dados.map((d) => (d.custo || 0) + (d.despesas || 0) + (d.perdas || 0)), 1)
  const barH = (v) => (v / maxV) * innerH
  const tickVals = [maxV, maxV / 2, 0]

  function handleMove(e) {
    const rect = wrapRef.current.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * W
    let idx = Math.floor((relX - padL) / groupW)
    idx = Math.max(0, Math.min(n - 1, idx))
    setHover(idx)
  }

  const hd = hover != null ? dados[hover] : null
  const hx = hover != null ? padL + hover * groupW + groupW / 2 : 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Legenda itens={[{ label: 'Receita', cor: 'var(--blue-600)' }, { label: 'Custos totais', cor: 'var(--red-500)' }]} />
      </div>
      <div style={{ position: 'relative' }}>
        <svg
          ref={wrapRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: H, display: 'block' }}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          {tickVals.map((v, i) => {
            const y = padT + innerH - barH(v)
            return (
              <g key={i}>
                <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="var(--border-md)" strokeWidth="1" />
                <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="10" fill="var(--text-muted)">{fmtCompacto(v)}</text>
              </g>
            )
          })}

          {hover != null && (
            <rect x={padL + hover * groupW} y={padT} width={groupW} height={innerH} fill="var(--gray-100)" opacity="0.6" />
          )}

          {dados.map((d, i) => {
            const gx = padL + i * groupW
            const custoTotal = (d.custo || 0) + (d.despesas || 0) + (d.perdas || 0)
            const hReceita = barH(d.receita || 0)
            const hCusto = barH(custoTotal)
            const cx1 = gx + groupW / 2 - gap / 2 - barW
            const cx2 = gx + groupW / 2 + gap / 2
            return (
              <g key={i}>
                <path d={roundedTopRectPath(cx1, padT + innerH - hReceita, barW, hReceita, 3)} fill="var(--blue-600)" />
                <path d={roundedTopRectPath(cx2, padT + innerH - hCusto, barW, hCusto, 3)} fill="var(--red-500)" />
                <text x={gx + groupW / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                  {mesLabel(d.mes)}
                </text>
              </g>
            )
          })}
        </svg>

        {hd && (
          <div style={{
            position: 'absolute', top: 8, left: `${(hx / W) * 100}%`, transform: 'translateX(-50%)',
            background: 'var(--gray-800)', color: '#fff', padding: '8px 12px', borderRadius: 10,
            fontSize: 11, whiteSpace: 'nowrap', zIndex: 5, boxShadow: '0 6px 18px rgba(0,0,0,0.3)', pointerEvents: 'none',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 12 }}>{mesLabel(hd.mes)}</div>
            <div>Receita: <b>{fmt(hd.receita)}</b></div>
            <div>Custos totais: <b>{fmt((hd.custo || 0) + (hd.despesas || 0) + (hd.perdas || 0))}</b></div>
            <div style={{ color: (hd.lucro || 0) >= 0 ? '#7CE29B' : '#FF9B9B', marginTop: 2 }}>
              Lucro real: <b>{fmt(hd.lucro)}</b>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal de gasto (fixo/variável) ──
function ModalGasto({ onClose, onSalvar, mesReferencia, gastoInicial, fornecedoresLista }) {
  const [form, setForm] = useState({
    tipo: gastoInicial?.tipo || 'FIXO',
    descricao: gastoInicial?.descricao || '',
    valor: gastoInicial?.valor ?? '',
  })
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(() =>
    gastoInicial?.codigo_fornecedor
      ? fornecedoresLista.find((fo) => fo.codigo === gastoInicial.codigo_fornecedor) || null
      : null,
  )
  const [buscaFornecedor, setBuscaFornecedor] = useState('')
  const [mostrarFornecedores, setMostrarFornecedores] = useState(false)
  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))
  const valido = form.descricao.trim() && Number(form.valor) > 0
  const fornecedoresFiltrados = (
    buscaFornecedor ? fornecedoresLista.filter((fo) => fo.nome.toLowerCase().includes(buscaFornecedor.toLowerCase())) : fornecedoresLista
  ).slice(0, 8)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-md)', width: 420, padding: 22, boxShadow: '0 16px 40px rgba(0,0,0,0.14)' }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>{gastoInicial ? 'Editar gasto' : 'Novo gasto'}</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[['FIXO', 'Fixo — repete todo mês'], ['VARIAVEL', `Variável — só ${mesLabel(mesReferencia)}`]].map(([v, label]) => (
            <button key={v} type='button' onClick={() => setForm((p) => ({ ...p, tipo: v }))}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 'var(--radius-md)', fontSize: 12, cursor: 'pointer',
                border: `1px solid ${form.tipo === v ? 'var(--blue-600)' : 'var(--border-md)'}`,
                background: form.tipo === v ? 'var(--blue-50)' : 'var(--surface)',
                color: form.tipo === v ? 'var(--blue-700)' : 'var(--text-secondary)', fontWeight: 500,
              }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Descrição *</label>
          <input value={form.descricao} onChange={f('descricao')} autoFocus placeholder='Ex: Aluguel' style={{ width: '100%', height: 36, padding: '0 10px' }} />
        </div>
        <div style={{ marginBottom: 6 }}>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Valor mensal (R$) *</label>
          <input value={form.valor} onChange={f('valor')} type='number' min='0' step='0.01' style={{ width: '100%', height: 36, padding: '0 10px' }} />
        </div>

        {form.tipo === 'FIXO' && (
          <div style={{ marginBottom: 14, position: 'relative' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Vincular a um fornecedor (opcional)</label>
            <input
              value={fornecedorSelecionado ? fornecedorSelecionado.nome : buscaFornecedor}
              onChange={(e) => { setFornecedorSelecionado(null); setBuscaFornecedor(e.target.value); setMostrarFornecedores(true) }}
              onFocus={() => setMostrarFornecedores(true)}
              placeholder='Buscar fornecedor...'
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
            {fornecedorSelecionado && (
              <button type='button' onClick={() => { setFornecedorSelecionado(null); setBuscaFornecedor('') }}
                style={{ position: 'absolute', right: 8, top: 30, fontSize: 11, color: 'var(--text-muted)', background: 'transparent' }}>
                remover
              </button>
            )}
            {mostrarFornecedores && !fornecedorSelecionado && fornecedoresFiltrados.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 8, boxShadow: '0 8px 20px rgba(0,0,0,0.12)', zIndex: 30, maxHeight: 180, overflowY: 'auto' }}>
                {fornecedoresFiltrados.map((fo) => (
                  <div key={fo.codigo} onClick={() => { setFornecedorSelecionado(fo); setMostrarFornecedores(false) }}
                    style={{ padding: '7px 10px', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>#{fo.codigo}</span> · {fo.nome}
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Pra mostrar aqui se já foi pago esse mês em Contas a Pagar.
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
          {form.tipo === 'FIXO'
            ? 'Fica valendo todo mês até você editar ou remover.'
            : `Vale só para ${mesLabel(mesReferencia)} — no mês seguinte você lança de novo.`}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-secondary)' }}>Cancelar</button>
          <button
            disabled={!valido}
            onClick={() => onSalvar({
              id: gastoInicial?.id,
              tipo: form.tipo,
              descricao: form.descricao.trim(),
              valor: Number(form.valor),
              mes_referencia: mesReferencia,
              codigo_fornecedor: form.tipo === 'FIXO' ? (fornecedorSelecionado?.codigo || null) : null,
            })}
            style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', background: valido ? 'var(--blue-600)' : 'var(--gray-200)', color: valido ? '#fff' : 'var(--text-muted)', fontSize: 13, fontWeight: 500, cursor: valido ? 'pointer' : 'not-allowed' }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Lista de gastos (fixos | variáveis) com total. Fixos linkados a um
// fornecedor mostram o selo de conciliação com Contas a Pagar do mês. ──
function ListaGastos({ titulo, itens, total, onEditar, onExcluir, vazio, fornecedoresLista }) {
  return (
    <div style={{ flex: 1, minWidth: 240 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{titulo}</div>
        <div style={{ fontSize: 12, fontWeight: 700 }}>{fmt(total)}</div>
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        {itens.length === 0 ? (
          <div style={{ padding: '14px 12px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>{vazio}</div>
        ) : itens.map((g, i) => {
          const conta = g.conta_pagar_vinculada
          const fornecedorNome = g.codigo_fornecedor
            ? fornecedoresLista?.find((fo) => fo.codigo === g.codigo_fornecedor)?.nome
            : null
          const valorExibido = conta ? conta.valor_docto : g.valor
          return (
            <div key={g.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: 'var(--surface)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{g.descricao}</div>
                {g.codigo_fornecedor && (
                  <div style={{ fontSize: 10.5, marginTop: 2 }}>
                    {conta ? (
                      conta.situacao_docto === 'P' ? (
                        <span style={{ color: 'var(--green-500)', fontWeight: 600 }}>
                          ✅ pago {fmtDate(conta.data_pagamento || conta.data_vencimento)}
                        </span>
                      ) : (
                        <span style={{ color: '#B7791F', fontWeight: 600 }}>
                          ⏳ vence {fmtDate(conta.data_vencimento)}
                        </span>
                      )
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>
                        — não lançado esse mês{g.codigo_fornecedor ? ` (${fornecedorNome ? fornecedorNome + ' ' : ''}#${g.codigo_fornecedor})` : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(valorExibido)}</div>
              <button onClick={() => onEditar(g)} title='Editar' style={{ display: 'flex', padding: 4, color: 'var(--text-muted)', borderRadius: 6 }}>
                <Pencil size={13} />
              </button>
              <button onClick={() => onExcluir(g)} title='Remover' style={{ display: 'flex', padding: 4, color: 'var(--red-500)', borderRadius: 6 }}>
                <Trash2 size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Simulador de ponto de equilíbrio: gastos do mês + margem de contribuição
// real (derivada do mesmo resumo do Lucro Real) → faturamento/unidades
// necessárias pra pagar as contas e pra atingir um lucro alvo. É um cálculo
// separado do "Lucro Real" (que é por confronto patrimonial) — respondem
// perguntas diferentes: um é o que já aconteceu, o outro é planejamento.
function PontoDeEquilibrio({ usuario }) {
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualStr())
  const [gastos, setGastos] = useState([])
  const [resumoMes, setResumoMes] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalGasto, setModalGasto] = useState(null) // null | true (novo) | {...gasto} (editar)
  const [lucroAlvo, setLucroAlvo] = useState('')
  const [buscaProduto, setBuscaProduto] = useState('')
  const [produtosLista, setProdutosLista] = useState([])
  const [mostrarListaProdutos, setMostrarListaProdutos] = useState(false)
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [sucesso, setSucesso] = useState('')
  const [fornecedoresLista, setFornecedoresLista] = useState([])
  const [despesasCategoria, setDespesasCategoria] = useState([])

  const carregar = useCallback(async () => {
    setLoading(true)
    const { ini, fim } = limitesDoMes(mesSelecionado)
    // allSettled: se gastos_operacionais ainda não existir no banco (migração
    // não rodada), o resumo do mês continua carregando normalmente em vez de
    // travar tudo por causa de uma falha só.
    const [gRes, rRes, dRes] = await Promise.allSettled([
      window.api.gastosOperacionais.listar(mesSelecionado),
      window.api.financeiro.resumoPeriodo(ini, fim),
      window.api.gastosOperacionais.despesasCategoriaMes(mesSelecionado),
    ])
    if (gRes.status === 'fulfilled') setGastos(gRes.value || [])
    else console.error('Erro ao carregar gastos operacionais:', gRes.reason)
    if (rRes.status === 'fulfilled') setResumoMes(rRes.value)
    else console.error('Erro ao carregar resumo do mês:', rRes.reason)
    if (dRes.status === 'fulfilled') setDespesasCategoria(dRes.value || [])
    else console.error('Erro ao carregar despesas por categoria:', dRes.reason)
    setLoading(false)
  }, [mesSelecionado])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    window.api.fornecedores.listar({ situacao: 'A' }).then(setFornecedoresLista).catch(() => setFornecedoresLista([]))
  }, [])

  useEffect(() => {
    window.api.produtos.listar({ situacao: 'A', busca: buscaProduto || undefined })
      .then((data) => setProdutosLista((data || []).slice(0, 8)))
      .catch(() => setProdutosLista([]))
  }, [buscaProduto])

  function mostrarSucesso(msg) {
    setSucesso(msg)
    setTimeout(() => setSucesso(''), 2200)
  }

  async function salvarGasto(dados) {
    await window.api.gastosOperacionais.salvar({ ...dados, usuario: usuario?.usuario || usuario?.nome || 'sistema' })
    setModalGasto(null)
    await carregar()
    mostrarSucesso('Gasto salvo!')
  }

  async function excluirGasto(g) {
    if (!(await window.api.dialog.confirm(`Remover o gasto "${g.descricao}"?`))) return
    await window.api.gastosOperacionais.excluir(g.id)
    await carregar()
    mostrarSucesso('Gasto removido.')
  }

  const fixos = gastos.filter((g) => g.tipo === 'FIXO')
  const variaveis = gastos.filter((g) => g.tipo === 'VARIAVEL')
  // Fixo reconciliado usa o valor real lançado em Contas a Pagar esse mês
  // (mais preciso); sem reconciliação, usa o valor orçado digitado aqui.
  const totalFixos = fixos.reduce((s, g) => s + (g.conta_pagar_vinculada?.valor_docto ?? g.valor ?? 0), 0)
  const totalVariaveis = variaveis.reduce((s, g) => s + (g.valor || 0), 0)
  const totalDespesasCategoria = despesasCategoria.reduce((s, d) => s + (d.total || 0), 0)
  const gastosDoMes = totalFixos + totalVariaveis + totalDespesasCategoria

  const receita = resumoMes?.receita_bruta || 0
  const custoProdutos = resumoMes?.custo_produtos || 0
  const taxaCartao = resumoMes?.taxa_cartao || 0
  const temVendas = receita > 0
  const margemContribuicaoPct = temVendas ? (receita - custoProdutos - taxaCartao) / receita : 0
  const taxaCartaoPct = temVendas ? taxaCartao / receita : 0

  const lucroAlvoNum = Number(lucroAlvo) || 0
  const margemValida = temVendas && margemContribuicaoPct > 0
  const pontoEquilibrioRS = margemValida ? gastosDoMes / margemContribuicaoPct : null
  const faturamentoLucroAlvoRS = margemValida ? (gastosDoMes + lucroAlvoNum) / margemContribuicaoPct : null

  const margemUnit = produtoSelecionado
    ? produtoSelecionado.preco_venda_vista - (produtoSelecionado.preco_custo_atual || 0) - produtoSelecionado.preco_venda_vista * taxaCartaoPct
    : null
  const margemUnitValida = margemUnit != null && margemUnit > 0
  const unidadesEmpate = margemUnitValida ? Math.ceil(gastosDoMes / margemUnit) : null
  const unidadesLucroAlvo = margemUnitValida ? Math.ceil((gastosDoMes + lucroAlvoNum) / margemUnit) : null

  return (
    <div style={{ margin: '16px 20px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', position: 'relative' }}>
      {sucesso && (
        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: 'var(--green-500)', color: '#fff', padding: '7px 18px', borderRadius: 'var(--radius-lg)', fontSize: 12, fontWeight: 500, zIndex: 250 }}>
          {sucesso}
        </div>
      )}
      {modalGasto && (
        <ModalGasto
          onClose={() => setModalGasto(null)}
          onSalvar={salvarGasto}
          mesReferencia={mesSelecionado}
          gastoInicial={modalGasto === true ? null : modalGasto}
          fornecedoresLista={fornecedoresLista}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={14} /> Ponto de equilíbrio
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Planejamento: quanto preciso vender em {mesLabel(mesSelecionado)} pra pagar as contas do mês e pra sobrar o lucro que eu quero
          </div>
        </div>
        <input type='month' value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)}
          style={{ height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13 }} />
      </div>

      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</div>
      ) : (
        <>
          {/* GASTOS DO MÊS */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '16px 0' }}>
            <ListaGastos titulo={`Fixos (${fixos.length})`} itens={fixos} total={totalFixos}
              onEditar={setModalGasto} onExcluir={excluirGasto} vazio='Nenhum gasto fixo cadastrado.' fornecedoresLista={fornecedoresLista} />
            <ListaGastos titulo={`Variáveis (${variaveis.length})`} itens={variaveis} total={totalVariaveis}
              onEditar={setModalGasto} onExcluir={excluirGasto} vazio={`Nenhum gasto variável lançado em ${mesLabel(mesSelecionado)}.`} fornecedoresLista={fornecedoresLista} />
          </div>

          {/* DESPESAS VARIÁVEIS JÁ LANÇADAS NO CONTAS A PAGAR — somente leitura,
              puxado por categoria (Plano de Contas) em vez de recadastrado aqui. */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Despesas variáveis já lançadas (Contas a Pagar)
              </div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{fmt(totalDespesasCategoria)}</div>
            </div>
            {totalDespesasCategoria === 0 ? (
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Nenhuma compra de material de limpeza/escritório categorizada em {mesLabel(mesSelecionado)} — selecione a categoria (Plano de Contas) ao lançar essa nota em Contas a Pagar pra ela entrar aqui automático.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {despesasCategoria.filter((d) => d.total > 0).map((d) => (
                  <div key={d.codigo_plano_conta} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{d.categoria}</span>
                    <span style={{ fontWeight: 500 }}>{fmt(d.total)}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 6 }}>
              Não recadastre essas compras como gasto variável manual acima — já entram sozinhas aqui.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <button onClick={() => setModalGasto(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', background: 'var(--blue-600)', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              <Plus size={13} /> Gasto
            </button>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Gastos do mês: <b style={{ color: 'var(--text-primary)' }}>{fmt(gastosDoMes)}</b>
            </div>
          </div>

          {/* LUCRO ALVO */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Lucro que eu quero sobrar (R$)</label>
              <input type='number' min='0' step='100' value={lucroAlvo} onChange={(e) => setLucroAlvo(e.target.value)} placeholder='0'
                style={{ width: 160, height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13 }} />
            </div>
          </div>

          {!temVendas && (
            <div style={{ padding: '10px 14px', background: 'var(--amber-50, #FFFBEB)', border: '1px solid var(--amber-100, #FDE68A)', borderRadius: 8, fontSize: 12, color: 'var(--amber-700, #92400E)', marginBottom: 16 }}>
              Sem vendas registradas em {mesLabel(mesSelecionado)} ainda — a margem de contribuição real só aparece depois da primeira venda do mês.
            </div>
          )}
          {temVendas && !margemValida && (
            <div style={{ padding: '10px 14px', background: 'var(--red-50)', border: '1px solid var(--red-100)', borderRadius: 8, fontSize: 12, color: 'var(--red-700)', marginBottom: 16 }}>
              A margem de contribuição de {mesLabel(mesSelecionado)} está zerada ou negativa (custo de produtos + taxa de cartão consumiu toda a receita) — não dá pra calcular ponto de equilíbrio nesse cenário.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* CARD: NEGÓCIO */}
            <div style={{ background: 'var(--gray-50)', border: '1px solid var(--border-md)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Ponto de equilíbrio do negócio</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                Margem de contribuição de {mesLabel(mesSelecionado)}: <b>{margemValida ? fmtPct(margemContribuicaoPct * 100) : '—'}</b>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Faturamento pra pagar as contas</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{margemValida ? fmt(pontoEquilibrioRS) : '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Faturamento pra sobrar {fmt(lucroAlvoNum)} de lucro</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green-500)' }}>{margemValida ? fmt(faturamentoLucroAlvoRS) : '—'}</div>
              </div>
            </div>

            {/* CARD: PRODUTO ESPECÍFICO */}
            <div style={{ background: 'var(--gray-50)', border: '1px solid var(--border-md)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Calculadora por produto</div>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={produtoSelecionado ? produtoSelecionado.descricao : buscaProduto}
                  onChange={(e) => { setBuscaProduto(e.target.value); setProdutoSelecionado(null); setMostrarListaProdutos(true) }}
                  onFocus={() => setMostrarListaProdutos(true)}
                  placeholder='Buscar produto...'
                  style={{ width: '100%', height: 34, paddingLeft: 28, borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13 }}
                />
                {mostrarListaProdutos && !produtoSelecionado && produtosLista.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 8, boxShadow: '0 8px 20px rgba(0,0,0,0.12)', zIndex: 20, maxHeight: 220, overflowY: 'auto' }}>
                    {produtosLista.map((p) => (
                      <div key={p.codigo} onClick={() => { setProdutoSelecionado(p); setMostrarListaProdutos(false) }}
                        style={{ padding: '8px 10px', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <div style={{ fontWeight: 500 }}>
                          <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontWeight: 400 }}>#{p.codigo}</span> {p.descricao}
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>{fmt(p.preco_venda_vista)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!produtoSelecionado ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Selecione um produto pra simular.</div>
              ) : !margemUnitValida ? (
                <div style={{ fontSize: 12, color: 'var(--red-500)' }}>
                  Vendendo a {fmt(produtoSelecionado.preco_venda_vista)}, esse produto não cobre custo + taxa de cartão — margem de contribuição negativa.
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                    Margem de contribuição/unidade: <b>{fmt(margemUnit)}</b>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Unidades pra pagar as contas (sozinho)</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{unidadesEmpate.toLocaleString('pt-BR')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Unidades pra sobrar {fmt(lucroAlvoNum)}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green-500)' }}>{unidadesLucroAlvo.toLocaleString('pt-BR')}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function FinanceiroLucro({ usuario }) {
  const { ini, fim } = mesAtual()
  const [preset, setPreset] = useState('mes-atual')
  const [dataInicio, setDataInicio] = useState(ini)
  const [dataFim, setDataFim] = useState(fim)
  const [resumo, setResumo] = useState(null)
  const [resumoAnterior, setResumoAnterior] = useState(null)
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  const [editandoTaxas, setEditandoTaxas] = useState(false)
  const [taxas, setTaxas] = useState({})
  const [salvandoTaxas, setSalvandoTaxas] = useState(false)

  function aplicarPreset(p) {
    setPreset(p)
    if (p === 'mes-atual') { const r = mesAtual(); setDataInicio(r.ini); setDataFim(r.fim) }
    else if (p === 'mes-anterior') { const r = mesAnterior(); setDataInicio(r.ini); setDataFim(r.fim) }
    else if (p === 'ano-atual') { const r = anoAtual(); setDataInicio(r.ini); setDataFim(r.fim) }
  }

  const carregarResumo = useCallback(async () => {
    setLoading(true)
    setErro('')
    try {
      const { ini: prevIni, fim: prevFim } = periodoAnterior(dataInicio, dataFim)
      const [r, rPrev, h] = await Promise.all([
        window.api.financeiro.resumoPeriodo(dataInicio, dataFim),
        window.api.financeiro.resumoPeriodo(prevIni, prevFim).catch(() => null),
        window.api.financeiro.historicoMensal(12),
      ])
      setResumo(r)
      setResumoAnterior(rPrev)
      setHistorico(h || [])
    } catch (e) {
      console.error('Erro ao carregar lucro real:', e)
      setErro(e?.message || 'Erro ao carregar dados financeiros.')
    } finally {
      setLoading(false)
    }
  }, [dataInicio, dataFim])

  useEffect(() => { carregarResumo() }, [carregarResumo])

  useEffect(() => {
    async function carregarTaxas() {
      const valores = {}
      for (const chave of Object.keys(CHAVES_TAXA)) {
        const v = await window.api.config.get(chave).catch(() => null)
        valores[chave] = v != null ? Number(v) : 0
      }
      setTaxas(valores)
    }
    carregarTaxas()
  }, [])

  async function salvarTaxas() {
    setSalvandoTaxas(true)
    try {
      for (const chave of Object.keys(CHAVES_TAXA)) {
        await window.api.config.set({ chave, valor: Number(taxas[chave]) || 0 })
      }
      setEditandoTaxas(false)
      carregarResumo()
    } catch (e) {
      console.error('Erro ao salvar taxas:', e)
      setErro(e?.message || 'Erro ao salvar taxas.')
    } finally {
      setSalvandoTaxas(false)
    }
  }

  // Projeção: média simples do lucro dos últimos 3 meses fechados (exclui o mês corrente, ainda em curso)
  const mesCorrenteStr = new Date().toISOString().slice(0, 7)
  const mesesFechados = historico.filter((h) => h.mes !== mesCorrenteStr)
  const ultimos3 = mesesFechados.slice(-3)
  const mediaMensal = ultimos3.length > 0 ? ultimos3.reduce((s, h) => s + (h.lucro || 0), 0) / ultimos3.length : 0

  const lucro = resumo?.lucro_real || 0
  const corLucro = lucro >= 0 ? '#22863A' : '#C53030'
  const custosTotais = (resumo?.custo_produtos || 0) + (resumo?.taxa_cartao || 0) + (resumo?.frete_compras || 0) + (resumo?.despesas || 0) + (resumo?.perdas_inadimplencia || 0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflowY: 'auto' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, margin: 20, marginBottom: 0, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {[
            ['mes-atual', 'Mês atual'],
            ['mes-anterior', 'Mês anterior'],
            ['ano-atual', 'Ano atual'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => aplicarPreset(id)}
              style={{
                height: 34, padding: '0 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                border: `1px solid ${preset === id ? 'var(--blue-600)' : 'var(--border-md)'}`,
                background: preset === id ? 'var(--blue-600)' : 'var(--surface)',
                color: preset === id ? '#fff' : 'var(--text-secondary)',
              }}>
              {label}
            </button>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>De</label>
            <input type='date' value={dataInicio} onChange={(e) => { setPreset('custom'); setDataInicio(e.target.value) }}
              style={{ height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Até</label>
            <input type='date' value={dataFim} onChange={(e) => { setPreset('custom'); setDataFim(e.target.value) }}
              style={{ height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13 }} />
          </div>
          <button onClick={carregarResumo}
            style={{ height: 34, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border-md)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', background: 'var(--surface)' }}>
            <RefreshCw size={13} /> Atualizar
          </button>
          <button onClick={() => setEditandoTaxas((v) => !v)}
            style={{ height: 34, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border-md)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', background: 'var(--surface)', marginLeft: 'auto' }}>
            <Settings2 size={13} /> Taxas de cartão
          </button>
        </div>

        {editandoTaxas && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', padding: '12px 14px', background: 'var(--gray-50)', borderRadius: 8, marginBottom: 14 }}>
            {Object.entries(CHAVES_TAXA).map(([chave, label]) => (
              <div key={chave} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label} (%)</label>
                <input type='number' min='0' step='0.01' value={taxas[chave] ?? 0}
                  onChange={(e) => setTaxas((t) => ({ ...t, [chave]: e.target.value }))}
                  style={{ width: 90, height: 34, padding: '0 8px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13 }} />
              </div>
            ))}
            <button onClick={salvarTaxas} disabled={salvandoTaxas}
              style={{ height: 34, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--blue-600)', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', opacity: salvandoTaxas ? 0.6 : 1 }}>
              <Save size={13} /> {salvandoTaxas ? 'Salvando...' : 'Salvar taxas'}
            </button>
          </div>
        )}

        {erro && <div style={{ color: '#C53030', fontSize: 13, marginBottom: 10 }}>{erro}</div>}

        {loading && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</div>}
      </div>

      {!loading && resumo && (
        <>
          {/* HERO + RESUMO SECUNDÁRIO */}
          <div style={{ margin: '20px 20px 0', display: 'grid', gridTemplateColumns: 'minmax(260px, 1.1fr) 2fr', gap: 16 }}>
            <HeroLucro lucro={lucro} margem={resumo.margem_percentual} lucroAnterior={resumoAnterior?.lucro_real} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <Card label='Receita bruta' valor={fmt(resumo.receita_bruta)} cor='#185FA5' icon={TrendingUp} />
              <Card label='Outras receitas' valor={fmt(resumo.outras_receitas)} cor='#22863A' icon={PlusCircle} />
              <Card label='Custos totais' valor={fmt(custosTotais)} cor='#C53030' icon={TrendingDown} />
              <Card label='Taxa de cartão' valor={fmt(resumo.taxa_cartao)} cor='#B7791F' icon={CreditCard} />
            </div>
          </div>

          {/* COMPOSIÇÃO */}
          <div style={{ margin: '16px 20px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Composição do período</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>De onde veio e para onde foi o dinheiro</div>
            <CompositionBar resumo={resumo} />
          </div>

          <PontoDeEquilibrio usuario={usuario} />

          {/* TENDÊNCIA DO LUCRO */}
          <div style={{ margin: '16px 20px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Lucro real — últimos {historico.length} meses</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Passe o mouse sobre o gráfico para ver o detalhe de cada mês</div>
            <TrendChart dados={historico} />
          </div>

          {/* RECEITA VS CUSTOS MENSAL */}
          <div style={{ margin: '16px 20px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Receita vs. custos totais por mês</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Custos totais = custo de produtos + taxas + frete + despesas + perdas por inadimplência</div>
            <GroupedBars dados={historico} />
          </div>

          {/* ESTIMATIVA */}
          <div style={{ margin: '16px 20px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              {mediaMensal >= 0 ? <TrendingUp size={15} style={{ color: '#22863A' }} /> : <TrendingDown size={15} style={{ color: '#C53030' }} />}
              Estimativa (média dos últimos {ultimos3.length} meses fechados)
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Card label='Estimativa próximo mês' valor={fmt(mediaMensal)} cor={mediaMensal >= 0 ? '#22863A' : '#C53030'} />
              <Card label='Estimativa do ano' valor={fmt(mediaMensal * 12)} cor={mediaMensal >= 0 ? '#22863A' : '#C53030'} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
              Estimativa simples baseada na média de lucro real dos meses já fechados — não considera sazonalidade.
            </div>
          </div>

          {/* TABELA HISTÓRICO */}
          <div style={{ margin: '16px 20px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Mês', 'Receita', 'Custo produtos', 'Taxas + frete + despesas', 'Perdas', 'Lucro real'].map((h) => (
                    <th key={h} style={{ padding: '9px 14px', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textAlign: h === 'Mês' ? 'left' : 'right', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historico.map((h) => (
                  <tr key={h.mes} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500 }}>{h.mes}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(h.receita)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(h.custo)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(h.despesas)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', color: h.perdas > 0 ? '#C53030' : undefined }}>{fmt(h.perdas)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, textAlign: 'right', color: (h.lucro || 0) >= 0 ? '#22863A' : '#C53030' }}>{fmt(h.lucro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
