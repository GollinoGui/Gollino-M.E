import { useState, useEffect, useCallback, useRef } from 'react'
import {
  RefreshCw, TrendingUp, TrendingDown, Settings2, Save,
  ArrowUpRight, ArrowDownRight, PlusCircle, CreditCard,
} from 'lucide-react'

const fmt = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtPct = (v) => `${(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
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
  const custosSum = (resumo.custo_produtos || 0) + (resumo.taxa_cartao || 0) + (resumo.frete_compras || 0) + (resumo.despesas || 0)
  const lucro = resumo.lucro_real || 0
  const positivo = lucro >= 0
  const basis = Math.max(positivo ? receitaTotal : custosSum, 1)

  const categorias = [
    { key: 'custo', label: 'Custo de produtos', valor: resumo.custo_produtos || 0, cor: 'var(--chart-custo)' },
    { key: 'taxa', label: 'Taxa de cartão', valor: resumo.taxa_cartao || 0, cor: 'var(--chart-taxa)' },
    { key: 'frete', label: 'Frete de compras', valor: resumo.frete_compras || 0, cor: 'var(--chart-frete)' },
    { key: 'despesas', label: 'Despesas / Salários', valor: resumo.despesas || 0, cor: 'var(--chart-despesas)' },
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

  const maxV = Math.max(...dados.map((d) => d.receita || 0), ...dados.map((d) => (d.custo || 0) + (d.despesas || 0)), 1)
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
            const custoTotal = (d.custo || 0) + (d.despesas || 0)
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
            <div>Custos totais: <b>{fmt((hd.custo || 0) + (hd.despesas || 0))}</b></div>
            <div style={{ color: (hd.lucro || 0) >= 0 ? '#7CE29B' : '#FF9B9B', marginTop: 2 }}>
              Lucro real: <b>{fmt(hd.lucro)}</b>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FinanceiroLucro() {
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
  const custosTotais = (resumo?.custo_produtos || 0) + (resumo?.taxa_cartao || 0) + (resumo?.frete_compras || 0) + (resumo?.despesas || 0)

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

          {/* TENDÊNCIA DO LUCRO */}
          <div style={{ margin: '16px 20px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Lucro real — últimos {historico.length} meses</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Passe o mouse sobre o gráfico para ver o detalhe de cada mês</div>
            <TrendChart dados={historico} />
          </div>

          {/* RECEITA VS CUSTOS MENSAL */}
          <div style={{ margin: '16px 20px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Receita vs. custos totais por mês</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Custos totais = custo de produtos + taxas + frete + despesas</div>
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
                  {['Mês', 'Receita', 'Custo produtos', 'Taxas + frete + despesas', 'Lucro real'].map((h) => (
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
