import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Trash2,
  Plus,
  ChevronRight,
  FileText,
  RotateCcw,
} from 'lucide-react'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

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
      <span style={{ ...style, background: '#FFF0F0', color: '#C53030' }}>
        Sem estoque
      </span>
    )
  if (qtd <= 5)
    return (
      <span style={{ ...style, background: '#FFF8E6', color: '#B7791F' }}>
        {qtd}
      </span>
    )
  return (
    <span style={{ ...style, background: '#EAF6EE', color: '#22863A' }}>
      {qtd}
    </span>
  )
}

function ModalItem({ produto, onConfirm, onClose }) {
  const preco = produto.preco_venda_vista || produto.preco_vista || 0
  const [qty, setQty] = useState('1')
  const [desc, setDesc] = useState('0')
  const total =
    (parseFloat(qty) || 0) * preco * (1 - (parseFloat(desc) || 0) / 100)

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
          borderRadius: 14,
          border: '1px solid #E2EAF4',
          width: 400,
          padding: 24,
          boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#9AA3B2', marginBottom: 2 }}>
            {produto.codigo}
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, color: '#1A202C' }}>
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
                color: '#9AA3B2',
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
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid #E2EAF4',
              }}
              autoFocus
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: '#9AA3B2',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Preço unitário
            </label>
            <input
              value={preco.toFixed(2)}
              readOnly
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid #E2EAF4',
                background: '#F7FAFF',
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: '#9AA3B2',
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
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid #E2EAF4',
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: '#9AA3B2',
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
                background: '#EBF3FC',
                border: '1px solid #C5DEFA',
                borderRadius: 8,
                color: '#185FA5',
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
              borderRadius: 8,
              border: '1px solid #E2EAF4',
              fontSize: 13,
              color: '#9AA3B2',
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
              borderRadius: 8,
              background: '#185FA5',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
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
          borderRadius: 14,
          border: '1px solid #E2EAF4',
          width: 460,
          boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
      >
        <div style={{ background: '#185FA5', padding: '16px 22px' }}>
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
                color: '#9AA3B2',
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              FORMA DE PAGAMENTO
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {[
                'Dinheiro',
                'Cartão Crédito',
                'Cartão Débito',
                'Convênio',
                'Cheque',
                'Haver',
              ].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setForma(f)
                    setValor(total.toFixed(2))
                  }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    border:
                      forma === f ? '2px solid #185FA5' : '1px solid #E2EAF4',
                    background: forma === f ? '#EBF3FC' : '#fff',
                    color: forma === f ? '#185FA5' : '#4A5568',
                    fontWeight: forma === f ? 600 : 400,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {forma && (
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 11,
                  color: '#9AA3B2',
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
                  borderRadius: 8,
                  border: '1px solid #E2EAF4',
                }}
              />
            </div>
          )}
          <div
            style={{
              background: '#F7FAFF',
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 16,
            }}
          >
            {[
              {
                label: 'Faltam',
                value: faltam,
                color: faltam > 0 ? '#C53030' : '#9AA3B2',
              },
              {
                label: 'Troco',
                value: troco,
                color: troco > 0 ? '#22863A' : '#9AA3B2',
              },
              { label: 'Valor pago', value: pago, color: '#1A202C' },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 12, color: '#9AA3B2' }}>
                  {row.label}
                </span>
                <span
                  style={{ fontSize: 13, fontWeight: 500, color: row.color }}
                >
                  {fmt(row.value)}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                border: '1px solid #E2EAF4',
                fontSize: 13,
                color: '#9AA3B2',
              }}
            >
              Voltar (Esc)
            </button>
            <button
              disabled={!forma || faltam > 0}
              onClick={() => onFinalizar({ forma, valor: pago, troco })}
              style={{
                padding: '9px 22px',
                borderRadius: 8,
                background: !forma || faltam > 0 ? '#E2EAF4' : '#185FA5',
                color: !forma || faltam > 0 ? '#9AA3B2' : '#fff',
                fontSize: 13,
                fontWeight: 600,
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
  const [clienteSel, setClienteSel] = useState(null)
  const [clienteDropdown, setClienteDropdown] = useState(false)
  const [vendaFinalizada, setVendaFinalizada] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Dados do banco
  const [todosProds, setTodosProds] = useState([])
  const [clientes, setClientes] = useState([])
  const [numeroVenda, setNumeroVenda] = useState('00000001')
  const [linhas, setLinhas] = useState([])
  const [filtroLinha, setFiltroLinha] = useState('Todos')

  useEffect(() => {
    async function carregar() {
      try {
        const [prods, cls, num] = await Promise.all([
          window.api.produtos.listar({ situacao: 'A' }),
          window.api.clientes.listar({}),
          window.api.vendas.proximoNumero(),
        ])
        setTodosProds(prods)
        setClientes(cls)
        setNumeroVenda(num.numero)

        // Monta lista de linhas únicas
        const ls = [
          ...new Set(prods.map((p) => p.codigo_linha).filter(Boolean)),
        ]
        setLinhas(ls)

        // Seleciona "Consumidor a Vista" por padrão
        const consumidor = cls.find((c) => c.codigo === '000001') || cls[0]
        setClienteSel(consumidor || null)
      } catch (err) {
        console.error('Erro ao carregar vendas:', err)
      }
    }
    carregar()
  }, [])

  const prodsFiltrados = useMemo(() => {
    return todosProds.filter((p) => {
      const matchBusca =
        !busca ||
        (p.descricao || '').toLowerCase().includes(busca.toLowerCase()) ||
        (p.codigo || '').includes(busca)
      const matchLinha =
        filtroLinha === 'Todos' || p.codigo_linha === filtroLinha
      return matchBusca && matchLinha
    })
  }, [busca, filtroLinha, todosProds])

  const clientesFiltrados = useMemo(
    () =>
      clientes
        .filter((c) =>
          (c.nome || '').toLowerCase().includes(clienteBusca.toLowerCase()),
        )
        .slice(0, 20),
    [clientes, clienteBusca],
  )

  const total = itens.reduce((s, i) => s + i.total, 0)

  function addItem(item) {
    const preco = item.preco_venda_vista || item.preco_vista || 0
    setItens((prev) => {
      const idx = prev.findIndex((i) => i.codigo === item.codigo)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = {
          ...copy[idx],
          qty: copy[idx].qty + item.qty,
          total: copy[idx].total + item.total,
        }
        return copy
      }
      return [...prev, { ...item, preco_vista: preco }]
    })
    setItemModal(null)
  }

  function removeItem(codigo) {
    setItens((prev) => prev.filter((i) => i.codigo !== codigo))
  }

  async function finalizarVenda({ forma, valor, troco }) {
    if (!clienteSel) return
    setSalvando(true)
    try {
      // Monta campos de pagamento
      const pagamento = {
        codigo_forma_pagamento1: forma,
        valor_pago_dinheiro: forma === 'Dinheiro' ? valor : 0,
        valor_pago_cartao_credito: forma === 'Cartão Crédito' ? valor : 0,
        valor_pago_cartao_debito: forma === 'Cartão Débito' ? valor : 0,
        valor_pago_cheque: forma === 'Cheque' ? valor : 0,
        valor_pago_haver: forma === 'Haver' ? valor : 0,
        valor_troco: troco,
      }

      await window.api.vendas.salvar({
        orcamento: numeroVenda,
        codigo_cliente: clienteSel.codigo,
        data: new Date().toISOString().slice(0, 10),
        tipo_venda: 'V',
        situacao: 'N',
        valor_total: total,
        valor_produtos: total,
        usuario_cadastro: 'rosangela',
        numero_caixa: '001',
        numero_turno: '1',
        ...pagamento,
        itens: itens.map((item) => ({
          codigo_produto: item.codigo,
          descricao: item.descricao,
          quantidade: item.qty,
          unidade: item.unidade || 'UN',
          preco_unitario: item.preco_venda_vista || item.preco_vista || 0,
          preco_custo: item.preco_custo_atual || 0,
          valor_desconto: item.desconto
            ? (item.qty * (item.preco_venda_vista || 0) * item.desconto) / 100
            : 0,
          valor_acrescimo: 0,
          valor_total: item.total,
        })),
      })

      // Pega próximo número
      const num = await window.api.vendas.proximoNumero()
      setNumeroVenda(num.numero)

      setItens([])
      setPagModal(false)
      setVendaFinalizada(true)
      setTimeout(() => setVendaFinalizada(false), 2500)
    } catch (err) {
      console.error('Erro ao finalizar venda:', err)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {vendaFinalizada && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#22863A',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            zIndex: 300,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          ✅ Venda #{numeroVenda} finalizada com sucesso!
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

      {/* ── PAINEL ESQUERDO — carrinho ── */}
      <div
        style={{
          width: 340,
          flexShrink: 0,
          background: '#fff',
          borderRight: '1px solid #E2EAF4',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '14px 14px 10px',
            borderBottom: '1px solid #E2EAF4',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#9AA3B2',
              marginBottom: 10,
              letterSpacing: '0.05em',
            }}
          >
            VENDA #{numeroVenda}
          </div>

          {/* Cliente */}
          <div style={{ marginBottom: 8, position: 'relative' }}>
            <div style={{ fontSize: 11, color: '#9AA3B2', marginBottom: 3 }}>
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
              onBlur={() => setTimeout(() => setClienteDropdown(false), 150)}
              style={{
                width: '100%',
                height: 32,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid #E2EAF4',
                fontSize: 13,
              }}
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
                  border: '1px solid #E2EAF4',
                  borderRadius: 8,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {clientesFiltrados.map((c) => (
                  <button
                    key={c.codigo}
                    onMouseDown={() => {
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
                      borderBottom: '1px solid #F0F4FA',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = '#F7FAFF')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <div style={{ fontWeight: 500 }}>{c.nome}</div>
                    {(c.cgc || c.cpf) && (
                      <div style={{ fontSize: 11, color: '#9AA3B2' }}>
                        {c.cgc || c.cpf}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cabeçalho itens */}
        <div
          style={{
            padding: '4px 6px 2px',
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E2EAF4',
          }}
        >
          <span style={{ fontSize: 10, color: '#9AA3B2', padding: '4px 8px' }}>
            PRODUTO
          </span>
          <span style={{ fontSize: 10, color: '#9AA3B2', padding: '4px 8px' }}>
            VALOR
          </span>
        </div>

        {/* Lista de itens */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {itens.length === 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 120,
                color: '#9AA3B2',
                fontSize: 12,
                gap: 6,
                border: '1px dashed #E2EAF4',
                borderRadius: 8,
                margin: 4,
              }}
            >
              <Plus size={20} opacity={0.4} />
              Pesquise produtos ao lado
            </div>
          )}
          {itens.map((item) => (
            <div
              key={item.codigo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #E2EAF4',
                marginBottom: 5,
                background: '#fff',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = '#C5DEFA')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = '#E2EAF4')
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
                <div style={{ fontSize: 11, color: '#9AA3B2', marginTop: 1 }}>
                  {item.qty} ×{' '}
                  {fmt(item.preco_venda_vista || item.preco_vista || 0)}
                  {item.desconto > 0 && (
                    <span style={{ color: '#22863A', marginLeft: 4 }}>
                      -{item.desconto}%
                    </span>
                  )}
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#185FA5',
                  flexShrink: 0,
                }}
              >
                {fmt(item.total)}
              </div>
              <button
                onClick={() => removeItem(item.codigo)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9AA3B2',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#FFF0F0'
                  e.currentTarget.style.color = '#C53030'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#9AA3B2'
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Totais + botão finalizar */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid #E2EAF4',
            background: '#F7FAFF',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 3,
            }}
          >
            <span style={{ fontSize: 12, color: '#9AA3B2' }}>Qtde itens</span>
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
            <span style={{ fontSize: 12, color: '#9AA3B2' }}>Produtos</span>
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
            <span style={{ fontSize: 14, color: '#9AA3B2' }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#185FA5' }}>
              {fmt(total)}
            </span>
          </div>
          <button
            onClick={() => itens.length > 0 && !salvando && setPagModal(true)}
            disabled={salvando}
            style={{
              width: '100%',
              height: 42,
              background: itens.length > 0 ? '#185FA5' : '#E2EAF4',
              color: itens.length > 0 ? '#fff' : '#9AA3B2',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: itens.length > 0 ? 'pointer' : 'not-allowed',
              border: 'none',
            }}
          >
            {salvando ? 'Salvando...' : 'Total (F5) — Finalizar venda'}
          </button>
        </div>
      </div>

      {/* ── PAINEL DIREITO — produtos ── */}
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
            borderBottom: '1px solid #E2EAF4',
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
                  color: '#9AA3B2',
                }}
              />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder='Pesquisar produto por descrição ou código (F4)...'
                style={{
                  width: '100%',
                  height: 36,
                  paddingLeft: 32,
                  borderRadius: 8,
                  border: '1px solid #E2EAF4',
                  fontSize: 13,
                }}
              />
            </div>
            <select
              value={filtroLinha}
              onChange={(e) => setFiltroLinha(e.target.value)}
              style={{
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid #E2EAF4',
                fontSize: 13,
              }}
            >
              <option value='Todos'>Todos</option>
              {linhas.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <div
              style={{
                height: 36,
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                fontSize: 12,
                color: '#9AA3B2',
                background: '#F7FAFF',
                borderRadius: 8,
                border: '1px solid #E2EAF4',
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
              <col style={{ width: 90 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 46 }} />
              <col style={{ width: 80 }} />
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
                  'Saldo',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 10px',
                      fontSize: 11,
                      fontWeight: 500,
                      color: '#9AA3B2',
                      textAlign: 'left',
                      background: '#F7FAFF',
                      borderBottom: '1px solid #E2EAF4',
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
              {prodsFiltrados.map((p) => {
                const estoque = p.estoque_atual || 0
                const cond = p.estoque_condicional || 0
                return (
                  <tr
                    key={p.codigo}
                    onClick={() => setItemModal(p)}
                    style={{
                      cursor: 'pointer',
                      transition: 'background 0.08s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = '#EBF3FC')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <td style={td}>{p.codigo}</td>
                    <td
                      style={{
                        ...td,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.descricao}
                    </td>
                    <td style={{ ...td, color: '#185FA5', fontWeight: 600 }}>
                      {fmt(p.preco_venda_vista)}
                    </td>
                    <td style={{ ...td, color: '#9AA3B2' }}>
                      {fmt(p.preco_venda_prazo)}
                    </td>
                    <td style={{ ...td, fontSize: 12, color: '#9AA3B2' }}>
                      {p.unidade}
                    </td>
                    <td style={td}>
                      <EstoqueBadge qtd={estoque} />
                    </td>
                    <td style={{ ...td, fontWeight: 500, textAlign: 'center' }}>
                      {estoque - cond}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div
          style={{
            background: '#fff',
            borderTop: '1px solid #E2EAF4',
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
                border: '1px solid #E2EAF4',
                borderRadius: 8,
                fontSize: 12,
                color: '#9AA3B2',
                background: '#fff',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F7FAFF'
                e.currentTarget.style.borderColor = '#C5DEFA'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff'
                e.currentTarget.style.borderColor = '#E2EAF4'
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const td = {
  padding: '9px 10px',
  fontSize: 12,
  borderBottom: '1px solid #F0F4FA',
  fontFamily: 'monospace',
}
