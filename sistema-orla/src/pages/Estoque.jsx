import { useState, useEffect } from 'react'
import { Search, ArrowDownCircle, Package } from 'lucide-react'

const fmt = (v) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR')


const abasEstoque = [
  { id: 'movimentos', label: 'Movimentos', pronto: true },
  { id: 'posicao', label: 'Posição de estoque', pronto: true },
  { id: 'pedido-compra', label: 'Pedido de compra', pronto: false },
  { id: 'saida-mercadoria', label: 'Saída de mercadoria', pronto: false },
  { id: 'acerto-estoque', label: 'Acerto de estoque', pronto: false },
  { id: 'contagem-estoque', label: 'Contagem', pronto: false },
  { id: 'reajustes', label: 'Consulta de reajustes', pronto: false },
]

function ModalEntrada({ onClose, onSalvar }) {
  const [form, setForm] = useState({
    produto_id: '',
    produto: '',
    quantidade: '',
    valor_unitario: '',
    fornecedor: '',
    obs: '',
    data: new Date().toISOString().split('T')[0],
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
    form.produto_id && form.quantidade && form.valor_unitario && form.fornecedor

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
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Produto *
            </label>
            <input
              value={form.produto || busca}
              onChange={(e) => {
                setBusca(e.target.value)
                setForm((p) => ({
                  ...p,
                  produto: e.target.value,
                  produto_id: '',
                }))
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--gray-50)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
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
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Quantidade *
            </label>
            <input
              value={form.quantidade}
              onChange={f('quantidade')}
              type='number'
              min='0'
              style={{ width: '100%', height: 36, padding: '0 10px' }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Valor unitário (R$) *
            </label>
            <input
              value={form.valor_unitario}
              onChange={f('valor_unitario')}
              type='number'
              min='0'
              style={{ width: '100%', height: 36, padding: '0 10px' }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Fornecedor *
            </label>
            <input
              value={form.fornecedor}
              onChange={f('fornecedor')}
              style={{ width: '100%', height: 36, padding: '0 10px' }}
              placeholder='Nome do fornecedor'
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Data
            </label>
            <input
              value={form.data}
              onChange={f('data')}
              type='date'
              style={{ width: '100%', height: 36, padding: '0 10px' }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Observação (NF, etc)
            </label>
            <input
              value={form.obs}
              onChange={f('obs')}
              style={{ width: '100%', height: 36, padding: '0 10px' }}
              placeholder='Ex: NF 00123'
            />
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
              <span style={{ fontSize: 12, color: 'var(--green-700)' }}>
                Total da entrada
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--green-700)',
                }}
              >
                {fmt(total)}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-md)',
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
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

export default function Estoque() {
  const [aba, setAba] = useState('movimentos')
  const [movimentos, setMovimentos] = useState([])
  const [produtos, setProdutos] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [modalEntrada, setModalEntrada] = useState(false)
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    window.api.produtos.listar({ situacao: 'A' }).then(setProdutos).catch(console.error)
    if (window.api.movimentosEstoque) {
      window.api.movimentosEstoque.listar({}).then(setMovimentos).catch(console.error)
    }
  }, [])

  const movFiltrados = movimentos.filter((m) => {
    const matchBusca = m.produto.toLowerCase().includes(busca.toLowerCase())
    const matchTipo = filtroTipo === 'todos' || m.tipo === filtroTipo
    return matchBusca && matchTipo
  })

  const prodFiltrados = produtos.filter(
    (p) =>
      (p.descricao || '').toLowerCase().includes(busca.toLowerCase()) ||
      (p.codigo || '').includes(busca),
  )

  async function salvarEntrada(form) {
    try {
      if (!window.api.movimentosEstoque) {
        console.error('API movimentosEstoque não disponível — reinicie o Electron')
        return
      }
      await window.api.movimentosEstoque.salvar(form)
      const [novosMov, novosProd] = await Promise.all([
        window.api.movimentosEstoque.listar({}),
        window.api.produtos.listar({ situacao: 'A' }),
      ])
      setMovimentos(novosMov)
      setProdutos(novosProd)
      setModalEntrada(false)
      setSucesso('Entrada registrada!')
      setTimeout(() => setSucesso(''), 2000)
    } catch (err) {
      console.error('Erro ao registrar entrada:', err)
    }
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        position: 'relative',
      }}
    >
      {sucesso && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--green-500)',
            color: 'var(--surface)',
            padding: '9px 22px',
            borderRadius: 'var(--radius-lg)',
            fontSize: 13,
            fontWeight: 500,
            zIndex: 300,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {sucesso}
        </div>
      )}
      {modalEntrada && (
        <ModalEntrada
          onClose={() => setModalEntrada(false)}
          onSalvar={salvarEntrada}
        />
      )}

      {/* ── HEADER COM ABAS ── */}
      <div
        style={{
          padding: '0 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface)',
          flexWrap: 'wrap',
          gap: 0,
        }}
      >
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
                color: !tab.pronto
                  ? 'var(--text-muted)'
                  : aba === tab.id
                    ? 'var(--blue-700)'
                    : 'var(--text-secondary)',
                borderBottom:
                  aba === tab.id
                    ? '2px solid var(--blue-700)'
                    : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.12s',
                cursor: tab.pronto ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {tab.label}
              {!tab.pronto && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 500,
                    padding: '1px 5px',
                    background: 'var(--amber-50)',
                    color: 'var(--amber-500)',
                    borderRadius: 99,
                    border: '1px solid var(--amber-100)',
                  }}
                >
                  em breve
                </span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '8px 0' }}>
          <button
            onClick={() => setModalEntrada(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 34,
              padding: '0 14px',
              background: 'var(--green-500)',
              color: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            <ArrowDownCircle size={14} /> Entrada de mercadoria
          </button>
        </div>
      </div>

      {/* ── BARRA DE BUSCA ── */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          gap: 8,
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={
              aba === 'movimentos'
                ? 'Buscar por produto...'
                : 'Buscar produto...'
            }
            style={{ width: '100%', height: 34, paddingLeft: 32 }}
          />
        </div>
        {aba === 'movimentos' && (
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            style={{
              height: 34,
              padding: '0 10px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <option value='todos'>Todos</option>
            <option value='ENTRADA'>Entradas</option>
            <option value='SAIDA'>Saídas</option>
            <option value='ACERTO'>Acertos</option>
          </select>
        )}
      </div>

      {/* ── ABA MOVIMENTOS ── */}
      {aba === 'movimentos' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              <col style={{ width: 92 }} />
              <col />
              <col style={{ width: 46 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 120 }} />
            </colgroup>
            <thead>
              <tr>
                {[
                  'Data',
                  'Tipo',
                  'Produto',
                  'Qtde',
                  'Vl. Unit.',
                  'Total',
                  'Fornecedor',
                  'Observação',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 10px',
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                      background: 'var(--gray-50)',
                      borderBottom: '1px solid var(--border)',
                      position: 'sticky',
                      top: 0,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movFiltrados.map((m) => (
                <tr
                  key={m.id}
                  style={{ transition: 'background 0.08s' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--gray-50)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {fmtDate(m.data)}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <span
                      style={{
                        background:
                          m.tipo === 'ENTRADA'
                            ? 'var(--green-50)'
                            : m.tipo === 'SAIDA'
                              ? 'var(--red-50)'
                              : 'var(--blue-50)',
                        color:
                          m.tipo === 'ENTRADA'
                            ? 'var(--green-700)'
                            : m.tipo === 'SAIDA'
                              ? 'var(--red-500)'
                              : 'var(--blue-700)',
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      {m.tipo === 'ENTRADA'
                        ? '↓ Entrada'
                        : m.tipo === 'SAIDA'
                          ? '↑ Saída'
                          : '⟳ Acerto'}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 13,
                      fontWeight: 500,
                      borderBottom: '1px solid var(--border)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {m.produto}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 13,
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'center',
                      fontWeight: 600,
                      color:
                        m.tipo === 'ENTRADA'
                          ? 'var(--green-500)'
                          : m.tipo === 'SAIDA'
                            ? 'var(--red-500)'
                            : 'var(--blue-600)',
                    }}
                  >
                    {m.tipo === 'ENTRADA' ? '+' : m.tipo === 'SAIDA' ? '-' : ''}
                    {m.quantidade}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 13,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {m.valor_unitario > 0 ? fmt(m.valor_unitario) : '-'}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 13,
                      fontWeight: 600,
                      borderBottom: '1px solid var(--border)',
                      color:
                        m.tipo === 'ENTRADA'
                          ? 'var(--green-500)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {m.total > 0 ? fmt(m.total) : '-'}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      borderBottom: '1px solid var(--border)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {m.fornecedor || '-'}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {m.obs}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ABA POSIÇÃO DE ESTOQUE ── */}
      {aba === 'posicao' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              padding: 16,
              borderBottom: '1px solid var(--border)',
            }}
          >
            {[
              {
                label: 'Total de produtos',
                value: produtos.length,
                color: 'var(--blue-700)',
              },
              {
                label: 'Sem estoque',
                value: produtos.filter((p) => (p.estoque_atual ?? 0) === 0).length,
                color: 'var(--red-500)',
              },
              {
                label: 'Estoque baixo (≤5)',
                value: produtos.filter((p) => (p.estoque_atual ?? 0) > 0 && (p.estoque_atual ?? 0) <= 5)
                  .length,
                color: 'var(--amber-500)',
              },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginBottom: 3,
                  }}
                >
                  {c.label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>
                  {c.value}
                </div>
              </div>
            ))}
          </div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              <col style={{ width: 92 }} />
              <col />
              <col style={{ width: 46 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 120 }} />
            </colgroup>
            <thead>
              <tr>
                {[
                  'Código',
                  'Descrição',
                  'UN',
                  'Estoque atual',
                  'Estoque mín.',
                  'Situação',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 10px',
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                      background: 'var(--gray-50)',
                      borderBottom: '1px solid var(--border)',
                      position: 'sticky',
                      top: 0,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prodFiltrados.map((p) => (
                <tr
                  key={p.id}
                  style={{ transition: 'background 0.08s' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--gray-50)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {p.codigo}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 13,
                      fontWeight: 500,
                      borderBottom: '1px solid var(--border)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: 'var(--blue-50)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Package
                          size={12}
                          style={{ color: 'var(--blue-600)' }}
                        />
                      </div>
                      {p.descricao}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {p.unidade}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color:
                          (p.estoque_atual ?? 0) === 0
                            ? 'var(--red-500)'
                            : (p.estoque_atual ?? 0) <= 5
                              ? 'var(--amber-500)'
                              : 'var(--green-500)',
                      }}
                    >
                      {p.estoque_atual ?? 0}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'center',
                    }}
                  >
                    {p.estoque_minimo ?? 0}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {(p.estoque_atual ?? 0) === 0 ? (
                      <span
                        style={{
                          background: 'var(--red-50)',
                          color: 'var(--red-500)',
                          padding: '2px 9px',
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                        }}
                      >
                        Sem estoque
                      </span>
                    ) : (p.estoque_atual ?? 0) <= 5 ? (
                      <span
                        style={{
                          background: 'var(--amber-50)',
                          color: 'var(--amber-500)',
                          padding: '2px 9px',
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                        }}
                      >
                        Estoque baixo
                      </span>
                    ) : (
                      <span
                        style={{
                          background: 'var(--green-50)',
                          color: 'var(--green-500)',
                          padding: '2px 9px',
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                        }}
                      >
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
