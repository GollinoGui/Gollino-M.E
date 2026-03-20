import { useState } from 'react'
import { Search, Plus, Filter, DollarSign, Edit2 } from 'lucide-react'

const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-'

const dadosIniciais = [
  { id: '1', descricao: 'Fornecedor Aço Total', categoria: 'Fornecedor', valor: 1250.00, vencimento: '2024-02-10', data_pagamento: null, situacao: 'ABERTO', forma_pagamento: '' },
  { id: '2', descricao: 'Conta de energia elétrica', categoria: 'Utilidades', valor: 380.50, vencimento: '2024-02-15', data_pagamento: null, situacao: 'ABERTO', forma_pagamento: '' },
  { id: '3', descricao: 'Aluguel do galpão', categoria: 'Aluguel', valor: 2200.00, vencimento: '2024-02-05', data_pagamento: null, situacao: 'VENCIDO', forma_pagamento: '' },
  { id: '4', descricao: 'Fornecedor Calhas Brasil', categoria: 'Fornecedor', valor: 890.00, vencimento: '2024-01-20', data_pagamento: '2024-01-20', situacao: 'PAGO', forma_pagamento: 'Transferência' },
  { id: '5', descricao: 'Internet + Telefone', categoria: 'Utilidades', valor: 199.90, vencimento: '2024-02-20', data_pagamento: null, situacao: 'ABERTO', forma_pagamento: '' },
  { id: '6', descricao: 'Contador', categoria: 'Serviços', valor: 450.00, vencimento: '2024-02-28', data_pagamento: null, situacao: 'ABERTO', forma_pagamento: '' },
]

function StatusBadge({ status }) {
  const cfg = {
    ABERTO: { bg: 'var(--blue-50)',  color: 'var(--blue-800)',  label: 'Aberto' },
    VENCIDO:{ bg: 'var(--red-50)',   color: 'var(--red-500)',   label: 'Vencido' },
    PAGO:   { bg: 'var(--green-50)', color: 'var(--green-700)', label: 'Pago' },
  }
  const s = cfg[status] || cfg.ABERTO
  return <span style={{ background: s.bg, color: s.color, padding: '2px 9px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>{s.label}</span>
}

function ModalPagar({ conta, onClose, onConfirm }) {
  const [forma, setForma] = useState('')
  const [valor, setValor] = useState(conta.valor.toFixed(2))
  const [data, setData] = useState(new Date().toISOString().split('T')[0])

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-md)', width: 420, boxShadow: '0 16px 40px rgba(0,0,0,0.14)', animation: 'fadeIn 0.15s ease both', overflow: 'hidden' }}>
        <div style={{ background: 'var(--blue-700)', padding: '16px 20px' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 2 }}>{conta.descricao}</div>
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 600 }}>{fmt(conta.valor)}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>Vencimento: {fmtDate(conta.vencimento)}</div>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Forma de pagamento</label>
              <select value={forma} onChange={e => setForma(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px' }} autoFocus>
                <option value="">Selecione...</option>
                <option>Dinheiro</option>
                <option>Transferência</option>
                <option>PIX</option>
                <option>Cheque</option>
                <option>Cartão</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Valor pago</label>
              <input value={valor} onChange={e => setValor(e.target.value)} type="number" style={{ width: '100%', height: 36, padding: '0 10px' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Data do pagamento</label>
              <input value={data} onChange={e => setData(e.target.value)} type="date" style={{ width: '100%', height: 36, padding: '0 10px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-secondary)' }}>Cancelar</button>
            <button disabled={!forma} onClick={() => onConfirm(conta.id, forma, parseFloat(valor), data)} style={{
              padding: '8px 20px', borderRadius: 'var(--radius-md)',
              background: forma ? 'var(--blue-700)' : 'var(--gray-200)',
              color: forma ? '#fff' : 'var(--text-muted)',
              fontSize: 13, fontWeight: 500, cursor: forma ? 'pointer' : 'not-allowed',
            }}>Confirmar pagamento</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalNova({ onClose, onSalvar }) {
  const [form, setForm] = useState({ descricao: '', categoria: 'Fornecedor', valor: '', vencimento: '', forma_pagamento: '' })
  const f = key => e => setForm(p => ({ ...p, [key]: e.target.value }))
  const valido = form.descricao && form.valor && form.vencimento

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-md)', width: 440, padding: 24, boxShadow: '0 16px 40px rgba(0,0,0,0.14)', animation: 'fadeIn 0.15s ease both' }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 18 }}>Nova conta a pagar</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Descrição *</label>
            <input value={form.descricao} onChange={f('descricao')} style={{ width: '100%', height: 36, padding: '0 10px' }} autoFocus placeholder="Ex: Fornecedor, Aluguel..." />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Categoria</label>
            <select value={form.categoria} onChange={f('categoria')} style={{ width: '100%', height: 36, padding: '0 10px' }}>
              <option>Fornecedor</option>
              <option>Aluguel</option>
              <option>Utilidades</option>
              <option>Serviços</option>
              <option>Impostos</option>
              <option>Outros</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Valor (R$) *</label>
            <input value={form.valor} onChange={f('valor')} type="number" style={{ width: '100%', height: 36, padding: '0 10px' }} placeholder="0,00" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Vencimento *</label>
            <input value={form.vencimento} onChange={f('vencimento')} type="date" style={{ width: '100%', height: 36, padding: '0 10px' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Forma de pagamento</label>
            <select value={form.forma_pagamento} onChange={f('forma_pagamento')} style={{ width: '100%', height: 36, padding: '0 10px' }}>
              <option value="">A definir</option>
              <option>Dinheiro</option>
              <option>Transferência</option>
              <option>PIX</option>
              <option>Cheque</option>
              <option>Cartão</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-secondary)' }}>Cancelar</button>
          <button disabled={!valido} onClick={() => onSalvar(form)} style={{
            padding: '8px 20px', borderRadius: 'var(--radius-md)',
            background: valido ? 'var(--blue-700)' : 'var(--gray-200)',
            color: valido ? '#fff' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 500, cursor: valido ? 'pointer' : 'not-allowed',
          }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

export default function ContasPagar() {
  const [dados, setDados] = useState(dadosIniciais)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [selecionadas, setSelecionadas] = useState([])
  const [contaPagando, setContaPagando] = useState(null)
  const [modalNova, setModalNova] = useState(false)
  const [sucesso, setSucesso] = useState('')

  const filtrados = dados.filter(c => {
    const matchBusca = c.descricao.toLowerCase().includes(busca.toLowerCase()) || c.categoria.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus === 'todos' || c.situacao === filtroStatus.toUpperCase()
    return matchBusca && matchStatus
  })

  const totalAberto = filtrados.filter(c => c.situacao !== 'PAGO').reduce((s, c) => s + c.valor, 0)
  const totalPago = filtrados.filter(c => c.situacao === 'PAGO').reduce((s, c) => s + c.valor, 0)
  const totalVencido = filtrados.filter(c => c.situacao === 'VENCIDO').reduce((s, c) => s + c.valor, 0)

  function toggleSel(id) { setSelecionadas(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]) }

  function confirmarPagamento(id, forma, valor, data) {
    setDados(prev => prev.map(c => c.id === id ? { ...c, situacao: 'PAGO', data_pagamento: data, forma_pagamento: forma } : c))
    setContaPagando(null)
    setSucesso('Pagamento registrado!')
    setTimeout(() => setSucesso(''), 2000)
  }

  function salvarNova(form) {
    const nova = { ...form, id: String(dados.length + 1), valor: parseFloat(form.valor), situacao: 'ABERTO', data_pagamento: null }
    setDados(prev => [...prev, nova])
    setModalNova(false)
    setSucesso('Conta adicionada!')
    setTimeout(() => setSucesso(''), 2000)
  }

  const contaSel = selecionadas.length === 1 ? dados.find(c => c.id === selecionadas[0]) : null

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', position: 'relative' }}>

      {sucesso && (
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'var(--green-500)', color: '#fff', padding: '9px 22px', borderRadius: 'var(--radius-lg)', fontSize: 13, fontWeight: 500, zIndex: 300, animation: 'fadeIn 0.2s ease' }}>{sucesso}</div>
      )}
      {contaPagando && <ModalPagar conta={contaPagando} onClose={() => setContaPagando(null)} onConfirm={confirmarPagamento} />}
      {modalNova && <ModalNova onClose={() => setModalNova(false)} onSalvar={salvarNova} />}

      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por descrição ou categoria..." style={{ width: '100%', height: 34, paddingLeft: 32 }} />
          </div>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ height: 34, padding: '0 10px', borderRadius: 'var(--radius-md)' }}>
            <option value="todos">Todos</option>
            <option value="aberto">Aberto</option>
            <option value="vencido">Vencido</option>
            <option value="pago">Pago</option>
          </select>
          <button style={{ height: 34, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-secondary)' }}>
            <Filter size={13} /> Filtrar
          </button>
          <button onClick={() => setModalNova(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: 'var(--blue-700)', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500 }}>
            <Plus size={14} /> Nova conta
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Em aberto', value: fmt(totalAberto), color: 'var(--blue-700)' },
            { label: 'Vencido', value: fmt(totalVencido), color: 'var(--red-500)' },
            { label: 'Pago no período', value: fmt(totalPago), color: 'var(--green-500)' },
          ].map(c => (
            <div key={c.label} style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '10px 14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{c.label}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 36 }} /><col /><col style={{ width: 100 }} />
            <col style={{ width: 90 }} /><col style={{ width: 90 }} />
            <col style={{ width: 90 }} /><col style={{ width: 110 }} /><col style={{ width: 80 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ padding: '8px 10px', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}></th>
              {['Descrição', 'Categoria', 'Vencimento', 'Valor', 'Dt. Pagamento', 'Forma', 'Situação'].map(h => (
                <th key={h} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map(c => {
              const sel = selecionadas.includes(c.id)
              return (
                <tr key={c.id} onClick={() => toggleSel(c.id)}
                  style={{ background: sel ? 'var(--blue-50)' : c.situacao === 'VENCIDO' ? 'var(--red-50)' : 'transparent', cursor: 'pointer', transition: 'background 0.08s' }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.background = c.situacao === 'VENCIDO' ? '#FEE2E2' : 'var(--gray-50)' }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.background = c.situacao === 'VENCIDO' ? 'var(--red-50)' : 'transparent' }}
                >
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                    <input type="checkbox" checked={sel} onChange={() => toggleSel(c.id)} style={{ width: 14, height: 14 }} />
                  </td>
                  <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.descricao}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{c.categoria}</span>
                  </td>
                  <td style={{ padding: '9px 10px', fontSize: 12, borderBottom: '1px solid var(--border)', color: c.situacao === 'VENCIDO' ? 'var(--red-500)' : undefined, fontWeight: c.situacao === 'VENCIDO' ? 500 : 400 }}>{fmtDate(c.vencimento)}</td>
                  <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid var(--border)', color: c.situacao === 'PAGO' ? 'var(--text-muted)' : 'var(--text-primary)' }}>{fmt(c.valor)}</td>
                  <td style={{ padding: '9px 10px', fontSize: 12, borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{fmtDate(c.data_pagamento)}</td>
                  <td style={{ padding: '9px 10px', fontSize: 12, borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{c.forma_pagamento || '-'}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)' }}><StatusBadge status={c.situacao} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ background: 'var(--gray-50)', borderTop: '1px solid var(--border)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Selecionadas: {selecionadas.length}</span>
        <div style={{ flex: 1 }} />
        <button
          disabled={!contaSel || contaSel.situacao === 'PAGO'}
          onClick={() => contaSel && setContaPagando(contaSel)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 16px',
            borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500,
            background: contaSel && contaSel.situacao !== 'PAGO' ? 'var(--blue-700)' : 'var(--gray-200)',
            color: contaSel && contaSel.situacao !== 'PAGO' ? '#fff' : 'var(--text-muted)',
            cursor: contaSel && contaSel.situacao !== 'PAGO' ? 'pointer' : 'not-allowed',
          }}>
          <DollarSign size={14} /> Registrar pagamento
        </button>
      </div>
    </div>
  )
}