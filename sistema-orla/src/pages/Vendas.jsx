import { useState, useMemo } from 'react'
import {
  Search,
  Trash2,
  Plus,
  ChevronRight,
  FileText,
  RotateCcw,
} from 'lucide-react'
import { produtos as todosProds, clientes } from '../data/mock'

const fmt = (v) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function EstoqueBadge({ qtd }) {
  const style = {
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    display: 'inline-block',
  }
  if (qtd === 0)
    return (
      <span
        style={{
          ...style,
          background: 'var(--red-50)',
          color: 'var(--red-500)',
        }}
      >
        Sem estoque
      </span>
    )
  if (qtd <= 5)
    return (
      <span
        style={{
          ...style,
          background: 'var(--amber-50)',
          color: 'var(--amber-500)',
        }}
      >
        {qtd}
      </span>
    )
  return (
    <span
      style={{
        ...style,
        background: 'var(--green-50)',
        color: 'var(--green-500)',
      }}
    >
      {qtd}
    </span>
  )
}

function ModalItem({ produto, onConfirm, onClose }) {
  const [qty, setQty] = useState('1')
  const [desc, setDesc] = useState('0')
  const total =
    (parseFloat(qty) || 0) *
    produto.preco_vista *
    (1 - (parseFloat(desc) || 0) / 100)

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
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-md)',
          width: 400,
          padding: 24,
          boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
          animation: 'fadeIn 0.15s ease both',
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginBottom: 2,
            }}
          >
            {produto.codigo}
          </div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            {produto.descricao}
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Quantidade
            </label>
            <input
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              type='number'
              min='0.001'
              step='0.001'
              style={{ width: '100%', height: 36, padding: '0 10px' }}
              autoFocus
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
              Preço unitário
            </label>
            <input
              value={produto.preco_vista.toFixed(2)}
              readOnly
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px',
                background: 'var(--gray-50)',
              }}
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
              Desconto %
            </label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              type='number'
              min='0'
              max='100'
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
              Total do item
            </label>
            <div
              style={{
                height: 36,
                padding: '0 10px',
                display: 'flex',
                alignItems: 'center',
                background: 'var(--blue-50)',
                border: '1px solid var(--blue-100)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--blue-800)',
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              {fmt(total)}
            </div>
          </div>
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
            Cancelar (Esc)
          </button>
          <button
            onClick={() =>
              onConfirm({
                ...produto,
                qty: parseFloat(qty) || 1,
                desconto: parseFloat(desc) || 0,
                total,
              })
            }
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--blue-700)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Confirmar (Ctrl+S)
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalPagamento({ total, onClose, onFinalizar }) {
  const [forma, setForma] = useState(null)
  const [valor, setValor] = useState(total.toFixed(2))
  const pago = parseFloat(valor) || 0
  const troco = Math.max(0, pago - total)
  const faltam = Math.max(0, total - pago)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-md)',
          width: 460,
          boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
          animation: 'fadeIn 0.15s ease both',
          overflow: 'hidden',
        }}
      >
        <div style={{ background: 'var(--blue-700)', padding: '16px 22px' }}>
          <div
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 12,
              marginBottom: 2,
            }}
          >
            Total da venda
          </div>
          <div style={{ color: '#fff', fontSize: 28, fontWeight: 600 }}>
            {fmt(total)}
          </div>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              FORMA DE PAGAMENTO
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {['Dinheiro', 'Cartão', 'Convênio', 'Cheque', 'Haver'].map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setForma(f)
                      setValor(total.toFixed(2))
                    }}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 13,
                      border:
                        forma === f
                          ? '2px solid var(--blue-600)'
                          : '1px solid var(--border-md)',
                      background: forma === f ? 'var(--blue-50)' : '#fff',
                      color:
                        forma === f ? 'var(--blue-800)' : 'var(--text-primary)',
                      fontWeight: forma === f ? 500 : 400,
                      transition: 'all 0.1s',
                    }}
                  >
                    {f}
                  </button>
                ),
              )}
            </div>
          </div>
          {forma && (
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Valor recebido
              </label>
              <input
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                type='number'
                autoFocus
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 12px',
                  fontSize: 16,
                  fontWeight: 500,
                }}
              />
            </div>
          )}
          <div
            style={{
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Faltam
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: faltam > 0 ? 'var(--red-500)' : 'var(--text-muted)',
                }}
              >
                {fmt(faltam)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Troco
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: troco > 0 ? 'var(--green-500)' : 'var(--text-muted)',
                }}
              >
                {fmt(troco)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Valor pago
              </span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{fmt(pago)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-md)',
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              Voltar (Esc)
            </button>
            <button
              disabled={!forma || faltam > 0}
              onClick={() => onFinalizar({ forma, valor: pago, troco })}
              style={{
                padding: '9px 22px',
                borderRadius: 'var(--radius-md)',
                background:
                  !forma || faltam > 0 ? 'var(--gray-200)' : 'var(--blue-700)',
                color: !forma || faltam > 0 ? 'var(--text-muted)' : '#fff',
                fontSize: 13,
                fontWeight: 500,
                cursor: !forma || faltam > 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Finalizar venda (F5)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Vendas() {
  const [busca, setBusca] = useState('')
  const [itens, setItens] = useState([])
  const [itemModal, setItemModal] = useState(null)
  const [pagModal, setPagModal] = useState(false)
  const [clienteBusca, setClienteBusca] = useState('')
  const [clienteSel, setClienteSel] = useState(clientes[0])
  const [clienteDropdown, setClienteDropdown] = useState(false)
  const [vendaFinalizada, setVendaFinalizada] = useState(false)

  const prodsFiltrados = useMemo(
    () =>
      todosProds.filter(
        (p) =>
          p.descricao.toLowerCase().includes(busca.toLowerCase()) ||
          p.codigo.includes(busca),
      ),
    [busca],
  )

  const total = itens.reduce((s, i) => s + i.total, 0)

  function addItem(item) {
    setItens((prev) => {
      const existing = prev.findIndex((i) => i.id === item.id)
      if (existing >= 0) {
        const copy = [...prev]
        copy[existing] = {
          ...copy[existing],
          qty: copy[existing].qty + item.qty,
          total: copy[existing].total + item.total,
        }
        return copy
      }
      return [...prev, item]
    })
    setItemModal(null)
  }

  function removeItem(id) {
    setItens((prev) => prev.filter((i) => i.id !== id))
  }

  function finalizarVenda() {
    setItens([])
    setPagModal(false)
    setVendaFinalizada(true)
    setTimeout(() => setVendaFinalizada(false), 2500)
  }

  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(clienteBusca.toLowerCase()),
  )

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {vendaFinalizada && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--green-500)',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: 'var(--radius-lg)',
            fontSize: 14,
            fontWeight: 500,
            zIndex: 300,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          Venda finalizada com sucesso!
        </div>
      )}

      {itemModal && (
        <ModalItem
          produto={itemModal}
          onConfirm={addItem}
          onClose={() => setItemModal(null)}
        />
      )}
      {pagModal && (
        <ModalPagamento
          total={total}
          onClose={() => setPagModal(false)}
          onFinalizar={finalizarVenda}
        />
      )}

      <div
        style={{
          width: 340,
          flexShrink: 0,
          background: '#fff',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '14px 14px 10px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              marginBottom: 10,
              letterSpacing: '0.03em',
            }}
          >
            VENDA ATUAL
          </div>

          <div style={{ marginBottom: 8, position: 'relative' }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginBottom: 3,
              }}
            >
              Cliente (F2)
            </div>
            <input
              value={clienteSel ? clienteSel.nome : clienteBusca}
              onChange={(e) => {
                setClienteBusca(e.target.value)
                setClienteSel(null)
                setClienteDropdown(true)
              }}
              onFocus={() => setClienteDropdown(true)}
              style={{ width: '100%', height: 32, padding: '0 10px' }}
            />
            {clienteDropdown && clientesFiltrados.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: '#fff',
                  border: '1px solid var(--border-md)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {clientesFiltrados.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setClienteSel(c)
                      setClienteBusca('')
                      setClienteDropdown(false)
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: 13,
                      display: 'block',
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--gray-50)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <div style={{ fontWeight: 500 }}>{c.nome}</div>
                    {c.cpf_cnpj && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {c.cpf_cnpj}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginBottom: 3,
              }}
            >
              Vendedor
            </div>
            <input
              defaultValue='Geral'
              style={{ width: '100%', height: 32, padding: '0 10px' }}
            />
          </div>
        </div>

        <div
          style={{
            padding: '4px 6px 2px',
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              padding: '4px 8px',
            }}
          >
            PRODUTO
          </span>
          <span
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              padding: '4px 8px',
            }}
          >
            VALOR
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {itens.length === 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 120,
                color: 'var(--text-muted)',
                fontSize: 12,
                gap: 6,
                border: '1px dashed var(--border-md)',
                borderRadius: 'var(--radius-md)',
                margin: 4,
              }}
            >
              <Plus size={20} opacity={0.4} />
              Pesquise produtos ao lado
            </div>
          )}
          {itens.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                marginBottom: 5,
                background: '#fff',
                transition: 'border-color 0.1s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = 'var(--blue-200)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = 'var(--border)')
              }
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.descricao}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginTop: 1,
                  }}
                >
                  {item.qty} × {fmt(item.preco_vista)}
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--blue-700)',
                  flexShrink: 0,
                }}
              >
                {fmt(item.total)}
              </div>
              <button
                onClick={() => removeItem(item.id)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--red-50)'
                  e.currentTarget.style.color = 'var(--red-500)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--border)',
            background: 'var(--gray-50)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 3,
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Qtde itens
            </span>
            <span style={{ fontSize: 12, fontWeight: 500 }}>
              {itens.reduce((s, i) => s + i.qty, 0).toFixed(2)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Produtos
            </span>
            <span style={{ fontSize: 12, fontWeight: 500 }}>
              {itens.length}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Total
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: 'var(--blue-700)',
              }}
            >
              {fmt(total)}
            </span>
          </div>
          <button
            onClick={() => itens.length > 0 && setPagModal(true)}
            style={{
              width: '100%',
              height: 42,
              background:
                itens.length > 0 ? 'var(--blue-700)' : 'var(--gray-200)',
              color: itens.length > 0 ? '#fff' : 'var(--text-muted)',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              fontWeight: 500,
              cursor: itens.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => {
              if (itens.length > 0)
                e.currentTarget.style.background = 'var(--blue-800)'
            }}
            onMouseLeave={(e) => {
              if (itens.length > 0)
                e.currentTarget.style.background = 'var(--blue-700)'
            }}
          >
            Total (F5) — Finalizar venda
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '12px 14px',
            background: '#fff',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
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
                placeholder='Pesquisar produto por descrição ou código (F4)...'
                style={{ width: '100%', height: 36, paddingLeft: 32 }}
              />
            </div>
            <select
              style={{
                height: 36,
                padding: '0 10px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <option>Todos</option>
              <option>Calhas</option>
              <option>Rufos</option>
              <option>Chapas</option>
            </select>
            <div
              style={{
                height: 36,
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                fontSize: 12,
                color: 'var(--text-muted)',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-md)',
              }}
            >
              {prodsFiltrados.length} registros
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              <col style={{ width: 88 }} />
              <col />
              <col style={{ width: 86 }} />
              <col style={{ width: 86 }} />
              <col style={{ width: 46 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 60 }} />
              <col style={{ width: 64 }} />
            </colgroup>
            <thead>
              <tr>
                {[
                  'Código',
                  'Descrição',
                  'Preço vista',
                  'Preço prazo',
                  'UN',
                  'Estoque',
                  'Cond.',
                  'Saldo',
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
              {prodsFiltrados.map((p) => (
                <tr
                  key={p.id}
                  onDoubleClick={() => setItemModal(p)}
                  style={{ cursor: 'pointer', transition: 'background 0.08s' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--blue-50)')
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
                    {p.descricao}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 13,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {fmt(p.preco_vista)}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {fmt(p.preco_prazo)}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {p.un}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <EstoqueBadge qtd={p.estoque} />
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'center',
                    }}
                  >
                    {p.condicional}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 12,
                      fontWeight: 500,
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'center',
                    }}
                  >
                    {p.estoque - p.condicional}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            background: '#fff',
            borderTop: '1px solid var(--border)',
            padding: '8px 12px',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          {[
            { icon: Search, label: 'Buscar pré-venda' },
            { icon: ChevronRight, label: 'Tornar pré-venda' },
            { icon: FileText, label: 'Consultar vendas' },
            { icon: RotateCcw, label: 'Consulta preço (F7)' },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 32,
                padding: '0 12px',
                border: '1px solid var(--border-md)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                color: 'var(--text-secondary)',
                background: '#fff',
                transition: 'all 0.1s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--gray-50)'
                e.currentTarget.style.borderColor = 'var(--blue-200)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff'
                e.currentTarget.style.borderColor = 'var(--border-md)'
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 32,
              padding: '0 12px',
              border: '1px solid var(--red-100)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              color: 'var(--red-500)',
              background: '#fff',
            }}
          >
            Sair (Esc)
          </button>
        </div>
      </div>
    </div>
  )
}
