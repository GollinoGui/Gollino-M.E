import { useState, useEffect } from 'react'
import { Search, RefreshCw, Plus, Minus, CheckCircle } from 'lucide-react'

const fmt = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function ModalAjuste({ cliente, onClose, onConfirm }) {
  const [tipo, setTipo] = useState('credito')
  const [valor, setValor] = useState('')
  const [salvando, setSalvando] = useState(false)
  const valNum = parseFloat(valor) || 0
  const valido = valNum > 0

  async function handleConfirm() {
    setSalvando(true)
    await onConfirm(cliente.codigo, tipo === 'credito' ? valNum : -valNum)
    setSalvando(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border-md)', width: 400, boxShadow: '0 16px 40px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ background: 'var(--amber-500)', padding: '16px 20px' }}>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginBottom: 2 }}>AJUSTE DE HAVER</div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>{cliente.nome}</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }}>
            Saldo atual: <strong>{fmt(cliente.haver)}</strong>
          </div>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Tipo de ajuste</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ id: 'credito', label: 'Crédito (+)', color: '#22543D' }, { id: 'debito', label: 'Débito (−)', color: '#C53030' }].map(t => (
                <button key={t.id} onClick={() => setTipo(t.id)}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `2px solid ${tipo === t.id ? t.color : 'var(--border-md)'}`,
                    background: tipo === t.id ? (t.id === 'credito' ? '#F0FFF4' : '#FFF0F0') : 'var(--surface)',
                    color: tipo === t.id ? t.color : 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Valor (R$)</label>
            <input
              value={valor} onChange={e => setValor(e.target.value)}
              type='number' step='0.01' min='0' autoFocus
              placeholder='0,00'
              style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 14 }}
            />
            {valido && (
              <div style={{ fontSize: 12, marginTop: 6, color: tipo === 'credito' ? '#22543D' : '#C53030' }}>
                Novo saldo: <strong>{fmt(tipo === 'credito' ? cliente.haver + valNum : Math.max(0, cliente.haver - valNum))}</strong>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', background: 'var(--surface)' }}>
              Cancelar
            </button>
            <button disabled={!valido || salvando} onClick={handleConfirm}
              style={{ padding: '8px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: valido && !salvando ? 'pointer' : 'not-allowed',
                background: valido ? 'var(--amber-500)' : 'var(--border-md)', color: valido ? '#fff' : 'var(--text-muted)' }}>
              {salvando ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Haver({ usuario }) {
  const [dados, setDados] = useState([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [ajustando, setAjustando] = useState(null)
  const [sucesso, setSucesso] = useState('')

  async function carregar() {
    setLoading(true)
    try {
      const [lista, t] = await Promise.all([
        window.api.haver.listar(busca.trim() || undefined),
        window.api.haver.totalGeral(),
      ])
      setDados(lista)
      setTotal(t.total)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  async function confirmarAjuste(codigo, valor) {
    await window.api.haver.ajustar({ codigo, valor, usuario: usuario?.usuario || 'sistema' })
    setAjustando(null)
    setSucesso('Ajuste registrado com sucesso!')
    setTimeout(() => setSucesso(''), 3000)
    carregar()
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {ajustando && <ModalAjuste cliente={ajustando} onClose={() => setAjustando(null)} onConfirm={confirmarAjuste} />}

      {sucesso && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 10, padding: '12px 16px', margin: '16px 20px 0', color: '#22543D', fontSize: 13 }}>
          <CheckCircle size={16} style={{ color: '#38A169', flexShrink: 0 }} /> {sucesso}
        </div>
      )}

      {/* Cabeçalho */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, margin: 20, marginBottom: 0, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>TOTAL EM HAVER (todos os clientes)</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--amber-600)' }}>{fmt(total)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={busca} onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && carregar()}
              placeholder='Buscar por nome, código ou CPF/CNPJ...'
              style={{ width: '100%', height: 36, paddingLeft: 32, borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13 }}
            />
          </div>
          <button onClick={carregar}
            style={{ height: 36, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border-md)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', background: 'var(--surface)' }}
            title='Atualizar'>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ flex: 1, overflowY: 'auto', margin: '12px 20px 20px' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</div>
        ) : dados.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            {busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente com saldo em haver.'}
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Código', 'Nome', 'CPF/CNPJ', 'Telefone', 'Saldo em Haver', ''].map(h => (
                    <th key={h} style={{ padding: '9px 14px', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textAlign: h === 'Saldo em Haver' ? 'right' : 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dados.map(c => (
                  <tr key={c.codigo}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.codigo}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500 }}>{c.nome}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{c.cpf_cnpj || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{c.telefone || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, color: 'var(--amber-600)', textAlign: 'right' }}>{fmt(c.haver)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => setAjustando(c)} title='Ajustar haver'
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-md)', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', background: 'var(--surface)' }}>
                          <Plus size={12} /><Minus size={12} /> Ajustar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
