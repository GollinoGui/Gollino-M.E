import { useState, useMemo } from 'react'
import { Search, Plus, Trash2, Package, FileText, Printer } from 'lucide-react'
import { produtos as todosProds, clientes } from '../data/mock'

const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = d => new Date(d).toLocaleDateString('pt-BR')

function StatusBadge({ status }) {
  const cfg = {
    ABERTA:    { bg: 'var(--blue-50)',   color: 'var(--blue-800)',  label: 'Aberta' },
    BAIXADA:   { bg: 'var(--green-50)',  color: 'var(--green-700)', label: 'Baixada' },
    CANCELADA: { bg: 'var(--red-50)',    color: 'var(--red-500)',   label: 'Cancelada' },
  }
  const s = cfg[status] || cfg.ABERTA
  return <span style={{ background: s.bg, color: s.color, padding: '2px 9px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>{s.label}</span>
}

const preVendasIniciais = [
  { id: '00000055', numero: '00000055', tipo: 'CONDICIONAL', cliente_id: '000066', cliente_nome: 'Arnaldo Leonidas', vendedor: 'Geral', data: '2024-01-26', valor_total: 37.90, qtde_itens: 1, situacao: 'ABERTA', itens: [{ id: '00000215', codigo: '00000215', descricao: 'Calha alumínio 3m', qty: 1, preco_unitario: 37.90, total: 37.90 }] },
  { id: '00000056', numero: '00000056', tipo: 'CONDICIONAL', cliente_id: '000066', cliente_nome: 'Arnaldo Leonidas', vendedor: 'Geral', data: '2024-01-26', valor_total: 129.00, qtde_itens: 2, situacao: 'ABERTA', itens: [{ id: '00000089', codigo: '00000089', descricao: 'Rufo simples 0,43mm', qty: 2, preco_unitario: 28.50, total: 57.00 }, { id: '00000312', codigo: '00000312', descricao: 'Chapa galvanizada 26 1,20×3m', qty: 1, preco_unitario: 72.00, total: 72.00 }] },
]

function ModalItem({ produto, onConfirm, onClose }) {
  const [qty, setQty] = useState('1')
  const [desc, setDesc] = useState('0')
  const total = (parseFloat(qty) || 0) * produto.preco_vista * (1 - (parseFloat(desc) || 0) / 100)
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-md)', width: 400, padding: 24, boxShadow: '0 16px 40px rgba(0,0,0,0.14)', animation: 'fadeIn 0.15s ease both' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{produto.codigo}</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{produto.descricao}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Quantidade</label>
            <input value={qty} onChange={e => setQty(e.target.value)} type="number" min="0.001" step="0.001" style={{ width: '100%', height: 36, padding: '0 10px' }} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Preço unitário</label>
            <input value={produto.preco_vista.toFixed(2)} readOnly style={{ width: '100%', height: 36, padding: '0 10px', background: 'var(--gray-50)' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Desconto %</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} type="number" min="0" max="100" style={{ width: '100%', height: 36, padding: '0 10px' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Total do item</label>
            <div style={{ height: 36, padding: '0 10px', display: 'flex', alignItems: 'center', background: 'var(--blue-50)', border: '1px solid var(--blue-100)', borderRadius: 'var(--radius-md)', color: 'var(--blue-800)', fontWeight: 600, fontSize: 15 }}>{fmt(total)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-secondary)' }}>Cancelar</button>
          <button onClick={() => onConfirm({ ...produto, qty: parseFloat(qty) || 1, desconto: parseFloat(desc) || 0, total })} style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', background: 'var(--blue-700)', color: '#fff', fontSize: 13, fontWeight: 500 }}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default function PreVendas() {
  const [preVendas, setPreVendas] = useState(preVendasIniciais)
  const [view, setView] = useState('lista')
  const [editando, setEditando] = useState(null)
  const [busca, setBusca] = useState('')
  const [buscaProd, setBuscaProd] = useState('')
  const [itemModal, setItemModal] = useState(null)
  const [sucesso, setSucesso] = useState('')

  const formVazio = { tipo: 'CONDICIONAL', cliente_id: '000001', cliente_nome: 'Consumidor a vista', vendedor: 'Geral', observacao: '', itens: [] }
  const [form, setForm] = useState(formVazio)
  const [clienteDropdown, setClienteDropdown] = useState(false)
  const [clienteBusca, setClienteBusca] = useState('')

  const filtradas = preVendas.filter(p =>
    p.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.numero.includes(busca)
  )

  const prodsFiltrados = useMemo(() =>
    todosProds.filter(p => p.descricao.toLowerCase().includes(buscaProd.toLowerCase()) || p.codigo.includes(buscaProd))
  , [buscaProd])

  const clientesFiltrados = clientes.filter(c => c.nome.toLowerCase().includes(clienteBusca.toLowerCase()))
  const totalForm = form.itens.reduce((s, i) => s + i.total, 0)

  function novaPreVenda() {
    setForm({ ...formVazio, itens: [] })
    setView('form')
    setEditando(null)
  }

  function editarPreVenda(pv) {
    setForm({ ...pv })
    setEditando(pv.id)
    setView('form')
  }

  function addItem(item) {
    setForm(prev => {
      const existing = prev.itens.findIndex(i => i.id === item.id)
      if (existing >= 0) {
        const itens = [...prev.itens]
        itens[existing] = { ...itens[existing], qty: itens[existing].qty + item.qty, total: itens[existing].total + item.total }
        return { ...prev, itens }
      }
      return { ...prev, itens: [...prev.itens, { id: item.id, codigo: item.codigo, descricao: item.descricao, qty: item.qty, preco_unitario: item.preco_vista, total: item.total }] }
    })
    setItemModal(null)
  }

  function removeItem(id) { setForm(prev => ({ ...prev, itens: prev.itens.filter(i => i.id !== id) })) }

  function salvar() {
    const numero = String(preVendas.length + 1).padStart(8, '0')
    const nova = { ...form, id: editando || numero, numero: editando || numero, data: new Date().toISOString().split('T')[0], valor_total: totalForm, qtde_itens: form.itens.reduce((s, i) => s + i.qty, 0), situacao: 'ABERTA' }
    if (editando) setPreVendas(prev => prev.map(p => p.id === editando ? nova : p))
    else setPreVendas(prev => [...prev, nova])
    setView('lista')
    setSucesso('Pré-venda salva com sucesso!')
    setTimeout(() => setSucesso(''), 2000)
  }

  function cancelar(id) {
    setPreVendas(prev => prev.map(p => p.id === id ? { ...p, situacao: 'CANCELADA' } : p))
  }

  if (view === 'form') return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {itemModal && <ModalItem produto={itemModal} onConfirm={addItem} onClose={() => setItemModal(null)} />}

      <div style={{ width: 340, flexShrink: 0, background: '#fff', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 10 }}>
            {editando ? 'EDITAR PRÉ-VENDA' : 'NOVA PRÉ-VENDA'}
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Tipo</div>
            <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} style={{ width: '100%', height: 32, padding: '0 10px' }}>
              <option value="CONDICIONAL">Condicional</option>
              <option value="ORCAMENTO">Orçamento</option>
              <option value="PEDIDO">Pedido de Venda</option>
            </select>
          </div>
          <div style={{ marginBottom: 8, position: 'relative' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Cliente (F2)</div>
            <input value={form.cliente_nome} onChange={e => { setClienteBusca(e.target.value); setForm(p => ({ ...p, cliente_nome: e.target.value })); setClienteDropdown(true) }} onFocus={() => setClienteDropdown(true)} style={{ width: '100%', height: 32, padding: '0 10px' }} />
            {clienteDropdown && clientesFiltrados.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', maxHeight: 160, overflowY: 'auto' }}>
                {clientesFiltrados.map(c => (
                  <button key={c.id} onClick={() => { setForm(p => ({ ...p, cliente_id: c.id, cliente_nome: c.nome })); setClienteDropdown(false) }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >{c.nome}</button>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Vendedor</div>
            <input value={form.vendedor} onChange={e => setForm(p => ({ ...p, vendedor: e.target.value }))} style={{ width: '100%', height: 32, padding: '0 10px' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Observação</div>
            <input value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} style={{ width: '100%', height: 32, padding: '0 10px' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {form.itens.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 100, color: 'var(--text-muted)', fontSize: 12, gap: 6, border: '1px dashed var(--border-md)', borderRadius: 'var(--radius-md)', margin: 4 }}>
              <Plus size={18} opacity={0.4} />
              Pesquise produtos ao lado
            </div>
          )}
          {form.itens.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 5, background: '#fff' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.descricao}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.qty} × {fmt(item.preco_unitario)}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue-700)' }}>{fmt(item.total)}</div>
              <button onClick={() => removeItem(item.id)} style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--red-500)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
              ><Trash2 size={13} /></button>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'var(--gray-50)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--blue-700)' }}>{fmt(totalForm)}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setView('lista')} style={{ flex: 1, height: 36, border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-secondary)' }}>Cancelar</button>
            <button onClick={salvar} disabled={form.itens.length === 0} style={{ flex: 2, height: 36, background: form.itens.length > 0 ? 'var(--blue-700)' : 'var(--gray-200)', color: form.itens.length > 0 ? '#fff' : 'var(--text-muted)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, cursor: form.itens.length > 0 ? 'pointer' : 'not-allowed' }}>
              Salvar (Ctrl+S)
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 14px', background: '#fff', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={buscaProd} onChange={e => setBuscaProd(e.target.value)} placeholder="Pesquisar produto (F4)..." style={{ width: '100%', height: 36, paddingLeft: 32 }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup><col style={{ width: 88 }} /><col /><col style={{ width: 86 }} /><col style={{ width: 86 }} /><col style={{ width: 46 }} /><col style={{ width: 80 }} /></colgroup>
            <thead>
              <tr>{['Código', 'Descrição', 'Preço vista', 'Preço prazo', 'UN', 'Estoque'].map(h => (
                <th key={h} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {prodsFiltrados.map(p => (
                <tr key={p.id} onDoubleClick={() => setItemModal(p)} style={{ cursor: 'pointer', transition: 'background 0.08s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--blue-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '9px 10px', fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontFamily: 'monospace' }}>{p.codigo}</td>
                  <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.descricao}</td>
                  <td style={{ padding: '9px 10px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{fmt(p.preco_vista)}</td>
                  <td style={{ padding: '9px 10px', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{fmt(p.preco_prazo)}</td>
                  <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{p.un}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ background: p.estoque === 0 ? 'var(--red-50)' : p.estoque <= 5 ? 'var(--amber-50)' : 'var(--green-50)', color: p.estoque === 0 ? 'var(--red-500)' : p.estoque <= 5 ? 'var(--amber-500)' : 'var(--green-500)', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>{p.estoque === 0 ? 'Sem estoque' : p.estoque}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', position: 'relative' }}>
      {sucesso && (
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'var(--green-500)', color: '#fff', padding: '9px 22px', borderRadius: 'var(--radius-lg)', fontSize: 13, fontWeight: 500, zIndex: 300, animation: 'fadeIn 0.2s ease' }}>{sucesso}</div>
      )}

      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por cliente ou número..." style={{ width: '100%', height: 34, paddingLeft: 32 }} />
        </div>
        <select style={{ height: 34, padding: '0 10px', borderRadius: 'var(--radius-md)' }}>
          <option>Todas</option>
          <option>Abertas</option>
          <option>Baixadas</option>
          <option>Canceladas</option>
        </select>
        <button onClick={novaPreVenda} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: 'var(--blue-700)', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500 }}>
          <Plus size={14} /> Novo (Ctrl+N)
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Número', 'Data', 'Cliente', 'Vendedor', 'Tipo', 'Itens', 'Total', 'Situação', ''].map(h => (
              <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtradas.map(pv => (
              <tr key={pv.id} onDoubleClick={() => editarPreVenda(pv)}
                style={{ cursor: 'pointer', transition: 'background 0.08s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{pv.numero}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{fmtDate(pv.data)}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{pv.cliente_nome}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{pv.vendedor}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ background: 'var(--blue-50)', color: 'var(--blue-800)', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>{pv.tipo}</span>
                </td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>{pv.qtde_itens}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: 'var(--blue-700)', borderBottom: '1px solid var(--border)' }}>{fmt(pv.valor_total)}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}><StatusBadge status={pv.situacao} /></td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={() => editarPreVenda(pv)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-md)', fontSize: 12, color: 'var(--text-secondary)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--blue-50)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >Editar</button>
                    {pv.situacao === 'ABERTA' && (
                      <button onClick={() => cancelar(pv.id)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--red-100)', fontSize: 12, color: 'var(--red-500)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--red-50)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >Cancelar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '8px 14px', background: 'var(--gray-50)', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{filtradas.length} pré-venda(s)</span>
        <span>Total em aberto: {fmt(filtradas.filter(p => p.situacao === 'ABERTA').reduce((s, p) => s + p.valor_total, 0))}</span>
      </div>
    </div>
  )
}