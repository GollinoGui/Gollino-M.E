import { useState, useEffect } from 'react'
import { Search, ArrowDownCircle, ArrowUpCircle, Package, RefreshCw, ShoppingCart, ClipboardList, TrendingUp } from 'lucide-react'
import ModalAcessoNegado from '../components/ModalAcessoNegado'
import ModalAviso from '../components/ModalAviso'

const fmt = (v) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR')

const abasEstoque = [
  { id: 'movimentos', label: 'Movimentos', pronto: true },
  { id: 'posicao', label: 'Posição de estoque', pronto: true },
  { id: 'pedido-compra', label: 'Pedido de compra', pronto: true },
  { id: 'saida-mercadoria', label: 'Saída de mercadoria', pronto: true },
  { id: 'acerto-estoque', label: 'Acerto de estoque', pronto: true },
  { id: 'contagem-estoque', label: 'Contagem', pronto: true },
  { id: 'reajustes', label: 'Reajuste de preços', pronto: true },
]

function ProdutoDropdown({ value, onChange, produtos, placeholder = 'Pesquisar produto...' }) {
  const [busca, setBusca] = useState(value || '')
  const [open, setOpen] = useState(false)

  const filtrados = produtos.filter(
    (p) =>
      p.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigo.includes(busca),
  )

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={busca}
        onChange={(e) => {
          setBusca(e.target.value)
          onChange(null)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={{ width: '100%', height: 36, padding: '0 10px' }}
        autoFocus
      />
      {open && filtrados.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'var(--surface)',
            border: '1px solid var(--border-md)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
            maxHeight: 180,
            overflowY: 'auto',
          }}
        >
          {filtrados.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setBusca(p.descricao)
                onChange(p)
                setOpen(false)
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: 13,
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontWeight: 500 }}>{p.descricao}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Estoque: {p.estoque_atual ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ModalEntrada({ onClose, onSalvar }) {
  const [form, setForm] = useState({
    produto_id: '',
    produto: '',
    quantidade: '',
    valor_unitario: '',
    fornecedor: '',
    obs: '',
    data: new Date().toISOString().split('T')[0],
    data_vencimento: new Date().toISOString().split('T')[0],
  })
  const [busca, setBusca] = useState('')
  const [dropdown, setDropdown] = useState(false)
  const [prodsBusca, setProdsBusca] = useState([])
  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  useEffect(() => {
    window.api.produtos.listar({ situacao: 'A' }).then(setProdsBusca).catch(console.error)
  }, [])

  const prodsFiltrados = prodsBusca.filter(
    (p) =>
      p.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigo.includes(busca),
  )
  const total =
    (parseFloat(form.quantidade) || 0) * (parseFloat(form.valor_unitario) || 0)
  const valido =
    form.produto_id &&
    parseFloat(form.quantidade) > 0 &&
    parseFloat(form.valor_unitario) > 0 &&
    form.fornecedor

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-md)',
          width: 500,
          padding: 24,
          boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
          animation: 'fadeIn 0.15s ease both',
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ArrowDownCircle size={18} style={{ color: 'var(--green-500)' }} />{' '}
          Entrada de mercadoria
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Produto *
            </label>
            <input
              value={form.produto || busca}
              onChange={(e) => {
                setBusca(e.target.value)
                setForm((p) => ({ ...p, produto: e.target.value, produto_id: '' }))
                setDropdown(true)
              }}
              onFocus={() => setDropdown(true)}
              placeholder='Pesquisar produto...'
              style={{ width: '100%', height: 36, padding: '0 10px' }}
              autoFocus
            />
            {dropdown && prodsFiltrados.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: 'var(--surface)',
                  border: '1px solid var(--border-md)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {prodsFiltrados.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        produto_id: p.codigo,
                        produto: p.descricao,
                        valor_unitario: (p.preco_venda_vista || 0).toFixed(2),
                      }))
                      setBusca('')
                      setDropdown(false)
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: 13,
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontWeight: 500 }}>{p.descricao}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      Estoque: {p.estoque_atual ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Quantidade *
            </label>
            <input value={form.quantidade} onChange={f('quantidade')} type='number' min='0' style={{ width: '100%', height: 36, padding: '0 10px' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Valor unitário (R$) *
            </label>
            <input value={form.valor_unitario} onChange={f('valor_unitario')} type='number' min='0' style={{ width: '100%', height: 36, padding: '0 10px' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Fornecedor *
            </label>
            <input value={form.fornecedor} onChange={f('fornecedor')} style={{ width: '100%', height: 36, padding: '0 10px' }} placeholder='Nome do fornecedor' />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Data
            </label>
            <input value={form.data} onChange={f('data')} type='date' style={{ width: '100%', height: 36, padding: '0 10px' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Vencimento (conta a pagar)
            </label>
            <input value={form.data_vencimento} onChange={f('data_vencimento')} type='date' style={{ width: '100%', height: 36, padding: '0 10px' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Observação (NF, etc)
            </label>
            <input value={form.obs} onChange={f('obs')} style={{ width: '100%', height: 36, padding: '0 10px' }} placeholder='Ex: NF 00123' />
          </div>
          {total > 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                background: 'var(--green-50)',
                border: '1px solid var(--green-100)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--green-700)' }}>Total da entrada</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--green-700)' }}>{fmt(total)}</span>
            </div>
          )}
          {total > 0 && (
            <div style={{ gridColumn: '1 / -1', fontSize: 11, color: 'var(--text-muted)', marginTop: -6 }}>
              Vai gerar uma conta a pagar em aberto pra "{form.fornecedor || 'fornecedor'}".
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-secondary)' }}>
            Cancelar
          </button>
          <button
            disabled={!valido}
            onClick={() => onSalvar({ ...form, total, tipo: 'ENTRADA' })}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-md)',
              background: valido ? 'var(--green-500)' : 'var(--gray-200)',
              color: valido ? 'var(--surface)' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 500,
              cursor: valido ? 'pointer' : 'not-allowed',
            }}
          >
            Confirmar entrada
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalSaida({ onClose, onSalvar, produtos }) {
  const [produto, setProduto] = useState(null)
  const [form, setForm] = useState({
    quantidade: '',
    motivo: '',
    obs: '',
    data: new Date().toISOString().split('T')[0],
  })
  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))
  const valido = produto && form.quantidade && parseInt(form.quantidade) > 0 && form.motivo

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-md)', width: 480, padding: 24, boxShadow: '0 16px 40px rgba(0,0,0,0.14)', animation: 'fadeIn 0.15s ease both' }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowUpCircle size={18} style={{ color: '#EF4444' }} />
          Saída de mercadoria
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Produto *</label>
            <ProdutoDropdown value='' onChange={setProduto} produtos={produtos} />
          </div>
          {produto && (
            <div style={{ gridColumn: '1 / -1', background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Estoque atual: </span>
              <strong style={{ color: '#B91C1C' }}>{produto.estoque_atual ?? 0}</strong>
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Quantidade *</label>
            <input value={form.quantidade} onChange={f('quantidade')} type='number' min='1' style={{ width: '100%', height: 36, padding: '0 10px' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Motivo *</label>
            <select value={form.motivo} onChange={f('motivo')} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 'var(--radius-md)' }}>
              <option value=''>Selecione...</option>
              <option value='Uso interno'>Uso interno</option>
              <option value='Perda / avaria'>Perda / avaria</option>
              <option value='Devolução a fornecedor'>Devolução a fornecedor</option>
              <option value='Brinde / amostra'>Brinde / amostra</option>
              <option value='Outros'>Outros</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Data</label>
            <input value={form.data} onChange={f('data')} type='date' style={{ width: '100%', height: 36, padding: '0 10px' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Observação</label>
            <input value={form.obs} onChange={f('obs')} style={{ width: '100%', height: 36, padding: '0 10px' }} placeholder='Opcional' />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-secondary)' }}>Cancelar</button>
          <button
            disabled={!valido}
            onClick={() => onSalvar({ produto_id: produto.codigo, produto: produto.descricao, ...form, tipo: 'SAIDA', valor_unitario: 0, total: 0 })}
            style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', background: valido ? '#EF4444' : 'var(--gray-200)', color: valido ? '#fff' : 'var(--text-muted)', fontSize: 13, fontWeight: 500, cursor: valido ? 'pointer' : 'not-allowed' }}
          >
            Confirmar saída
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalAcerto({ onClose, onSalvar, produtos }) {
  const [produto, setProduto] = useState(null)
  const [novaQtde, setNovaQtde] = useState('')
  const [obs, setObs] = useState('')
  const valido = produto && novaQtde !== '' && parseInt(novaQtde) >= 0

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-md)', width: 460, padding: 24, boxShadow: '0 16px 40px rgba(0,0,0,0.14)', animation: 'fadeIn 0.15s ease both' }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={18} style={{ color: '#60A5FA' }} />
          Acerto de estoque
        </div>
        <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Produto *</label>
            <ProdutoDropdown value='' onChange={setProduto} produtos={produtos} />
          </div>
          {produto && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Estoque atual no sistema</span>
              <strong style={{ fontSize: 15, color: '#1E40AF' }}>{produto.estoque_atual ?? 0}</strong>
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Quantidade real (contada) *</label>
            <input
              value={novaQtde}
              onChange={(e) => setNovaQtde(e.target.value)}
              type='number'
              min='0'
              placeholder='Informe a quantidade real'
              style={{ width: '100%', height: 36, padding: '0 10px' }}
            />
          </div>
          {produto && novaQtde !== '' && (
            <div style={{ background: parseInt(novaQtde) >= (produto.estoque_atual ?? 0) ? '#F0FDF4' : '#FFF5F5', border: `1px solid ${parseInt(novaQtde) >= (produto.estoque_atual ?? 0) ? '#6EE7B7' : '#FCA5A5'}`, borderRadius: 'var(--radius-md)', padding: '8px 14px', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Diferença</span>
              <strong style={{ color: parseInt(novaQtde) >= (produto.estoque_atual ?? 0) ? '#15803D' : '#B91C1C' }}>
                {parseInt(novaQtde) - (produto.estoque_atual ?? 0) > 0 ? '+' : ''}{parseInt(novaQtde) - (produto.estoque_atual ?? 0)}
              </strong>
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Motivo / observação</label>
            <input value={obs} onChange={(e) => setObs(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px' }} placeholder='Ex: Contagem física' />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-secondary)' }}>Cancelar</button>
          <button
            disabled={!valido}
            onClick={() => onSalvar({ produto_id: produto.codigo, produto: produto.descricao, quantidade: parseInt(novaQtde), obs, tipo: 'ACERTO', valor_unitario: 0, total: 0, data: new Date().toISOString().split('T')[0] })}
            style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', background: valido ? '#60A5FA' : 'var(--gray-200)', color: valido ? '#fff' : 'var(--text-muted)', fontSize: 13, fontWeight: 500, cursor: valido ? 'pointer' : 'not-allowed' }}
          >
            Aplicar acerto
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalPedidoCompra({ onClose, onSalvar, numero, itensIniciais }) {
  const [fornecedor, setFornecedor] = useState('')
  const [obs, setObs] = useState('')
  const [previsao, setPrevisao] = useState('')
  const [produtos, setProdutos] = useState([])
  const [itens, setItens] = useState(itensIniciais || [])
  const [prodBusca, setProdBusca] = useState(null)
  const [qtde, setQtde] = useState('')
  const [vlUnit, setVlUnit] = useState('')
  const [buscaKey, setBuscaKey] = useState(0)

  useEffect(() => {
    window.api.produtos.listar({ situacao: 'A' }).then(setProdutos).catch(console.error)
  }, [])

  function addItem() {
    if (!prodBusca || !(parseFloat(qtde) > 0) || parseFloat(vlUnit || 0) < 0) return
    setItens((prev) => [...prev, {
      produto_id: prodBusca.codigo,
      produto: prodBusca.descricao,
      quantidade: parseFloat(qtde),
      valor_unitario: parseFloat(vlUnit) || 0,
    }])
    setProdBusca(null)
    setQtde('')
    setVlUnit('')
    setBuscaKey((k) => k + 1)
  }

  function removerItem(i) {
    setItens((prev) => prev.filter((_, j) => j !== i))
    setProdBusca(null)
    setQtde('')
    setVlUnit('')
    setBuscaKey((k) => k + 1)
  }

  const totalPedido = itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0)
  const valido = fornecedor && itens.length > 0

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-md)', width: 580, maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 24, boxShadow: '0 16px 40px rgba(0,0,0,0.14)', animation: 'fadeIn 0.15s ease both' }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingCart size={18} style={{ color: 'var(--blue-600)' }} />
          Novo pedido de compra
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>#{String(numero).padStart(4, '0')}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Fornecedor *</label>
            <input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px' }} placeholder='Nome do fornecedor' />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Previsão de entrega</label>
            <input value={previsao} onChange={(e) => setPrevisao(e.target.value)} type='date' style={{ width: '100%', height: 36, padding: '0 10px' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Observação</label>
            <input value={obs} onChange={(e) => setObs(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px' }} placeholder='Opcional' />
          </div>
        </div>

        <div style={{ background: 'var(--gray-50)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 10 }}>ADICIONAR ITEM</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px auto', gap: 8, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Produto</label>
              <ProdutoDropdown key={buscaKey} value='' onChange={setProdBusca} produtos={produtos} placeholder='Buscar...' />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Qtde</label>
              <input value={qtde} onChange={(e) => setQtde(e.target.value)} type='number' min='1' style={{ width: '100%', height: 34, padding: '0 8px', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Vl. unit. (R$)</label>
              <input value={vlUnit} onChange={(e) => setVlUnit(e.target.value)} type='number' min='0' style={{ width: '100%', height: 34, padding: '0 8px', fontSize: 13 }} />
            </div>
            <button onClick={addItem} disabled={!prodBusca || !(parseFloat(qtde) > 0)} style={{ height: 34, padding: '0 12px', background: 'var(--blue-600)', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 13, opacity: prodBusca && parseFloat(qtde) > 0 ? 1 : 0.4 }}>
              + Add
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
          {itens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>Nenhum item adicionado</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Produto', 'Qtde', 'Vl. Unit.', 'Total', ''].map((h) => (
                    <th key={h} style={{ padding: '6px 8px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itens.map((item, i) => (
                  <tr key={i}>
                    <td style={{ padding: '7px 8px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{item.produto}</td>
                    <td style={{ padding: '7px 8px', fontSize: 13, borderBottom: '1px solid var(--border)', textAlign: 'right' }}>{item.quantidade}</td>
                    <td style={{ padding: '7px 8px', fontSize: 13, borderBottom: '1px solid var(--border)', textAlign: 'right' }}>{item.valor_unitario > 0 ? fmt(item.valor_unitario) : '-'}</td>
                    <td style={{ padding: '7px 8px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid var(--border)', textAlign: 'right' }}>{item.valor_unitario > 0 ? fmt(item.quantidade * item.valor_unitario) : '-'}</td>
                    <td style={{ padding: '7px 8px', borderBottom: '1px solid var(--border)' }}>
                      <button onClick={() => removerItem(i)} style={{ color: 'var(--red-500)', fontSize: 12, padding: '2px 6px' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPedido > 0 && (
          <div style={{ background: 'var(--blue-50)', border: '1px solid var(--blue-100)', borderRadius: 'var(--radius-md)', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
            <span style={{ color: 'var(--blue-700)' }}>Total do pedido</span>
            <strong style={{ color: 'var(--blue-700)' }}>{fmt(totalPedido)}</strong>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-secondary)' }}>Cancelar</button>
          <button
            disabled={!valido}
            onClick={() => onSalvar({ numero, fornecedor, obs, previsao_entrega: previsao, itens })}
            style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', background: valido ? 'var(--blue-600)' : 'var(--gray-200)', color: valido ? '#fff' : 'var(--text-muted)', fontSize: 13, fontWeight: 500, cursor: valido ? 'pointer' : 'not-allowed' }}
          >
            Salvar pedido
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Estoque({ abaInicial = 'movimentos', usuario }) {
  const [aba, setAba] = useState(abaInicial)
  const [movimentos, setMovimentos] = useState([])
  const [produtos, setProdutos] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [modalEntrada, setModalEntrada] = useState(false)
  const [modalSaida, setModalSaida] = useState(false)
  const [modalAcerto, setModalAcerto] = useState(false)
  const [modalPedido, setModalPedido] = useState(false)
  const [itensParaPedido, setItensParaPedido] = useState([])
  const [sucesso, setSucesso] = useState('')
  const [acessoNegado, setAcessoNegado] = useState(null)
  const [aguardandoAprovacao, setAguardandoAprovacao] = useState(false)

  // Posição de estoque — filtro de situação e seleção para pedido de compra
  const [filtroSituacaoEstoque, setFiltroSituacaoEstoque] = useState('todos')
  const [selecionadosEstoque, setSelecionadosEstoque] = useState([])

  // Pedidos de compra
  const [pedidos, setPedidos] = useState([])
  const [proximoNumPedido, setProximoNumPedido] = useState(1)

  // Contagem de estoque
  const [contagem, setContagem] = useState({})
  const [salvandoContagem, setSalvandoContagem] = useState(false)

  // Reajuste de preços
  const [reajustes, setReajustes] = useState([])
  const [percReajuste, setPercReajuste] = useState('')
  const [prodsSelecionados, setProdsSelecionados] = useState([])
  const [tipoReajuste, setTipoReajuste] = useState('todos')
  const [salvandoReajuste, setSalvandoReajuste] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    try {
      const [prods, movs] = await Promise.all([
        window.api.produtos.listar({ situacao: 'A' }),
        window.api.movimentosEstoque ? window.api.movimentosEstoque.listar({}) : Promise.resolve([]),
      ])
      setProdutos(prods)
      setMovimentos(movs)

      if (window.api.pedidosCompra) {
        const [peds, num] = await Promise.all([
          window.api.pedidosCompra.listar({}),
          window.api.pedidosCompra.proximoNumero(),
        ])
        setPedidos(peds)
        setProximoNumPedido(num.numero)
      }
      if (window.api.reajustesPreco) {
        window.api.reajustesPreco.listar({}).then(setReajustes).catch(console.error)
      }
    } catch (err) {
      console.error('Erro ao carregar dados de estoque:', err)
    }
  }

  function mostrarSucesso(msg) {
    setSucesso(msg)
    setTimeout(() => setSucesso(''), 2500)
  }

  const movFiltrados = movimentos.filter((m) => {
    const matchBusca = m.produto.toLowerCase().includes(busca.toLowerCase())
    const matchTipo = filtroTipo === 'todos' || m.tipo === filtroTipo
    return matchBusca && matchTipo
  })

  const prodFiltrados = produtos.filter((p) => {
    const matchBusca =
      (p.descricao || '').toLowerCase().includes(busca.toLowerCase()) ||
      (p.codigo || '').includes(busca)
    if (aba !== 'posicao' || filtroSituacaoEstoque === 'todos') return matchBusca
    const estoque = p.estoque_atual ?? 0
    const matchSituacao =
      filtroSituacaoEstoque === 'sem-estoque' ? estoque === 0 : estoque > 0 && estoque <= 5
    return matchBusca && matchSituacao
  })

  async function salvarMovimento(form) {
    try {
      if (!window.api.movimentosEstoque) return
      await window.api.movimentosEstoque.salvar({ ...form, usuario: usuario?.nome || usuario?.usuario || 'sistema' })
      await carregarDados()
      setModalEntrada(false)
      setModalSaida(false)
      setModalAcerto(false)
      mostrarSucesso(form.tipo === 'ENTRADA' ? 'Entrada registrada!' : form.tipo === 'SAIDA' ? 'Saída registrada!' : 'Acerto aplicado!')
    } catch (err) {
      console.error('Erro ao salvar movimento:', err)
    }
  }

  async function salvarPedido(dados) {
    try {
      if (!window.api.pedidosCompra) return
      const resultado = await window.api.pedidosCompra.salvar({ ...dados, usuario: usuario?.nome || usuario?.usuario || 'sistema' })
      if (!resultado.sucesso) throw new Error(resultado.erro)
      await carregarDados()
      setModalPedido(false)
      setItensParaPedido([])
      setSelecionadosEstoque([])
      mostrarSucesso('Pedido de compra criado!')
    } catch (err) {
      console.error('Erro ao salvar pedido:', err)
      await window.api.dialog.alert(`Não foi possível salvar o pedido: ${err.message}`)
    }
  }

  function pedirSelecionados() {
    const itens = produtos
      .filter((p) => selecionadosEstoque.includes(p.codigo))
      .map((p) => ({
        produto_id: p.codigo,
        produto: p.descricao,
        quantidade: Math.max((p.estoque_minimo ?? 0) - (p.estoque_atual ?? 0), 1),
        valor_unitario: 0,
      }))
    setItensParaPedido(itens)
    setAba('pedido-compra')
    setModalPedido(true)
  }

  function toggleSelecionadoEstoque(codigo) {
    setSelecionadosEstoque((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo],
    )
  }

  async function cancelarPedido(numero) {
    if ((usuario?.nivel ?? 0) < 2) {
      setAcessoNegado('Você não tem permissão para cancelar pedidos de compra. Entre em contato com um administrador.')
      return
    }
    if (!(await window.api.dialog.confirm('Cancelar este pedido de compra?'))) return
    try {
      const resultado = await window.api.pedidosCompra.cancelar(numero)
      if (!resultado.sucesso) throw new Error(resultado.erro)
      await carregarDados()
      mostrarSucesso('Pedido cancelado.')
    } catch (err) {
      console.error(err)
      await window.api.dialog.alert(`Não foi possível cancelar o pedido: ${err.message}`)
    }
  }

  async function receberPedido(numero) {
    try {
      const resultado = await window.api.pedidosCompra.receber(numero, usuario?.nome || 'sistema')
      if (!resultado.sucesso) throw new Error(resultado.erro)
      await carregarDados()
      mostrarSucesso('Pedido recebido! Estoque atualizado e conta a pagar gerada.')
    } catch (err) {
      console.error(err)
      await window.api.dialog.alert(`Não foi possível receber o pedido: ${err.message}`)
    }
  }

  async function salvarContagem() {
    if (Object.keys(contagem).length === 0) return
    const itensAlterados = Object.entries(contagem)
      .map(([produto_id, novaQtde]) => {
        const prod = produtos.find((p) => p.codigo === produto_id)
        return prod ? { produto_id, produto: prod.descricao, quantidade_atual: prod.estoque_atual ?? 0, quantidade_nova: parseInt(novaQtde) } : null
      })
      .filter((item) => item && item.quantidade_nova !== item.quantidade_atual)
    if (itensAlterados.length === 0) {
      setContagem({})
      return
    }

    setSalvandoContagem(true)
    try {
      const nomeUsuario = usuario?.nome || usuario?.usuario || 'sistema'
      if ((usuario?.nivel ?? 0) < 2) {
        const resultado = await window.api.aprovacoes.solicitar({
          tipo: 'CONTAGEM_ESTOQUE',
          itens: itensAlterados,
          usuario_solicitante: nomeUsuario,
        })
        if (!resultado.sucesso) throw new Error(resultado.erro)
        setContagem({})
        setAguardandoAprovacao(true)
        return
      }

      for (const item of itensAlterados) {
        const resultado = await window.api.movimentosEstoque.salvar({
          produto_id: item.produto_id,
          produto: item.produto,
          quantidade: item.quantidade_nova,
          tipo: 'ACERTO',
          valor_unitario: 0,
          total: 0,
          obs: 'Contagem de estoque',
          data: new Date().toISOString().split('T')[0],
        })
        if (!resultado.sucesso) throw new Error(resultado.erro)
      }
      await carregarDados()
      setContagem({})
      mostrarSucesso('Contagem aplicada!')
    } catch (err) {
      console.error(err)
      await window.api.dialog.alert(`Não foi possível salvar a contagem: ${err.message}`)
    } finally {
      setSalvandoContagem(false)
    }
  }

  async function aplicarReajuste() {
    const perc = parseFloat(percReajuste)
    if (!perc || (tipoReajuste === 'selecionados' && prodsSelecionados.length === 0)) return
    setSalvandoReajuste(true)
    try {
      const codigos = tipoReajuste === 'selecionados' ? prodsSelecionados : produtos.map((p) => p.codigo)
      const resultado = await window.api.reajustesPreco.aplicar({
        codigos,
        percentual: perc,
        usuario: usuario?.nome || usuario?.usuario || 'sistema',
      })
      if (!resultado.sucesso) throw new Error(resultado.erro)
      await carregarDados()
      setPercReajuste('')
      setProdsSelecionados([])
      mostrarSucesso('Reajuste aplicado com sucesso!')
    } catch (err) {
      console.error(err)
      await window.api.dialog.alert(`Não foi possível aplicar o reajuste: ${err.message}`)
    } finally {
      setSalvandoReajuste(false)
    }
  }

  const statusPedido = (s) => {
    if (s === 'ABERTO') return { label: 'Pendente', bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' }
    if (s === 'RECEBIDO') return { label: 'Recebido', bg: '#F0FDF4', color: '#166534', border: '#86EFAC' }
    if (s === 'CANCELADO') return { label: 'Cancelado', bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5' }
    return { label: s, bg: 'var(--gray-50)', color: 'var(--text-secondary)', border: 'var(--border)' }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface)', position: 'relative' }}>
      {sucesso && (
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'var(--green-500)', color: 'var(--surface)', padding: '9px 22px', borderRadius: 'var(--radius-lg)', fontSize: 13, fontWeight: 500, zIndex: 300, animation: 'fadeIn 0.2s ease' }}>
          {sucesso}
        </div>
      )}
      {modalEntrada && <ModalEntrada onClose={() => setModalEntrada(false)} onSalvar={salvarMovimento} />}
      {modalSaida && <ModalSaida onClose={() => setModalSaida(false)} onSalvar={salvarMovimento} produtos={produtos} />}
      {modalAcerto && <ModalAcerto onClose={() => setModalAcerto(false)} onSalvar={salvarMovimento} produtos={produtos} />}
      {modalPedido && (
        <ModalPedidoCompra
          onClose={() => { setModalPedido(false); setItensParaPedido([]) }}
          onSalvar={salvarPedido}
          numero={proximoNumPedido}
          itensIniciais={itensParaPedido}
        />
      )}
      {acessoNegado && (
        <ModalAcessoNegado
          mensagem={acessoNegado}
          onFechar={() => setAcessoNegado(null)}
        />
      )}
      {aguardandoAprovacao && (
        <ModalAviso
          titulo='Aguardando aprovação'
          mensagem='Sua contagem de estoque foi enviada para aprovação do administrador. As quantidades só serão atualizadas depois que ela for aprovada.'
          onFechar={() => setAguardandoAprovacao(false)}
        />
      )}

      {/* ── HEADER COM ABAS ── */}
      <div style={{ padding: '0 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', flexWrap: 'wrap', gap: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {abasEstoque.map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.pronto && setAba(tab.id)}
              style={{
                padding: '12px 14px',
                fontSize: 13,
                whiteSpace: 'nowrap',
                fontWeight: aba === tab.id ? 500 : 400,
                color: !tab.pronto ? 'var(--text-muted)' : aba === tab.id ? 'var(--blue-700)' : 'var(--text-secondary)',
                borderBottom: aba === tab.id ? '2px solid var(--blue-700)' : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.12s',
                cursor: tab.pronto ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '8px 0' }}>
          {aba === 'movimentos' && (
            <button onClick={() => setModalEntrada(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: 'var(--green-500)', color: 'var(--surface)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
              <ArrowDownCircle size={14} /> Entrada
            </button>
          )}
          {aba === 'saida-mercadoria' && (
            <button onClick={() => setModalSaida(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: '#EF4444', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500 }}>
              <ArrowUpCircle size={14} /> Nova saída
            </button>
          )}
          {aba === 'acerto-estoque' && (
            <button onClick={() => setModalAcerto(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: '#60A5FA', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500 }}>
              <RefreshCw size={14} /> Novo acerto
            </button>
          )}
          {aba === 'pedido-compra' && (
            <button onClick={() => { setItensParaPedido([]); setModalPedido(true) }} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: 'var(--blue-600)', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500 }}>
              <ShoppingCart size={14} /> Novo pedido
            </button>
          )}
          {aba === 'posicao' && selecionadosEstoque.length > 0 && (
            <button onClick={pedirSelecionados} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: 'var(--blue-600)', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500 }}>
              <ShoppingCart size={14} /> {selecionadosEstoque.length === 1 ? 'Pedir este' : `Pedir esses (${selecionadosEstoque.length})`}
            </button>
          )}
        </div>
      </div>

      {/* ── BARRA DE BUSCA ── */}
      {['movimentos', 'posicao', 'saida-mercadoria', 'acerto-estoque', 'contagem-estoque'].includes(aba) && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder='Buscar produto...' style={{ width: '100%', height: 34, paddingLeft: 32 }} />
          </div>
          {aba === 'movimentos' && (
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ height: 34, padding: '0 10px', borderRadius: 'var(--radius-md)' }}>
              <option value='todos'>Todos</option>
              <option value='ENTRADA'>Entradas</option>
              <option value='SAIDA'>Saídas</option>
              <option value='ACERTO'>Acertos</option>
            </select>
          )}
        </div>
      )}

      {/* ── ABA MOVIMENTOS ── */}
      {aba === 'movimentos' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 92 }} />
              <col style={{ width: 100 }} />
              <col />
              <col style={{ width: 80 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 160 }} />
            </colgroup>
            <thead>
              <tr>
                {['Data', 'Tipo', 'Produto', 'Qtde', 'Vl. Unit.', 'Total', 'Fornecedor', 'Observação'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movFiltrados.map((m) => {
                const bgBase = m.tipo === 'ENTRADA' ? '#F0FDF4' : m.tipo === 'SAIDA' ? '#FFF5F5' : '#EFF6FF'
                const bgHover = m.tipo === 'ENTRADA' ? '#DCFCE7' : m.tipo === 'SAIDA' ? '#FFE4E4' : '#DBEAFE'
                const borderL = m.tipo === 'ENTRADA' ? '#22C55E' : m.tipo === 'SAIDA' ? '#EF4444' : '#60A5FA'
                return (
                  <tr key={m.id} style={{ background: bgBase, borderLeft: `3px solid ${borderL}`, transition: 'background 0.08s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = bgHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = bgBase)}
                  >
                    <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{fmtDate(m.data)}</td>
                    <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{
                        background: m.tipo === 'ENTRADA' ? '#ECFDF5' : m.tipo === 'SAIDA' ? '#FEF2F2' : '#EFF6FF',
                        color: m.tipo === 'ENTRADA' ? '#065F46' : m.tipo === 'SAIDA' ? '#991B1B' : '#1E40AF',
                        border: `1px solid ${m.tipo === 'ENTRADA' ? '#6EE7B7' : m.tipo === 'SAIDA' ? '#FCA5A5' : '#BFDBFE'}`,
                        padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                      }}>
                        {m.tipo === 'ENTRADA' ? '+ Entrada' : m.tipo === 'SAIDA' ? '− Saída' : '⟳ Acerto'}
                      </span>
                    </td>
                    <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.produto}</td>
                    <td style={{ padding: '9px 10px', fontSize: 13, borderBottom: '1px solid var(--border)', textAlign: 'center', fontWeight: 600, color: m.tipo === 'ENTRADA' ? 'var(--green-500)' : m.tipo === 'SAIDA' ? 'var(--red-500)' : 'var(--blue-600)' }}>
                      {m.tipo === 'ENTRADA' ? '+' : m.tipo === 'SAIDA' ? '-' : ''}{m.quantidade}
                    </td>
                    <td style={{ padding: '9px 10px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{m.valor_unitario > 0 ? fmt(m.valor_unitario) : '-'}</td>
                    <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid var(--border)', color: m.tipo === 'ENTRADA' ? '#15803D' : m.tipo === 'SAIDA' ? '#B91C1C' : 'var(--blue-600)' }}>{m.total > 0 ? fmt(m.total) : '-'}</td>
                    <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.fornecedor || '-'}</td>
                    <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.obs}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ABA POSIÇÃO DE ESTOQUE ── */}
      {aba === 'posicao' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: 16, borderBottom: '1px solid var(--border)' }}>
            {[
              { key: 'todos', label: 'Total de produtos', value: produtos.length, color: 'var(--blue-700)' },
              { key: 'sem-estoque', label: 'Sem estoque', value: produtos.filter((p) => (p.estoque_atual ?? 0) === 0).length, color: 'var(--red-500)' },
              { key: 'baixo', label: 'Estoque baixo (≤5)', value: produtos.filter((p) => (p.estoque_atual ?? 0) > 0 && (p.estoque_atual ?? 0) <= 5).length, color: 'var(--amber-500)' },
            ].map((c) => (
              <button
                key={c.label}
                onClick={() => setFiltroSituacaoEstoque((prev) => (prev === c.key ? 'todos' : c.key))}
                style={{
                  textAlign: 'left',
                  background: filtroSituacaoEstoque === c.key ? 'var(--blue-50)' : 'var(--gray-50)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  border: `1px solid ${filtroSituacaoEstoque === c.key ? 'var(--blue-200)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{c.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
              </button>
            ))}
          </div>
          {filtroSituacaoEstoque !== 'todos' && (
            <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              Filtro ativo: <strong>{filtroSituacaoEstoque === 'sem-estoque' ? 'Sem estoque' : 'Estoque baixo'}</strong>
              <button onClick={() => setFiltroSituacaoEstoque('todos')} style={{ color: 'var(--blue-600)', fontSize: 12 }}>Limpar</button>
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 34 }} />
              <col style={{ width: 92 }} /><col /><col style={{ width: 46 }} />
              <col style={{ width: 100 }} /><col style={{ width: 100 }} /><col style={{ width: 120 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ padding: '8px 10px', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>
                  <input
                    type='checkbox'
                    checked={prodFiltrados.length > 0 && prodFiltrados.every((p) => selecionadosEstoque.includes(p.codigo))}
                    onChange={(e) =>
                      setSelecionadosEstoque(e.target.checked ? prodFiltrados.map((p) => p.codigo) : [])
                    }
                  />
                </th>
                {['Código', 'Descrição', 'UN', 'Estoque atual', 'Estoque mín.', 'Situação'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prodFiltrados.map((p) => (
                <tr key={p.id} style={{ transition: 'background 0.08s', background: selecionadosEstoque.includes(p.codigo) ? 'var(--blue-50)' : 'transparent' }}
                  onMouseEnter={(e) => { if (!selecionadosEstoque.includes(p.codigo)) e.currentTarget.style.background = 'var(--gray-50)' }}
                  onMouseLeave={(e) => { if (!selecionadosEstoque.includes(p.codigo)) e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)' }}>
                    <input
                      type='checkbox'
                      checked={selecionadosEstoque.includes(p.codigo)}
                      onChange={() => toggleSelecionadoEstoque(p.codigo)}
                    />
                  </td>
                  <td style={{ padding: '9px 10px', fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontFamily: 'monospace' }}>{p.codigo}</td>
                  <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package size={12} style={{ color: 'var(--blue-600)' }} />
                      </div>
                      {p.descricao}
                    </div>
                  </td>
                  <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{p.unidade}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: (p.estoque_atual ?? 0) === 0 ? 'var(--red-500)' : (p.estoque_atual ?? 0) <= 5 ? 'var(--amber-500)' : 'var(--green-500)' }}>
                      {p.estoque_atual ?? 0}
                    </span>
                  </td>
                  <td style={{ padding: '9px 10px', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>{p.estoque_minimo ?? 0}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)' }}>
                    {(p.estoque_atual ?? 0) === 0 ? (
                      <span style={{ background: 'var(--red-50)', color: 'var(--red-500)', padding: '2px 9px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>Sem estoque</span>
                    ) : (p.estoque_atual ?? 0) <= 5 ? (
                      <span style={{ background: 'var(--amber-50)', color: 'var(--amber-500)', padding: '2px 9px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>Estoque baixo</span>
                    ) : (
                      <span style={{ background: 'var(--green-50)', color: 'var(--green-500)', padding: '2px 9px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ABA SAÍDA DE MERCADORIA ── */}
      {aba === 'saida-mercadoria' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Data', 'Produto', 'Qtde', 'Motivo', 'Observação'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movimentos
                .filter((m) => m.tipo === 'SAIDA' && m.produto.toLowerCase().includes(busca.toLowerCase()))
                .map((m) => (
                  <tr key={m.id} style={{ background: '#FFF5F5', borderLeft: '3px solid #EF4444', transition: 'background 0.08s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#FFE4E4')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#FFF5F5')}
                  >
                    <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{fmtDate(m.data)}</td>
                    <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{m.produto}</td>
                    <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 600, color: '#B91C1C', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>-{m.quantidade}</td>
                    <td style={{ padding: '9px 10px', fontSize: 12, borderBottom: '1px solid var(--border)' }}>{m.fornecedor || '-'}</td>
                    <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{m.obs || '-'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ABA ACERTO DE ESTOQUE ── */}
      {aba === 'acerto-estoque' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Data', 'Produto', 'Qtde ajustada', 'Observação'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movimentos
                .filter((m) => m.tipo === 'ACERTO' && m.produto.toLowerCase().includes(busca.toLowerCase()))
                .map((m) => (
                  <tr key={m.id} style={{ background: '#EFF6FF', borderLeft: '3px solid #60A5FA', transition: 'background 0.08s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#DBEAFE')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#EFF6FF')}
                  >
                    <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{fmtDate(m.data)}</td>
                    <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{m.produto}</td>
                    <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 600, color: '#1E40AF', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>{m.quantidade}</td>
                    <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{m.obs || '-'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ABA PEDIDO DE COMPRA ── */}
      {aba === 'pedido-compra' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {pedidos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <ShoppingCart size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontSize: 14 }}>Nenhum pedido de compra ainda</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Clique em "Novo pedido" para criar</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pedidos.map((p) => {
                const st = statusPedido(p.situacao)
                return (
                  <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>#{String(p.numero).padStart(4, '0')}</span>
                        <span style={{ fontWeight: 500, fontSize: 14 }}>{p.fornecedor}</span>
                        <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{st.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(p.data)}</span>
                        {p.situacao === 'ABERTO' && (
                          <>
                            <button onClick={() => receberPedido(p.numero)} style={{ padding: '4px 12px', background: 'var(--green-500)', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 500 }}>Receber</button>
                            <button onClick={() => cancelarPedido(p.numero)} style={{ padding: '4px 10px', background: 'var(--red-50)', color: 'var(--red-500)', border: '1px solid var(--red-100)', borderRadius: 'var(--radius-md)', fontSize: 12 }}>Cancelar</button>
                          </>
                        )}
                      </div>
                    </div>
                    {p.obs && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{p.obs}</div>}
                    {p.itens && p.itens.length > 0 && (
                      <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: 12 }}>
                        {p.itens.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: i < p.itens.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <span>{item.descricao}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{item.quantidade}x {item.preco_unitario > 0 ? fmt(item.preco_unitario) : '-'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ABA CONTAGEM DE ESTOQUE ── */}
      {aba === 'contagem-estoque' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '12px 16px', background: '#FEF9C3', borderBottom: '1px solid #FDE047', fontSize: 13, color: '#854D0E', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={14} />
            Preencha as quantidades reais contadas. Apenas os campos alterados serão salvos como acerto de estoque.
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Código', 'Produto', 'Estoque sistema', 'Contagem real', 'Diferença'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prodFiltrados.map((p) => {
                const val = contagem[p.codigo]
                const diff = val !== undefined ? parseInt(val) - (p.estoque_atual ?? 0) : 0
                const alterado = val !== undefined && parseInt(val) !== (p.estoque_atual ?? 0)
                return (
                  <tr key={p.id} style={{ background: alterado ? (diff > 0 ? '#F0FDF4' : '#FFF5F5') : 'transparent', transition: 'background 0.08s' }}>
                    <td style={{ padding: '8px 10px', fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontFamily: 'monospace' }}>{p.codigo}</td>
                    <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{p.descricao}</td>
                    <td style={{ padding: '8px 10px', fontSize: 14, fontWeight: 600, borderBottom: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-secondary)' }}>{p.estoque_atual ?? 0}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>
                      <input
                        type='number'
                        min='0'
                        value={contagem[p.codigo] ?? ''}
                        onChange={(e) => setContagem((prev) => ({ ...prev, [p.codigo]: e.target.value }))}
                        placeholder={String(p.estoque_atual ?? 0)}
                        style={{ width: 80, height: 32, padding: '0 8px', textAlign: 'center', border: `1px solid ${alterado ? (diff > 0 ? '#86EFAC' : '#FCA5A5') : 'var(--border-md)'}`, borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600 }}
                      />
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontWeight: 600, fontSize: 14, color: alterado ? (diff > 0 ? '#15803D' : '#B91C1C') : 'var(--text-muted)' }}>
                      {alterado ? (diff > 0 ? `+${diff}` : diff) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {Object.keys(contagem).length > 0 && (
            <div style={{ position: 'sticky', bottom: 0, background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', alignSelf: 'center' }}>
                {Object.keys(contagem).filter((k) => parseInt(contagem[k]) !== (produtos.find((p) => p.codigo === k)?.estoque_atual ?? 0)).length} produto(s) alterado(s)
              </span>
              <button onClick={() => setContagem({})} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-secondary)' }}>Limpar</button>
              <button onClick={salvarContagem} disabled={salvandoContagem} style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', background: 'var(--blue-600)', color: '#fff', fontSize: 13, fontWeight: 500 }}>
                {salvandoContagem
                  ? 'Enviando...'
                  : (usuario?.nivel ?? 0) < 2
                    ? 'Enviar para aprovação'
                    : 'Aplicar contagem'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── ABA REAJUSTE DE PREÇOS ── */}
      {aba === 'reajustes' && (
        <div style={{ flex: 1, display: 'flex', gap: 0 }}>
          {/* painel esquerdo - aplicar reajuste */}
          <div style={{ width: 320, borderRight: '1px solid var(--border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
            <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={15} style={{ color: 'var(--amber-500)' }} />
              Aplicar reajuste
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Percentual de reajuste *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  value={percReajuste}
                  onChange={(e) => setPercReajuste(e.target.value)}
                  type='number'
                  placeholder='Ex: 10 ou -5'
                  style={{ flex: 1, height: 36, padding: '0 10px' }}
                />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>%</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Positivo = aumento, negativo = redução
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Aplicar em</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {['todos', 'selecionados'].map((opt) => (
                  <button key={opt} onClick={() => setTipoReajuste(opt)}
                    style={{ flex: 1, height: 34, borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: tipoReajuste === opt ? 600 : 400, background: tipoReajuste === opt ? 'var(--amber-50)' : 'transparent', color: tipoReajuste === opt ? 'var(--amber-600)' : 'var(--text-secondary)', border: `1px solid ${tipoReajuste === opt ? 'var(--amber-200)' : 'var(--border-md)'}` }}>
                    {opt === 'todos' ? 'Todos produtos' : 'Selecionados'}
                  </button>
                ))}
              </div>
            </div>
            {tipoReajuste === 'selecionados' && (
              <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', maxHeight: 240 }}>
                {produtos.map((p) => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <input
                      type='checkbox'
                      checked={prodsSelecionados.includes(p.codigo)}
                      onChange={(e) => setProdsSelecionados((prev) =>
                        e.target.checked ? [...prev, p.codigo] : prev.filter((c) => c !== p.codigo)
                      )}
                    />
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.descricao}</span>
                  </label>
                ))}
              </div>
            )}
            <button
              onClick={aplicarReajuste}
              disabled={!percReajuste || salvandoReajuste || (tipoReajuste === 'selecionados' && prodsSelecionados.length === 0)}
              style={{ height: 38, borderRadius: 'var(--radius-md)', background: percReajuste ? 'var(--amber-500)' : 'var(--gray-200)', color: percReajuste ? '#fff' : 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: percReajuste ? 'pointer' : 'not-allowed' }}
            >
              {salvandoReajuste ? 'Aplicando...' : 'Aplicar reajuste'}
            </button>
          </div>

          {/* painel direito - histórico */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
              HISTÓRICO DE REAJUSTES
            </div>
            {reajustes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <TrendingUp size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                <div style={{ fontSize: 13 }}>Nenhum reajuste aplicado ainda</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Data', 'Percentual', 'Qtde produtos', 'Observação'].map((h) => (
                      <th key={h} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reajustes.map((r) => (
                    <tr key={r.id} style={{ transition: 'background 0.08s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{fmtDate(r.data)}</td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: r.percentual > 0 ? '#15803D' : '#B91C1C' }}>
                          {r.percentual > 0 ? '+' : ''}{r.percentual}%
                        </span>
                      </td>
                      <td style={{ padding: '9px 10px', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{r.qtde_produtos ?? '-'}</td>
                      <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{r.obs || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
