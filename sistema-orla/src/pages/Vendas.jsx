import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Trash2,
  Plus,
  ChevronRight,
  FileText,
  RotateCcw,
} from 'lucide-react'
import ModalAcessoNegado from '../components/ModalAcessoNegado'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const UNIDADES_FRACIONAVEIS = new Set(['KG', 'G', 'MT', 'CM', 'M2', 'LT'])

function maskQtd(v) {
  return v.replace(/[^0-9,]/g, '')
}
function parseQtd(v) {
  return parseFloat(String(v).replace(',', '.')) || 0
}

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

function clampDesconto(v) {
  const n = parseFloat(v)
  if (isNaN(n)) return 0
  return Math.min(100, Math.max(0, n))
}

function ModalItem({ produto, onConfirm, onClose }) {
  const preco = produto.preco_venda_vista || produto.preco_vista || 0
  const fracionavel = UNIDADES_FRACIONAVEIS.has(produto.unidade)
  const [qty, setQty] = useState('1')
  const [desc, setDesc] = useState('0')
  const descAplicado = clampDesconto(desc)
  const total = parseQtd(qty) * preco * (1 - descAplicado / 100)
  const podeConfirmar = parseQtd(qty) > 0 && preco > 0

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
          borderRadius: 14,
          border: '1px solid var(--border-md)',
          width: 400,
          padding: 24,
          boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
            {produto.codigo}
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>
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
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Quantidade {produto.unidade ? `(${produto.unidade})` : ''}
            </label>
            <input
              value={qty}
              onChange={(e) => setQty(maskQtd(e.target.value))}
              inputMode='decimal'
              placeholder={fracionavel ? '0,000' : '1'}
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid var(--border-md)',
              }}
              autoFocus
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
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
                border: '1px solid var(--border-md)',
                background: 'var(--gray-50)',
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
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
                border: '1px solid var(--border-md)',
              }}
            />
            {(parseFloat(desc) < 0 || parseFloat(desc) > 100) && (
              <div style={{ fontSize: 11, color: '#C53030', marginTop: 3 }}>
                Desconto deve ser entre 0% e 100% — será aplicado {descAplicado}%.
              </div>
            )}
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
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
              border: '1px solid var(--border-md)',
              fontSize: 13,
              color: 'var(--text-muted)',
            }}
          >
            Cancelar (Esc)
          </button>
          <button
            disabled={!podeConfirmar}
            onClick={() =>
              podeConfirmar &&
              onConfirm({
                ...produto,
                qty: parseQtd(qty),
                desconto: descAplicado,
                total,
              })
            }
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              background: podeConfirmar ? '#185FA5' : 'var(--border-md)',
              color: podeConfirmar ? 'var(--surface)' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 600,
              cursor: podeConfirmar ? 'pointer' : 'not-allowed',
            }}
          >
            Confirmar (Ctrl+S)
          </button>
        </div>
      </div>
    </div>
  )
}

function gerarParcelas(total, qtde, primeiroPgto) {
  const base = new Date(primeiroPgto + 'T12:00:00')
  const valorBase = Math.floor((total / qtde) * 100) / 100
  const resto = Math.round((total - valorBase * qtde) * 100) / 100
  return Array.from({ length: qtde }, (_, i) => {
    const d = new Date(base)
    d.setMonth(d.getMonth() + i)
    return {
      seq: String(i + 1).padStart(3, '0'),
      data_vencimento: d.toISOString().slice(0, 10),
      valor: i === qtde - 1 ? valorBase + resto : valorBase,
    }
  })
}

function ModalPagamento({ total, clienteAnonimo, onClose, onFinalizar }) {
  const [forma, setForma] = useState(null)
  const [valor, setValor] = useState(total.toFixed(2))

  // parcelamento / fiado
  const d30 = new Date(); d30.setDate(d30.getDate() + 30)
  const [numParcelas, setNumParcelas] = useState(1)
  const [primeiroPgto, setPrimeiroPgto] = useState(d30.toISOString().slice(0, 10))
  const [nomeFiado, setNomeFiado] = useState('')
  const [telefoneFiado, setTelefoneFiado] = useState('')

  const pago = parseFloat(valor) || 0
  const troco = Math.max(0, pago - total)
  const faltam = Math.max(0, total - pago)
  const ePrazo = forma === 'A Prazo'
  const precisaContato = ePrazo && clienteAnonimo
  const parcelas = ePrazo ? gerarParcelas(total, numParcelas, primeiroPgto) : []
  const podeFinalizar =
    forma &&
    (ePrazo || forma === 'Convênio' || faltam === 0) &&
    (!precisaContato || (nomeFiado.trim() && telefoneFiado.trim()))

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border-md)', width: ePrazo ? 520 : 460, boxShadow: '0 20px 50px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ background: '#185FA5', padding: '16px 22px' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 2 }}>Total da venda</div>
          <div style={{ color: 'var(--surface)', fontSize: 28, fontWeight: 600 }}>{fmt(total)}</div>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>FORMA DE PAGAMENTO</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {['Dinheiro', 'Cartão Crédito', 'Cartão Débito', 'A Prazo', 'Convênio', 'Cheque', 'Haver'].map((f) => (
                <button key={f} onClick={() => { setForma(f); setValor(total.toFixed(2)) }}
                  style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                    border: forma === f ? '2px solid #185FA5' : '1px solid var(--border-md)',
                    background: forma === f ? '#EBF3FC' : 'var(--surface)',
                    color: forma === f ? '#185FA5' : 'var(--text-secondary)',
                    fontWeight: forma === f ? 600 : 400 }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {ePrazo ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nº de parcelas</label>
                  <select value={numParcelas} onChange={e => setNumParcelas(Number(e.target.value))}
                    style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-md)' }}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n === 1 ? 'À vista, fiado (1x)' : `${n}x`} de {fmt(Math.floor(total / n * 100) / 100)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{numParcelas === 1 ? 'Data combinada p/ pagar' : '1º vencimento'}</label>
                  <input type='date' value={primeiroPgto} onChange={e => setPrimeiroPgto(e.target.value)}
                    style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-md)' }} />
                </div>
              </div>
              {precisaContato && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: 10 }}>
                  <div style={{ gridColumn: '1 / -1', fontSize: 11, color: '#92400E', fontWeight: 500 }}>
                    Venda sem cliente cadastrado — informe nome e telefone para cobrança:
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nome</label>
                    <input value={nomeFiado} onChange={e => setNomeFiado(e.target.value)} placeholder='Nome do cliente'
                      style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-md)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Telefone</label>
                    <input value={telefoneFiado} onChange={e => setTelefoneFiado(e.target.value.replace(/[^0-9()\- ]/g, ''))} placeholder='(00) 00000-0000'
                      style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-md)' }} />
                  </div>
                </div>
              )}
              <div style={{ background: 'var(--gray-50)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Parcela', 'Vencimento', 'Valor'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', fontSize: 11, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-100)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parcelas.map(p => (
                      <tr key={p.seq}>
                        <td style={{ padding: '5px 10px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{p.seq}</td>
                        <td style={{ padding: '5px 10px', fontSize: 12, borderBottom: '1px solid var(--border)' }}>{new Date(p.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                        <td style={{ padding: '5px 10px', fontSize: 13, fontWeight: 600, color: 'var(--blue-700)', borderBottom: '1px solid var(--border)' }}>{fmt(p.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : forma === 'Convênio' ? (
            <div style={{ background: 'var(--blue-50)', border: '1px solid var(--blue-100)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--blue-800)' }}>
              Venda será lançada em Contas a Receber com vencimento em 30 dias.
            </div>
          ) : forma ? (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Valor recebido</label>
              <input value={valor} onChange={(e) => setValor(e.target.value)} type='number' autoFocus
                style={{ width: '100%', height: 40, padding: '0 12px', fontSize: 16, fontWeight: 500, borderRadius: 8, border: '1px solid var(--border-md)' }} />
            </div>
          ) : null}

          {forma && !ePrazo && forma !== 'Convênio' && (
            <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
              {[
                { label: 'Faltam', value: faltam, color: faltam > 0 ? '#C53030' : 'var(--text-muted)' },
                { label: 'Troco', value: troco, color: troco > 0 ? '#22863A' : 'var(--text-muted)' },
                { label: 'Valor pago', value: pago, color: 'var(--text-primary)' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: row.color }}>{fmt(row.value)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
              Voltar (Esc)
            </button>
            <button disabled={!podeFinalizar}
              onClick={() => onFinalizar({
                forma,
                valor: ePrazo ? total : (pago - troco),
                troco: ePrazo ? 0 : troco,
                parcelas: ePrazo ? parcelas : undefined,
                nomeFiado: precisaContato ? nomeFiado.trim() : undefined,
                telefoneFiado: precisaContato ? telefoneFiado.trim() : undefined,
              })}
              style={{ padding: '9px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: podeFinalizar ? 'pointer' : 'not-allowed',
                background: podeFinalizar ? '#185FA5' : 'var(--border-md)',
                color: podeFinalizar ? 'var(--surface)' : 'var(--text-muted)' }}>
              Finalizar venda (F5)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Vendas({ onNavigate, usuario }) {
  const [busca, setBusca] = useState('')
  const [itens, setItens] = useState([])
  const [itemModal, setItemModal] = useState(null)
  const [pagModal, setPagModal] = useState(false)
  const [clienteBusca, setClienteBusca] = useState('')
  const [clienteSel, setClienteSel] = useState(null)
  const [clienteDropdown, setClienteDropdown] = useState(false)
  const [vendaFinalizada, setVendaFinalizada] = useState(false)
  const [erroVenda, setErroVenda] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [observacao, setObservacao] = useState('')
  const [ultimasVendas, setUltimasVendas] = useState([])
  const [cancelando, setCancelando] = useState(null)
  const [acessoNegado, setAcessoNegado] = useState(null)

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
    carregarUltimas()
  }, [])

  async function carregarUltimas() {
    try {
      const hoje = new Date()
      const d = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`
      const vendas = await window.api.vendas.listar({ dataInicio: d, dataFim: d, situacao: 'N' })
      setUltimasVendas((vendas || []).slice(-5).reverse())
    } catch (_) {}
  }

  async function cancelarVenda(orcamento) {
    if ((usuario?.nivel ?? 0) < 2) {
      setAcessoNegado('Você não tem permissão para cancelar vendas. Entre em contato com um administrador.')
      return
    }
    if (!window.confirm(`Cancelar venda #${orcamento}? O estoque será revertido.`)) return
    setCancelando(orcamento)
    try {
      await window.api.vendas.cancelar({ orcamento, motivo: 'Cancelado pelo operador', usuario: usuario?.usuario || 'sistema' })
      await carregarUltimas()
    } catch (e) {
      alert('Erro ao cancelar: ' + e.message)
    } finally {
      setCancelando(null)
    }
  }

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
        .filter((c) => {
          const q = clienteBusca.toLowerCase()
          return (
            (c.nome || '').toLowerCase().includes(q) ||
            (c.codigo || '').includes(clienteBusca) ||
            (c.cpf || '').includes(clienteBusca) ||
            (c.cgc || '').includes(clienteBusca)
          )
        })
        .slice(0, 20),
    [clientes, clienteBusca],
  )

  const total = itens.reduce((s, i) => s + i.total, 0)

  function addItem(item) {
    const preco = item.preco_venda_vista || item.preco_vista || 0

    // Verifica se há estoque suficiente
    if (item.controla_estoque === 'S') {
      const qtdNoCarrinho =
        itens.find((i) => i.codigo === item.codigo)?.qty || 0
      const qtdTotal = qtdNoCarrinho + item.qty
      const estoque = item.estoque_atual || 0
      if (qtdTotal > estoque) {
        alert(
          `Estoque insuficiente!\nDisponível: ${estoque}\nNo carrinho: ${qtdNoCarrinho}\nSolicitado: ${item.qty}`,
        )
        return
      }
    }

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

  async function proximoCodigoCliente() {
    const todos = await window.api.clientes.listar({})
    const maxCod = todos.reduce((max, c) => {
      const n = parseInt(c.codigo) || 0
      return n > max ? n : max
    }, 0)
    return String(maxCod + 1).padStart(6, '0')
  }

  async function finalizarVenda({ forma, valor, troco, parcelas, nomeFiado, telefoneFiado }) {
    if (!clienteSel) return
    setSalvando(true)
    try {
      let codigoCliente = clienteSel.codigo

      // Fiado sem cliente cadastrado: cria um cadastro rápido com nome/telefone
      // para permitir a cobrança posterior (contas a receber).
      if (nomeFiado && telefoneFiado) {
        const codigoNovo = await proximoCodigoCliente()
        const resCliente = await window.api.clientes.salvar({
          codigo: codigoNovo,
          nome: nomeFiado,
          telefone: telefoneFiado,
          celular: telefoneFiado,
          codigo_situacao_cliente: 'A',
          usuario_cadastro: usuario?.usuario || 'sistema',
        })
        if (!resCliente?.sucesso) {
          setErroVenda('Erro ao cadastrar cliente para o fiado: ' + (resCliente?.erro || ''))
          setTimeout(() => setErroVenda(''), 5000)
          return
        }
        codigoCliente = codigoNovo
      }

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

      const orcamentoAtual = numeroVenda

      const vendedorLabel = [usuario?.codigo_vendedor, usuario?.nome || usuario?.usuario].filter(Boolean).join(' - ')

      const resultado = await window.api.vendas.salvar({
        orcamento: orcamentoAtual,
        codigo_cliente: codigoCliente,
        data: new Date().toISOString().slice(0, 10),
        tipo_venda: 'V',
        situacao: 'N',
        valor_total: total,
        valor_produtos: total,
        observacao,
        usuario_cadastro: vendedorLabel || 'sistema',
        numero_caixa: '001',
        numero_turno: '1',
        ...pagamento,
        ...(parcelas ? { parcelas } : {}),
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

      if (!resultado.sucesso) {
        setErroVenda(resultado.erro || 'Erro ao salvar venda.')
        setTimeout(() => setErroVenda(''), 5000)
        return
      }

      // Pega próximo número
      const num = await window.api.vendas.proximoNumero()
      setNumeroVenda(num.numero)

      setItens([])
      setObservacao('')
      setPagModal(false)
      setVendaFinalizada(true)
      carregarUltimas()
      setTimeout(() => setVendaFinalizada(false), 3000)

      // Gera PDF automaticamente
      if (window.api.pdf) {
        setGerandoPdf(true)
        try {
          await window.api.pdf.gerarVenda(orcamentoAtual)
        } catch (pdfErr) {
          console.error('Erro ao gerar PDF:', pdfErr)
        } finally {
          setGerandoPdf(false)
        }
      }
    } catch (err) {
      console.error('Erro ao finalizar venda:', err)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {(vendaFinalizada || gerandoPdf || erroVenda) && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: erroVenda ? '#C53030' : gerandoPdf ? 'var(--blue-700)' : 'var(--green-500)',
            color: 'var(--surface)',
            padding: '10px 24px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            zIndex: 300,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            whiteSpace: 'nowrap',
            animation: 'fadeIn 0.2s ease both',
            maxWidth: 480,
            textAlign: 'center',
          }}
        >
          {erroVenda ? `⚠️ ${erroVenda}` : gerandoPdf ? '📄 Abrindo PDF...' : '✅ Venda finalizada! PDF gerado.'}
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
          clienteAnonimo={!clienteSel || clienteSel.codigo === '000001'}
          onClose={() => setPagModal(false)}
          onFinalizar={finalizarVenda}
        />
      )}
      {acessoNegado && (
        <ModalAcessoNegado
          mensagem={acessoNegado}
          onFechar={() => setAcessoNegado(null)}
        />
      )}

      {/* ── PAINEL ESQUERDO — carrinho ── */}
      <div
        style={{
          width: 340,
          flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border-md)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '14px 14px 10px',
            borderBottom: '1px solid var(--border-md)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: 10,
              letterSpacing: '0.05em',
            }}
          >
            VENDA #{numeroVenda}
          </div>

          {/* Cliente */}
          <div style={{ marginBottom: 8, position: 'relative' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
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
                border: '1px solid var(--border-md)',
                fontSize: 13,
              }}
            />
            {clienteDropdown && clienteBusca.trim().length > 0 && clientesFiltrados.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: 'var(--surface)',
                  border: '1px solid var(--border-md)',
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
                      (e.currentTarget.style.background = 'var(--gray-50)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <div style={{ fontWeight: 500 }}>{c.nome}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      #{c.codigo}{(c.cgc || c.cpf) ? ` · ${c.cgc || c.cpf}` : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Observação */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
              Observação
            </div>
            <input
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Cortes, tamanhos, instruções..."
              style={{
                width: '100%',
                height: 32,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid var(--border-md)',
                fontSize: 13,
              }}
            />
          </div>
        </div>

        {/* Cabeçalho itens */}
        <div
          style={{
            padding: '4px 6px 2px',
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-md)',
          }}
        >
          <span style={{ fontSize: 10, color: 'var(--text-muted)', padding: '4px 8px' }}>
            PRODUTO
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', padding: '4px 8px' }}>
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
                color: 'var(--text-muted)',
                fontSize: 12,
                gap: 6,
                border: '1px dashed var(--border-md)',
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
                border: '1px solid var(--border-md)',
                marginBottom: 5,
                background: 'var(--surface)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = '#C5DEFA')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = 'var(--border-md)')
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
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
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
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#FFF0F0'
                  e.currentTarget.style.color = '#C53030'
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

        {/* Totais + botão finalizar */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--border-md)',
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
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Qtde itens</span>
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
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Produtos</span>
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
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Total</span>
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
              background: itens.length > 0 ? '#185FA5' : 'var(--border-md)',
              color: itens.length > 0 ? 'var(--surface)' : 'var(--text-muted)',
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

        {/* Últimas vendas do dia */}
        {ultimasVendas.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-md)', padding: '8px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.05em' }}>
              VENDAS RECENTES
            </div>
            {ultimasVendas.map((v) => (
              <div key={v.orcamento} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}>#{v.orcamento}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.nome_cliente || 'Consumidor'} · {fmt(v.valor_total)}
                  </div>
                </div>
                <button
                  onClick={() => cancelarVenda(v.orcamento)}
                  disabled={cancelando === v.orcamento}
                  title="Cancelar venda"
                  style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, border: '1px solid #FECACA', background: '#FFF0F0', color: '#C53030', cursor: 'pointer', flexShrink: 0 }}
                >
                  {cancelando === v.orcamento ? '...' : 'Cancelar'}
                </button>
              </div>
            ))}
          </div>
        )}
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
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border-md)',
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
                style={{
                  width: '100%',
                  height: 36,
                  paddingLeft: 32,
                  borderRadius: 8,
                  border: '1px solid var(--border-md)',
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
                border: '1px solid var(--border-md)',
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
                color: 'var(--text-muted)',
                background: 'var(--gray-50)',
                borderRadius: 8,
                border: '1px solid var(--border-md)',
              }}
            >
              {prodsFiltrados.length} registros
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--surface)' }}>
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
                      color: 'var(--text-muted)',
                      textAlign: 'left',
                      background: 'var(--gray-50)',
                      borderBottom: '1px solid var(--border-md)',
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
                    onClick={() => {
                      const semEstoque =
                        p.controla_estoque === 'S' &&
                        (p.estoque_atual || 0) <= 0
                      if (semEstoque) {
                        alert(
                          `Produto "${p.descricao}" está sem estoque e não pode ser vendido.`,
                        )
                        return
                      }
                      setItemModal(p)
                    }}
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
                    <td style={{ ...td, color: 'var(--text-muted)' }}>
                      {fmt(p.preco_venda_prazo)}
                    </td>
                    <td style={{ ...td, fontSize: 12, color: 'var(--text-muted)' }}>
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
            background: 'var(--surface)',
            borderTop: '1px solid var(--border-md)',
            padding: '8px 12px',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          {[
            { icon: Search, label: 'Buscar pré-venda', nav: 'pre-vendas' },
            { icon: ChevronRight, label: 'Tornar pré-venda', nav: 'pre-vendas' },
            { icon: FileText, label: 'Consultar vendas', nav: 'rel-vendas' },
            { icon: RotateCcw, label: 'Consulta preço (F7)', nav: 'estoque-consulta' },
          ].map(({ icon: Icon, label, nav }) => (
            <button
              key={label}
              onClick={() => onNavigate?.(nav)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 32,
                padding: '0 12px',
                border: '1px solid var(--border-md)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--text-muted)',
                background: 'var(--surface)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--gray-50)'
                e.currentTarget.style.borderColor = '#C5DEFA'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface)'
                e.currentTarget.style.borderColor = 'var(--border-md)'
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
