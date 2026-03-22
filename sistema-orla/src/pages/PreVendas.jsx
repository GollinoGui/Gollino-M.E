import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Trash2, Package, FileText, Printer } from 'lucide-react'

const fmt = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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

function ModalItem({ produto, onConfirm, onClose }) {
  const [qty, setQty] = useState('1')
  const [desc, setDesc] = useState('0')
  const preco = produto.preco_venda_vista || 0
  const total = (parseFloat(qty) || 0) * preco * (1 - (parseFloat(desc) || 0) / 100)
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-md)', width: 400, padding: 24, boxShadow: '0 16px 40px rgba(0,0,0,0.14)', animation: 'fadeIn 0.15s ease both' }}>
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
            <input value={preco.toFixed(2)} readOnly style={{ width: '100%', height: 36, padding: '0 10px', background: 'var(--gray-50)' }} />
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
          <button onClick={() => onConfirm({ ...produto, qty: parseFloat(qty) || 1, desconto: parseFloat(desc) || 0, total, preco_vista: preco })} style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', background: 'var(--blue-700)', color: 'var(--surface)', fontSize: 13, fontWeight: 500 }}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

function ModalBaixar({ pv, onConfirm, onClose, salvando }) {
  const [forma, setForma] = useState('')
  const formas = ['Dinheiro', 'Cartão Crédito', 'Cartão Débito', 'Convênio', 'Cheque', 'Haver']
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-md)', width: 420, padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Baixar Pré-venda #{pv.numero}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{pv.nome_cliente} · {fmt(pv.valor_total)}</div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>FORMA DE PAGAMENTO</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
          {formas.map(f => (
            <button key={f} onClick={() => setForma(f)} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 13,
              border: forma === f ? '2px solid #185FA5' : '1px solid var(--border-md)',
              background: forma === f ? '#EBF3FC' : 'var(--surface)',
              color: forma === f ? '#185FA5' : 'var(--text-secondary)',
              fontWeight: forma === f ? 600 : 400, cursor: 'pointer',
            }}>{f}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => forma && onConfirm(forma)} disabled={!forma || salvando} style={{
            padding: '8px 22px', borderRadius: 'var(--radius-md)',
            background: forma && !salvando ? 'var(--blue-700)' : 'var(--gray-200)',
            color: forma && !salvando ? '#fff' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 500, cursor: forma && !salvando ? 'pointer' : 'not-allowed', border: 'none',
          }}>{salvando ? 'Salvando...' : '✓ Confirmar Venda'}</button>
        </div>
      </div>
    </div>
  )
}

export default function PreVendas({ usuario }) {
  const [preVendas, setPreVendas] = useState([])
  const [todosProds, setTodosProds] = useState([])
  const [todosClientes, setTodosClientes] = useState([])
  const [view, setView] = useState('lista')
  const [editando, setEditando] = useState(null)
  const [busca, setBusca] = useState('')
  const [buscaProd, setBuscaProd] = useState('')
  const [itemModal, setItemModal] = useState(null)
  const [sucesso, setSucesso] = useState('')
  const [pvBaixar, setPvBaixar] = useState(null)
  const [baixando, setBaixando] = useState(false)

  const formVazio = { tipo: 'CONDICIONAL', cliente_id: '', nome_cliente: 'Consumidor a vista', vendedor: 'Geral', observacao: '', itens: [] }
  const [form, setForm] = useState(formVazio)
  const [clienteDropdown, setClienteDropdown] = useState(false)
  const [clienteBusca, setClienteBusca] = useState('')

  useEffect(() => {
    carregarLista()
    window.api.produtos.listar({ situacao: 'A' }).then(setTodosProds).catch(console.error)
    window.api.clientes.listar({}).then(setTodosClientes).catch(console.error)
  }, [])

  async function carregarLista() {
    if (!window.api.preVendas) return
    try {
      const lista = await window.api.preVendas.listar({})
      setPreVendas(lista)
    } catch (err) {
      console.error('Erro ao carregar pré-vendas:', err)
    }
  }

  const filtradas = preVendas.filter(p =>
    (p.nome_cliente || '').toLowerCase().includes(busca.toLowerCase()) ||
    (p.numero || '').includes(busca)
  )

  const prodsFiltrados = useMemo(() =>
    todosProds.filter(p => p.descricao.toLowerCase().includes(buscaProd.toLowerCase()) || p.codigo.includes(buscaProd))
  , [buscaProd, todosProds])

  const clientesFiltrados = todosClientes.filter(c => c.nome.toLowerCase().includes(clienteBusca.toLowerCase()))
  const totalForm = form.itens.reduce((s, i) => s + i.total, 0)

  function novaPreVenda() {
    setForm({ ...formVazio, itens: [] })
    setView('form')
    setEditando(null)
  }

  async function editarPreVenda(pv) {
    try {
      const completa = await window.api.preVendas.buscar(pv.numero)
      const itensForm = (completa.itens || []).map(i => ({
        id: i.codigo_produto,
        codigo: i.codigo_produto,
        descricao: i.descricao,
        qty: i.quantidade,
        preco_unitario: i.preco_unitario,
        total: i.total,
      }))
      setForm({
        tipo: completa.tipo,
        cliente_id: completa.codigo_cliente || '',
        nome_cliente: completa.nome_cliente,
        vendedor: completa.vendedor,
        observacao: completa.observacao || '',
        itens: itensForm,
      })
      setEditando(completa.numero)
      setView('form')
    } catch (err) {
      console.error('Erro ao carregar pré-venda:', err)
    }
  }

  function addItem(item) {
    setForm(prev => {
      const existing = prev.itens.findIndex(i => i.id === item.id)
      if (existing >= 0) {
        const itens = [...prev.itens]
        itens[existing] = { ...itens[existing], qty: itens[existing].qty + item.qty, total: itens[existing].total + item.total }
        return { ...prev, itens }
      }
      return { ...prev, itens: [...prev.itens, { id: item.id, codigo: item.codigo, descricao: item.descricao, qty: item.qty, preco_unitario: item.preco_vista || item.preco_venda_vista || 0, total: item.total }] }
    })
    setItemModal(null)
  }

  function removeItem(id) { setForm(prev => ({ ...prev, itens: prev.itens.filter(i => i.id !== id) })) }

  async function salvar() {
    try {
      let numero = editando
      if (!numero) {
        const res = await window.api.preVendas.proximoNumero()
        numero = res.numero
      }
      await window.api.preVendas.salvar({
        numero,
        tipo: form.tipo,
        codigo_cliente: form.cliente_id || '',
        nome_cliente: form.nome_cliente || 'Consumidor a vista',
        vendedor: form.vendedor || 'Geral',
        observacao: form.observacao || '',
        valor_total: totalForm,
        qtde_itens: form.itens.reduce((s, i) => s + i.qty, 0),
        data: new Date().toISOString().split('T')[0],
        itens: form.itens,
      })
      await carregarLista()
      setView('lista')
      setSucesso('Pré-venda salva com sucesso!')
      setTimeout(() => setSucesso(''), 2000)
    } catch (err) {
      console.error('Erro ao salvar pré-venda:', err)
    }
  }

  async function cancelar(numero) {
    try {
      await window.api.preVendas.cancelar(numero)
      setPreVendas(prev => prev.map(p => p.numero === numero ? { ...p, situacao: 'CANCELADA' } : p))
    } catch (err) {
      console.error('Erro ao cancelar:', err)
    }
  }

  async function baixarComoVenda(forma) {
    if (!pvBaixar) return
    setBaixando(true)
    try {
      const pvCompleta = await window.api.preVendas.buscar(pvBaixar.numero)
      const { numero: orcamento } = await window.api.vendas.proximoNumero()

      const pagamento = {
        valor_pago_dinheiro: forma === 'Dinheiro' ? pvCompleta.valor_total : 0,
        valor_pago_cartao_credito: forma === 'Cartão Crédito' ? pvCompleta.valor_total : 0,
        valor_pago_cartao_debito: forma === 'Cartão Débito' ? pvCompleta.valor_total : 0,
        valor_pago_cheque: forma === 'Cheque' ? pvCompleta.valor_total : 0,
        valor_pago_haver: forma === 'Haver' ? pvCompleta.valor_total : 0,
      }

      const resultado = await window.api.vendas.salvar({
        orcamento,
        codigo_cliente: pvCompleta.codigo_cliente || '',
        data: new Date().toISOString().slice(0, 10),
        tipo_venda: 'V',
        situacao: 'N',
        valor_total: pvCompleta.valor_total,
        valor_produtos: pvCompleta.valor_total,
        codigo_forma_pagamento1: forma,
        usuario_cadastro: usuario?.usuario || 'sistema',
        numero_caixa: '001',
        numero_turno: '1',
        ...pagamento,
        itens: (pvCompleta.itens || []).map(i => ({
          codigo_produto: i.codigo_produto,
          descricao: i.descricao,
          quantidade: i.quantidade,
          unidade: 'UN',
          preco_unitario: i.preco_unitario,
          preco_custo: 0,
          valor_desconto: 0,
          valor_acrescimo: 0,
          valor_total: i.total,
        })),
      })

      if (!resultado.sucesso) {
        setSucesso(`Erro: ${resultado.erro}`)
        setTimeout(() => setSucesso(''), 5000)
        return
      }

      await window.api.preVendas.baixar(pvBaixar.numero)
      setPvBaixar(null)
      await carregarLista()
      setSucesso(`Venda #${orcamento} gerada com sucesso!`)
      setTimeout(() => setSucesso(''), 3000)

      if (window.api.pdf) {
        window.api.pdf.gerarVenda(orcamento).catch(console.error)
      }
    } catch (err) {
      console.error('Erro ao baixar pré-venda:', err)
      setSucesso('Erro ao converter para venda.')
      setTimeout(() => setSucesso(''), 4000)
    } finally {
      setBaixando(false)
    }
  }

  if (view === 'form') return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {itemModal && <ModalItem produto={itemModal} onConfirm={addItem} onClose={() => setItemModal(null)} />}

      <div style={{ width: 340, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
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
            <input value={form.nome_cliente} onChange={e => { setClienteBusca(e.target.value); setForm(p => ({ ...p, nome_cliente: e.target.value })); setClienteDropdown(true) }} onFocus={() => setClienteDropdown(true)} style={{ width: '100%', height: 32, padding: '0 10px' }} />
            {clienteDropdown && clientesFiltrados.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', maxHeight: 160, overflowY: 'auto' }}>
                {clientesFiltrados.map(c => (
                  <button key={c.id} onClick={() => { setForm(p => ({ ...p, cliente_id: c.codigo, nome_cliente: c.nome })); setClienteDropdown(false) }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--border)' }}
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
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 5, background: 'var(--surface)' }}>
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
            <button onClick={salvar} disabled={form.itens.length === 0} style={{ flex: 2, height: 36, background: form.itens.length > 0 ? 'var(--blue-700)' : 'var(--gray-200)', color: form.itens.length > 0 ? 'var(--surface)' : 'var(--text-muted)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, cursor: form.itens.length > 0 ? 'pointer' : 'not-allowed' }}>
              Salvar (Ctrl+S)
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={buscaProd} onChange={e => setBuscaProd(e.target.value)} placeholder="Pesquisar produto (F4)..." style={{ width: '100%', height: 36, paddingLeft: 32 }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--surface)' }}>
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
                  <td style={{ padding: '9px 10px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{fmt(p.preco_venda_vista)}</td>
                  <td style={{ padding: '9px 10px', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{fmt(p.preco_venda_prazo)}</td>
                  <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{p.unidade}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ background: (p.estoque_atual ?? 0) === 0 ? 'var(--red-50)' : (p.estoque_atual ?? 0) <= 5 ? 'var(--amber-50)' : 'var(--green-50)', color: (p.estoque_atual ?? 0) === 0 ? 'var(--red-500)' : (p.estoque_atual ?? 0) <= 5 ? 'var(--amber-500)' : 'var(--green-500)', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>{(p.estoque_atual ?? 0) === 0 ? 'Sem estoque' : p.estoque_atual}</span>
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface)', position: 'relative' }}>
      {pvBaixar && (
        <ModalBaixar
          pv={pvBaixar}
          salvando={baixando}
          onConfirm={baixarComoVenda}
          onClose={() => setPvBaixar(null)}
        />
      )}
      {sucesso && (
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'var(--green-500)', color: 'var(--surface)', padding: '9px 22px', borderRadius: 'var(--radius-lg)', fontSize: 13, fontWeight: 500, zIndex: 300, animation: 'fadeIn 0.2s ease' }}>{sucesso}</div>
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
        <button onClick={novaPreVenda} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: 'var(--blue-700)', color: 'var(--surface)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500 }}>
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
                <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{pv.nome_cliente}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{pv.vendedor}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ background: 'var(--blue-50)', color: 'var(--blue-800)', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>{pv.tipo}</span>
                </td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>{pv.qtde_itens}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: 'var(--blue-700)', borderBottom: '1px solid var(--border)' }}>{fmt(pv.valor_total)}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}><StatusBadge status={pv.situacao} /></td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={() => editarPreVenda(pv)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-md)', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--blue-50)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >Editar</button>
                    {pv.situacao === 'ABERTA' && <>
                      <button onClick={() => setPvBaixar(pv)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--green-200)', fontSize: 12, color: 'var(--green-700)', fontWeight: 500, cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--green-50)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >Baixar</button>
                      <button onClick={() => cancelar(pv.numero)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--red-100)', fontSize: 12, color: 'var(--red-500)', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--red-50)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >Cancelar</button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '8px 14px', background: 'var(--gray-50)', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{filtradas.length} pré-venda(s)</span>
        <span>Total em aberto: {fmt(filtradas.filter(pv => pv.situacao === 'ABERTA').reduce((s, pv) => s + (pv.valor_total || 0), 0))}</span>
      </div>
    </div>
  )
}