import { useState, useEffect } from 'react'
import { Search, Plus, CheckCircle, RotateCcw } from 'lucide-react'

const fmt = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-'

const situacaoStyle = {
  A: { label: 'Em aberto', bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' },
  C: { label: 'Compensado', bg: '#F0FDF4', color: '#166534', border: '#86EFAC' },
  D: { label: 'Devolvido', bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5' },
}

function ModalCheque({ onClose, onSalvar, tipo }) {
  const [form, setForm] = useState({
    numero: '',
    banco: '',
    valor: '',
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: '',
    nome_pessoa: '',
    nro_docto: '',
    observacao: '',
  })
  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))
  const valido = form.valor && parseFloat(form.valor) > 0 && form.nome_pessoa

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-md)', width: 500, padding: 24, boxShadow: '0 16px 40px rgba(0,0,0,0.14)', animation: 'fadeIn 0.15s ease both' }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 18 }}>
          {tipo === 'R' ? 'Cheque a receber' : 'Cheque a pagar'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              {tipo === 'R' ? 'Nome do emitente *' : 'Nome do favorecido *'}
            </label>
            <input value={form.nome_pessoa} onChange={f('nome_pessoa')} style={{ width: '100%', height: 36, padding: '0 10px' }} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Valor (R$) *</label>
            <input value={form.valor} onChange={f('valor')} type='number' min='0' style={{ width: '100%', height: 36, padding: '0 10px' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Banco</label>
            <input value={form.banco} onChange={f('banco')} style={{ width: '100%', height: 36, padding: '0 10px' }} placeholder='Ex: Bradesco' />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nº do cheque</label>
            <input value={form.numero} onChange={f('numero')} style={{ width: '100%', height: 36, padding: '0 10px' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nº do documento / venda</label>
            <input value={form.nro_docto} onChange={f('nro_docto')} style={{ width: '100%', height: 36, padding: '0 10px' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Data de emissão</label>
            <input value={form.data_emissao} onChange={f('data_emissao')} type='date' style={{ width: '100%', height: 36, padding: '0 10px' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Data de vencimento</label>
            <input value={form.data_vencimento} onChange={f('data_vencimento')} type='date' style={{ width: '100%', height: 36, padding: '0 10px' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Observação</label>
            <input value={form.observacao} onChange={f('observacao')} style={{ width: '100%', height: 36, padding: '0 10px' }} placeholder='Opcional' />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-secondary)' }}>Cancelar</button>
          <button
            disabled={!valido}
            onClick={() => onSalvar({ ...form, tipo, valor: parseFloat(form.valor) })}
            style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', background: valido ? 'var(--blue-600)' : 'var(--gray-200)', color: valido ? '#fff' : 'var(--text-muted)', fontSize: 13, fontWeight: 500, cursor: valido ? 'pointer' : 'not-allowed' }}
          >
            Salvar cheque
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Cheques({ tipo = 'R' }) {
  const [cheques, setCheques] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroSit, setFiltroSit] = useState('todos')
  const [modal, setModal] = useState(false)
  const [sucesso, setSucesso] = useState('')

  useEffect(() => { carregar() }, [tipo])

  async function carregar() {
    if (!window.api.cheques) return
    const data = await window.api.cheques.listar({ tipo }).catch(() => [])
    setCheques(data)
  }

  function mostrarSucesso(msg) {
    setSucesso(msg)
    setTimeout(() => setSucesso(''), 2500)
  }

  async function salvar(form) {
    await window.api.cheques.salvar(form)
    await carregar()
    setModal(false)
    mostrarSucesso('Cheque salvo!')
  }

  async function compensar(id) {
    await window.api.cheques.baixar({ id })
    await carregar()
    mostrarSucesso('Cheque compensado!')
  }

  async function devolver(id) {
    await window.api.cheques.devolver({ id })
    await carregar()
    mostrarSucesso('Cheque marcado como devolvido.')
  }

  const filtrados = cheques.filter((c) => {
    const matchBusca = (c.nome_pessoa || '').toLowerCase().includes(busca.toLowerCase()) ||
      (c.numero || '').includes(busca)
    const matchSit = filtroSit === 'todos' || c.situacao === filtroSit
    return matchBusca && matchSit
  })

  const totalAberto = cheques.filter((c) => c.situacao === 'A').reduce((s, c) => s + (c.valor || 0), 0)
  const totalComp = cheques.filter((c) => c.situacao === 'C').reduce((s, c) => s + (c.valor || 0), 0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface)', position: 'relative' }}>
      {sucesso && (
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'var(--green-500)', color: '#fff', padding: '9px 22px', borderRadius: 'var(--radius-lg)', fontSize: 13, fontWeight: 500, zIndex: 300 }}>
          {sucesso}
        </div>
      )}
      {modal && <ModalCheque onClose={() => setModal(false)} onSalvar={salvar} tipo={tipo} />}

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
          <div style={{ fontSize: 11, color: '#854D0E', marginBottom: 2 }}>Em aberto</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#854D0E' }}>{fmt(totalAberto)}</div>
        </div>
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
          <div style={{ fontSize: 11, color: '#166534', marginBottom: 2 }}>Compensados</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#166534' }}>{fmt(totalComp)}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder='Buscar por nome ou número...' style={{ width: '100%', height: 34, paddingLeft: 32 }} />
        </div>
        <select value={filtroSit} onChange={(e) => setFiltroSit(e.target.value)} style={{ height: 34, padding: '0 10px', borderRadius: 'var(--radius-md)' }}>
          <option value='todos'>Todos</option>
          <option value='A'>Em aberto</option>
          <option value='C'>Compensados</option>
          <option value='D'>Devolvidos</option>
        </select>
        <button onClick={() => setModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: 'var(--blue-600)', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500 }}>
          <Plus size={14} /> Novo cheque
        </button>
      </div>

      {/* Tabela */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Nome', 'Nº cheque', 'Banco', 'Valor', 'Emissão', 'Vencimento', 'Situação', 'Ações'].map((h) => (
                <th key={h} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 13 }}>Nenhum cheque encontrado</td></tr>
            ) : filtrados.map((c) => {
              const st = situacaoStyle[c.situacao] || situacaoStyle.A
              const vencido = c.situacao === 'A' && c.data_vencimento && new Date(c.data_vencimento) < new Date()
              return (
                <tr key={c.id} style={{ transition: 'background 0.08s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{c.nome_pessoa || '-'}</td>
                  <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', fontFamily: 'monospace' }}>{c.numero || '-'}</td>
                  <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{c.banco || '-'}</td>
                  <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid var(--border)', color: tipo === 'R' ? '#15803D' : '#B91C1C' }}>{fmt(c.valor)}</td>
                  <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{fmtDate(c.data_emissao)}</td>
                  <td style={{ padding: '9px 10px', fontSize: 12, borderBottom: '1px solid var(--border)', color: vencido ? '#B91C1C' : 'var(--text-secondary)', fontWeight: vencido ? 600 : 400 }}>
                    {fmtDate(c.data_vencimento)}
                    {vencido && <span style={{ fontSize: 10, marginLeft: 4, background: '#FEF2F2', color: '#991B1B', padding: '1px 5px', borderRadius: 4 }}>vencido</span>}
                  </td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: '2px 9px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{st.label}</span>
                  </td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)' }}>
                    {c.situacao === 'A' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => compensar(c.id)} title='Compensar' style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--green-50)', color: 'var(--green-700)', border: '1px solid var(--green-100)', borderRadius: 'var(--radius-md)', fontSize: 12 }}>
                          <CheckCircle size={12} /> Compensar
                        </button>
                        <button onClick={() => devolver(c.id)} title='Devolvido' style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--red-50)', color: 'var(--red-500)', border: '1px solid var(--red-100)', borderRadius: 'var(--radius-md)', fontSize: 12 }}>
                          <RotateCcw size={12} /> Devolvido
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
