import { useState, useEffect } from 'react'

const CATEGORIAS = [
  { value: '', label: 'Todos' },
  { value: 'VENDA', label: 'Vendas' },
  { value: 'CANCELAMENTO', label: 'Cancelamentos' },
  { value: 'RECEBIMENTO', label: 'Recebimentos' },
  { value: 'ESTOQUE_', label: 'Estoque' },
  { value: 'CAIXA_', label: 'Caixa' },
]

const ICONES = {
  VENDA:             { icon: '🛒', bg: '#EFF6FF', cor: '#1E40AF', label: 'Venda' },
  CANCELAMENTO:      { icon: '✕',  bg: '#FEF2F2', cor: '#991B1B', label: 'Cancelamento' },
  RECEBIMENTO:       { icon: '💰', bg: '#F0FDF4', cor: '#166534', label: 'Recebimento' },
  ESTOQUE_ENTRADA:   { icon: '+',  bg: '#ECFDF5', cor: '#065F46', label: 'Entrada estoque' },
  ESTOQUE_SAIDA:     { icon: '−',  bg: '#FEF2F2', cor: '#991B1B', label: 'Saída estoque' },
  ESTOQUE_ACERTO:    { icon: '⟳',  bg: '#EFF6FF', cor: '#1E40AF', label: 'Acerto estoque' },
  CAIXA_ABERTURA:    { icon: '▶',  bg: '#F0FDF4', cor: '#15803D', label: 'Abertura caixa' },
  CAIXA_FECHAMENTO:  { icon: '■',  bg: '#FEF9C3', cor: '#854D0E', label: 'Fechamento caixa' },
}

function getInfo(categoria) {
  return ICONES[categoria] || { icon: '·', bg: '#F3F4F6', cor: '#374151', label: categoria }
}

function fmtVal(v) {
  if (v == null || v === '' || v === 0) return null
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d) {
  if (!d) return ''
  const [y, m, dia] = d.split('-')
  return `${dia}/${m}/${y}`
}

export default function LogSistema() {
  const hoje = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })()

  const [entradas, setEntradas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [filtro, setFiltro] = useState({ dataInicio: hoje, dataFim: hoje, categoria: '' })

  async function carregar() {
    setCarregando(true)
    try {
      const f = {}
      if (filtro.dataInicio) f.dataInicio = filtro.dataInicio
      if (filtro.dataFim) f.dataFim = filtro.dataFim
      if (filtro.categoria) f.categoria = filtro.categoria
      const dados = await window.api.log.listar(f)
      setEntradas(dados || [])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Filtros */}
      <div style={{
        padding: '10px 16px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-end',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>De</label>
          <input
            type='date'
            value={filtro.dataInicio}
            onChange={e => setFiltro(f => ({ ...f, dataInicio: e.target.value }))}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 13 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Até</label>
          <input
            type='date'
            value={filtro.dataFim}
            onChange={e => setFiltro(f => ({ ...f, dataFim: e.target.value }))}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 13 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tipo</label>
          <select
            value={filtro.categoria}
            onChange={e => setFiltro(f => ({ ...f, categoria: e.target.value }))}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 13 }}
          >
            {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <button
          onClick={carregar}
          style={{ padding: '6px 18px', borderRadius: 6, background: 'var(--blue-700)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          {carregando ? 'Carregando…' : 'Atualizar'}
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 4 }}>
          {entradas.length} registro{entradas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {entradas.length === 0 && !carregando && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 60, fontSize: 14 }}>
            Nenhum registro encontrado
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entradas.map((e, i) => {
            const info = getInfo(e.categoria)
            const val = fmtVal(e.valor)
            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}>
                {/* Badge */}
                <div style={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: 6,
                  background: info.bg,
                  color: info.cor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  border: `1px solid ${info.cor}30`,
                }}>
                  {info.icon}
                </div>

                {/* Conteúdo */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: info.cor }}>{info.label}</span>
                    {e.ref && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{e.ref}</span>
                    )}
                    {val && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginLeft: 'auto' }}>
                        R$ {val}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.descricao}
                    {e.extra && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> — {e.extra}</span>}
                  </div>
                </div>

                {/* Data/hora + usuário */}
                <div style={{ textAlign: 'right', flexShrink: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <div>{fmtDate(e.data)}</div>
                  {e.hora && <div>{e.hora.slice(0, 5)}</div>}
                  {e.usuario && <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{e.usuario}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
