import { useState, useEffect } from 'react'
import { Search, Plus, CheckCircle, XCircle } from 'lucide-react'

const fmt = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-'

// tipo: 'RECEITA' | 'VALE' | 'DESPESA'
const tipoConfig = {
  RECEITA: { label: 'Outras receitas', cor: '#15803D', corBg: '#F0FDF4', corBorder: '#86EFAC' },
  VALE:    { label: 'Vales',           cor: '#1E40AF', corBg: '#EFF6FF', corBorder: '#BFDBFE' },
  DESPESA: { label: 'Despesas',        cor: '#B91C1C', corBg: '#FEF2F2', corBorder: '#FCA5A5' },
}

const situacaoStyle = {
  A: { label: 'Em aberto',  bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' },
  P: { label: 'Pago/Recebido', bg: '#F0FDF4', color: '#166534', border: '#86EFAC' },
  C: { label: 'Cancelado',  bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' },
}

function ModalLancamento({ onClose, onSalvar, tipo }) {
  const cfg = tipoConfig[tipo] || tipoConfig.RECEITA
  const [form, setForm] = useState({
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    nome_pessoa: '',
    forma_pagamento: 'Dinheiro',
    observacao: '',
  })
  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))
  const valido = form.descricao && form.valor && parseFloat(form.valor) > 0

  const labels = {
    RECEITA: { nome: 'Recebido de', btnLabel: 'Registrar receita' },
    VALE:    { nome: 'Colaborador / Responsável', btnLabel: 'Registrar vale' },
    DESPESA: { nome: 'Pago a / Fornecedor', btnLabel: 'Registrar despesa' },
  }
  const lbl = labels[tipo] || labels.RECEITA

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-md)', width: 480, padding: 24, boxShadow: '0 16px 40px rgba(0,0,0,0.14)', animation: 'fadeIn 0.15s ease both' }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 18 }}>{cfg.label} — novo lançamento</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Descrição *</label>
            <input value={form.descricao} onChange={f('descricao')} style={{ width: '100%', height: 36, padding: '0 10px' }} autoFocus placeholder='Ex: Venda de sucata' />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Valor (R$) *</label>
            <input value={form.valor} onChange={f('valor')} type='number' min='0' style={{ width: '100%', height: 36, padding: '0 10px' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Data</label>
            <input value={form.data} onChange={f('data')} type='date' style={{ width: '100%', height: 36, padding: '0 10px' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{lbl.nome}</label>
            <input value={form.nome_pessoa} onChange={f('nome_pessoa')} style={{ width: '100%', height: 36, padding: '0 10px' }} placeholder='Opcional' />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Forma de pagamento</label>
            <select value={form.forma_pagamento} onChange={f('forma_pagamento')} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 'var(--radius-md)' }}>
              <option>Dinheiro</option>
              <option>PIX</option>
              <option>Cartão débito</option>
              <option>Cartão crédito</option>
              <option>Transferência</option>
              <option>Cheque</option>
              <option>Outros</option>
            </select>
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
            style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', background: valido ? cfg.cor : 'var(--gray-200)', color: valido ? '#fff' : 'var(--text-muted)', fontSize: 13, fontWeight: 500, cursor: valido ? 'pointer' : 'not-allowed' }}
          >
            {lbl.btnLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LancamentosExtras({ tipo = 'RECEITA', usuario }) {
  const cfg = tipoConfig[tipo] || tipoConfig.RECEITA
  const [lancamentos, setLancamentos] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroSit, setFiltroSit] = useState('todos')
  const [modal, setModal] = useState(false)
  const [sucesso, setSucesso] = useState('')

  useEffect(() => { carregar() }, [tipo])

  async function carregar() {
    if (!window.api.lancamentosExtras) return
    const data = await window.api.lancamentosExtras.listar({ tipo }).catch(() => [])
    setLancamentos(data)
  }

  function mostrarSucesso(msg) {
    setSucesso(msg)
    setTimeout(() => setSucesso(''), 2500)
  }

  async function salvar(form) {
    await window.api.lancamentosExtras.salvar(form)
    await carregar()
    setModal(false)
    mostrarSucesso('Lançamento salvo!')
  }

  async function pagar(id) {
    await window.api.lancamentosExtras.pagar({ id, usuario: usuario?.usuario || 'sistema' })
    await carregar()
    mostrarSucesso(tipo === 'RECEITA' ? 'Receita recebida!' : tipo === 'VALE' ? 'Vale pago!' : 'Despesa paga!')
  }

  async function cancelar(id) {
    if (!window.confirm('Cancelar este lançamento?')) return
    await window.api.lancamentosExtras.cancelar(id)
    await carregar()
    mostrarSucesso('Lançamento cancelado.')
  }

  const filtrados = lancamentos.filter((l) => {
    const matchBusca = (l.descricao || '').toLowerCase().includes(busca.toLowerCase()) ||
      (l.nome_pessoa || '').toLowerCase().includes(busca.toLowerCase())
    const matchSit = filtroSit === 'todos' || l.situacao === filtroSit
    return matchBusca && matchSit
  })

  const totalAberto = lancamentos.filter((l) => l.situacao === 'A').reduce((s, l) => s + (l.valor || 0), 0)
  const totalPago = lancamentos.filter((l) => l.situacao === 'P').reduce((s, l) => s + (l.valor || 0), 0)

  const addBtnLabel = tipo === 'RECEITA' ? 'Nova receita' : tipo === 'VALE' ? 'Novo vale' : 'Nova despesa'
  const pagarLabel = tipo === 'RECEITA' ? 'Receber' : tipo === 'VALE' ? 'Pagar vale' : 'Confirmar pag.'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface)', position: 'relative' }}>
      {sucesso && (
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'var(--green-500)', color: '#fff', padding: '9px 22px', borderRadius: 'var(--radius-lg)', fontSize: 13, fontWeight: 500, zIndex: 300 }}>
          {sucesso}
        </div>
      )}
      {modal && <ModalLancamento onClose={() => setModal(false)} onSalvar={salvar} tipo={tipo} />}

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
          <div style={{ fontSize: 11, color: '#854D0E', marginBottom: 2 }}>Em aberto</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#854D0E' }}>{fmt(totalAberto)}</div>
        </div>
        <div style={{ background: cfg.corBg, border: `1px solid ${cfg.corBorder}`, borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
          <div style={{ fontSize: 11, color: cfg.cor, marginBottom: 2 }}>
            {tipo === 'RECEITA' ? 'Total recebido' : 'Total pago'}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: cfg.cor }}>{fmt(totalPago)}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder='Buscar...' style={{ width: '100%', height: 34, paddingLeft: 32 }} />
        </div>
        <select value={filtroSit} onChange={(e) => setFiltroSit(e.target.value)} style={{ height: 34, padding: '0 10px', borderRadius: 'var(--radius-md)' }}>
          <option value='todos'>Todos</option>
          <option value='A'>Em aberto</option>
          <option value='P'>Pagos/Recebidos</option>
          <option value='C'>Cancelados</option>
        </select>
        <button onClick={() => setModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: cfg.cor, color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500 }}>
          <Plus size={14} /> {addBtnLabel}
        </button>
      </div>

      {/* Tabela */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Data', 'Descrição', 'Pessoa', 'Valor', 'Forma pag.', 'Situação', 'Ações'].map((h) => (
                <th key={h} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 13 }}>Nenhum lançamento encontrado</td></tr>
            ) : filtrados.map((l) => {
              const st = situacaoStyle[l.situacao] || situacaoStyle.A
              return (
                <tr key={l.id} style={{ transition: 'background 0.08s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{fmtDate(l.data)}</td>
                  <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{l.descricao}</td>
                  <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{l.nome_pessoa || '-'}</td>
                  <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid var(--border)', color: tipo === 'RECEITA' ? '#15803D' : '#B91C1C' }}>{fmt(l.valor)}</td>
                  <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{l.forma_pagamento || '-'}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: '2px 9px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{st.label}</span>
                  </td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)' }}>
                    {l.situacao === 'A' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => pagar(l.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--green-50)', color: 'var(--green-700)', border: '1px solid var(--green-100)', borderRadius: 'var(--radius-md)', fontSize: 12 }}>
                          <CheckCircle size={12} /> {pagarLabel}
                        </button>
                        <button onClick={() => cancelar(l.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'var(--red-50)', color: 'var(--red-500)', border: '1px solid var(--red-100)', borderRadius: 'var(--radius-md)', fontSize: 12 }}>
                          <XCircle size={12} />
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
