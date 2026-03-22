import { useState, useEffect } from 'react'
import { Search, FileText, CheckCircle, Clock } from 'lucide-react'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

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

  async function carregar() {
    setCarregando(true)
    try {
      const dados = await window.api.nfe.listar({ dataInicio, dataFim, status, busca })
      setVendas(dados || [])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  function abrirModal(v) {
    setModal(v)
    setNfeInput(v.numero_nfe || '')
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
            width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Registrar NF-e
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              Venda #{modal.orcamento} — {modal.nome_cliente} — {fmt(modal.valor_total)}
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
            <col style={{ width: 110 }} />
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
                  {v.nome_cliente}
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
                  ) : (
                    <span style={{
                      background: '#FEF9C3', color: '#92400E', border: '1px solid #FDE68A',
                      padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                    }}>
                      Pendente
                    </span>
                  )}
                </td>
                <td style={{ padding: '9px 12px' }}>
                  <button
                    onClick={() => abrirModal(v)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      border: '1px solid var(--border)', color: 'var(--text-secondary)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <FileText size={12} /> {v.numero_nfe ? 'Editar' : 'Registrar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
