import { useState, useEffect } from 'react'
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  RefreshCw,
  Download,
  ShoppingCart,
  Truck,
  Archive,
  FileText,
} from 'lucide-react'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-'

// ── Exportar CSV (abre no Excel) ──────────────────────────────────────────────
function exportarCSV(linhas, nomeArquivo) {
  if (!linhas || linhas.length === 0) return
  const cabecalho = Object.keys(linhas[0])
  const escapar = (v) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const csv =
    '\uFEFF' + // BOM para Excel reconhecer UTF-8
    [cabecalho.join(';'), ...linhas.map((l) => cabecalho.map((c) => escapar(l[c])).join(';'))].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${nomeArquivo}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function BtnExportar({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: 30,
        padding: '0 12px',
        border: '1px solid var(--border-md)',
        borderRadius: 'var(--radius-md)',
        fontSize: 12,
        color: 'var(--text-secondary)',
        background: 'var(--surface)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
    >
      <Download size={12} /> Exportar Excel
    </button>
  )
}

function mesAtual() {
  const d = new Date()
  const ini = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  const fim = d.toISOString().slice(0, 10)
  return { ini, fim }
}

const abas = [
  { id: 'rel-vendas', label: 'Vendas', icon: BarChart2 },
  { id: 'rel-itens-vendidos', label: 'Itens Vendidos', icon: ShoppingCart },
  { id: 'rel-entradas', label: 'Entradas', icon: Truck },
  { id: 'rel-inventario', label: 'Inventário', icon: Archive },
  { id: 'rel-extrato', label: 'Extrato', icon: FileText },
  { id: 'rel-produtos', label: 'Produtos', icon: Package },
  { id: 'rel-contas-receber', label: 'Contas a receber', icon: TrendingUp },
  { id: 'rel-contas-pagar', label: 'Contas a pagar', icon: TrendingDown },
  { id: 'rel-financeiro', label: 'Financeiro', icon: DollarSign },
]

function CardMetrica({ label, value, sub, color }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: color || 'var(--text-primary)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function BarraHorizontal({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-primary)',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '68%',
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {fmt(value)}
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: 'var(--gray-100)',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color || 'var(--blue-400)',
            borderRadius: 99,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  )
}

function Carregando() {
  return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
      Carregando...
    </div>
  )
}

// ── RELATÓRIO DE VENDAS ───────────────────────────────────────────────────────
function RelVendas() {
  const { ini, fim } = mesAtual()
  const [dataInicio, setDataInicio] = useState(ini)
  const [dataFim, setDataFim] = useState(fim)
  const [filtroForma, setFiltroForma] = useState('todas')
  const [vendas, setVendas] = useState([])
  const [loading, setLoading] = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      const data = await window.api.vendas.listar({
        dataInicio,
        dataFim,
        situacao: 'N',
      })
      setVendas(data)
    } catch (err) {
      console.error('Erro ao carregar vendas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const filtradas =
    filtroForma === 'todas'
      ? vendas
      : vendas.filter((v) => v.codigo_forma_pagamento1 === filtroForma)

  const totalVendas = filtradas.reduce((s, v) => s + (v.valor_total || 0), 0)
  const ticketMedio = filtradas.length > 0 ? totalVendas / filtradas.length : 0

  const porForma = filtradas.reduce((acc, v) => {
    const f = v.codigo_forma_pagamento1 || 'Outros'
    acc[f] = (acc[f] || 0) + (v.valor_total || 0)
    return acc
  }, {})

  const porCliente = filtradas.reduce((acc, v) => {
    const cli = v.nome_cliente || 'Consumidor'
    acc[cli] = (acc[cli] || 0) + (v.valor_total || 0)
    return acc
  }, {})

  const maxForma = Math.max(...Object.values(porForma), 1)
  const maxCliente = Math.max(...Object.values(porCliente), 1)
  const formas = [...new Set(vendas.map((v) => v.codigo_forma_pagamento1).filter(Boolean))]

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 20,
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <label
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: 3,
            }}
          >
            Data inicial
          </label>
          <input
            type='date'
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            style={{ height: 34, padding: '0 10px' }}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: 3,
            }}
          >
            Data final
          </label>
          <input
            type='date'
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            style={{ height: 34, padding: '0 10px' }}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: 3,
            }}
          >
            Forma de pagamento
          </label>
          <select
            value={filtroForma}
            onChange={(e) => setFiltroForma(e.target.value)}
            style={{ height: 34, padding: '0 10px', borderRadius: 'var(--radius-md)' }}
          >
            <option value='todas'>Todas</option>
            {formas.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
        <button
          onClick={carregar}
          disabled={loading}
          style={{
            height: 34,
            padding: '0 14px',
            border: '1px solid var(--border-md)',
            borderRadius: 'var(--radius-md)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-secondary)',
          }}
        >
          <RefreshCw size={12} /> Buscar
        </button>
      </div>

      {loading ? (
        <Carregando />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <CardMetrica
              label='Total vendido'
              value={fmt(totalVendas)}
              color='var(--blue-700)'
            />
            <CardMetrica
              label='Qtde de vendas'
              value={filtradas.length}
              sub='no período'
            />
            <CardMetrica
              label='Ticket médio'
              value={fmt(ticketMedio)}
              color='var(--green-500)'
            />
            <CardMetrica
              label='Formas distintas'
              value={Object.keys(porForma).length}
              sub='formas de pagamento'
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                Vendas por forma de pagamento
              </div>
              {Object.entries(porForma).map(([forma, valor]) => (
                <BarraHorizontal
                  key={forma}
                  label={forma}
                  value={valor}
                  max={maxForma}
                  color='var(--blue-400)'
                />
              ))}
              {Object.keys(porForma).length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  Nenhuma venda no período.
                </div>
              )}
            </div>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                Vendas por cliente (top 10)
              </div>
              {Object.entries(porCliente)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([cliente, valor]) => (
                  <BarraHorizontal
                    key={cliente}
                    label={cliente}
                    value={valor}
                    max={maxCliente}
                    color='var(--blue-400)'
                  />
                ))}
              {Object.keys(porCliente).length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  Nenhuma venda no período.
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                Listagem de vendas ({filtradas.length})
              </div>
              <BtnExportar
                onClick={() =>
                  exportarCSV(
                    filtradas.map((v) => ({
                      'Nº Venda': v.orcamento,
                      Data: fmtDate(v.data),
                      Cliente: v.nome_cliente || '—',
                      'Forma Pagamento': v.codigo_forma_pagamento1 || '—',
                      'Total (R$)': (v.valor_total || 0).toFixed(2).replace('.', ','),
                    })),
                    `vendas_${dataInicio}_${dataFim}`,
                  )
                }
              />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Nº Venda', 'Data', 'Cliente', 'Forma', 'Total'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 14px',
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        textAlign: 'left',
                        background: 'var(--gray-50)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((v) => (
                  <tr
                    key={v.orcamento}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--gray-50)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <td
                      style={{
                        padding: '9px 14px',
                        fontSize: 12,
                        fontFamily: 'monospace',
                        color: 'var(--text-muted)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {v.orcamento}
                    </td>
                    <td
                      style={{
                        padding: '9px 14px',
                        fontSize: 13,
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {fmtDate(v.data)}
                    </td>
                    <td
                      style={{
                        padding: '9px 14px',
                        fontSize: 13,
                        fontWeight: 500,
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {v.nome_cliente || '—'}
                    </td>
                    <td
                      style={{
                        padding: '9px 14px',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <span
                        style={{
                          background: 'var(--gray-100)',
                          color: 'var(--gray-600)',
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontSize: 11,
                        }}
                      >
                        {v.codigo_forma_pagamento1 || '—'}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '9px 14px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--blue-700)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {fmt(v.valor_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '10px 14px',
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      background: 'var(--gray-50)',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    Total do período
                  </td>
                  <td
                    style={{
                      padding: '10px 14px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--blue-700)',
                      background: 'var(--gray-50)',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    {fmt(totalVendas)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── RELATÓRIO DE PRODUTOS ─────────────────────────────────────────────────────
function RelProdutos() {
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.produtos
      .listar({ situacao: 'A' })
      .then(setProdutos)
      .catch((err) => console.error('Erro ao carregar produtos:', err))
      .finally(() => setLoading(false))
  }, [])

  const totalUnid = produtos.reduce((s, p) => s + (p.estoque_atual || 0), 0)
  const semEstoque = produtos.filter((p) => (p.estoque_atual || 0) === 0).length
  const baixo = produtos.filter(
    (p) =>
      (p.estoque_atual || 0) > 0 &&
      (p.estoque_atual || 0) <= (p.estoque_minimo || 5),
  ).length
  const maxEstoque = Math.max(...produtos.map((p) => p.estoque_atual || 0), 1)
  const maxValorEstoque = Math.max(
    ...produtos.map((p) => (p.estoque_atual || 0) * (p.preco_venda_vista || 0)),
    1,
  )

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      {loading ? (
        <Carregando />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <CardMetrica label='Total de produtos' value={produtos.length} />
            <CardMetrica
              label='Total em estoque'
              value={totalUnid}
              sub='unidades'
              color='var(--blue-700)'
            />
            <CardMetrica
              label='Sem estoque'
              value={semEstoque}
              color='var(--red-500)'
            />
            <CardMetrica
              label='Estoque baixo'
              value={baixo}
              color='var(--amber-500)'
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                Estoque por produto (top 10)
              </div>
              {produtos
                .filter((p) => (p.estoque_atual || 0) > 0)
                .sort((a, b) => b.estoque_atual - a.estoque_atual)
                .slice(0, 10)
                .map((p) => (
                  <BarraHorizontal
                    key={p.codigo}
                    label={p.descricao}
                    value={p.estoque_atual || 0}
                    max={maxEstoque}
                    color={
                      (p.estoque_atual || 0) <= (p.estoque_minimo || 5)
                        ? 'var(--amber-400)'
                        : 'var(--blue-400)'
                    }
                  />
                ))}
            </div>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                Valor do estoque por produto (top 10)
              </div>
              {produtos
                .filter((p) => (p.estoque_atual || 0) > 0)
                .sort(
                  (a, b) =>
                    b.estoque_atual * b.preco_venda_vista -
                    a.estoque_atual * a.preco_venda_vista,
                )
                .slice(0, 10)
                .map((p) => (
                  <BarraHorizontal
                    key={p.codigo}
                    label={p.descricao}
                    value={(p.estoque_atual || 0) * (p.preco_venda_vista || 0)}
                    max={maxValorEstoque}
                    color='var(--green-500)'
                  />
                ))}
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                Listagem de produtos ({produtos.length})
              </div>
              <BtnExportar
                onClick={() =>
                  exportarCSV(
                    produtos.map((p) => ({
                      Código: p.codigo,
                      Descrição: p.descricao,
                      UN: p.unidade,
                      'Preço Vista (R$)': (p.preco_venda_vista || 0).toFixed(2).replace('.', ','),
                      'Preço Prazo (R$)': (p.preco_venda_prazo || 0).toFixed(2).replace('.', ','),
                      Estoque: p.estoque_atual || 0,
                      'Valor Total (R$)': ((p.estoque_atual || 0) * (p.preco_venda_vista || 0)).toFixed(2).replace('.', ','),
                    })),
                    'produtos_estoque',
                  )
                }
              />
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
                <col style={{ width: 90 }} />
                <col style={{ width: 90 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 100 }} />
              </colgroup>
              <thead>
                <tr>
                  {[
                    'Código',
                    'Descrição',
                    'UN',
                    'Preço vista',
                    'Preço prazo',
                    'Estoque',
                    'Valor total',
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
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => {
                  const est = p.estoque_atual || 0
                  const minimo = p.estoque_minimo || 5
                  return (
                    <tr
                      key={p.codigo}
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
                        {p.descricao}
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
                          fontSize: 13,
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {fmt(p.preco_venda_vista)}
                      </td>
                      <td
                        style={{
                          padding: '9px 10px',
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {fmt(p.preco_venda_prazo)}
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
                              est === 0
                                ? 'var(--red-50)'
                                : est <= minimo
                                  ? 'var(--amber-50)'
                                  : 'var(--green-50)',
                            color:
                              est === 0
                                ? 'var(--red-500)'
                                : est <= minimo
                                  ? 'var(--amber-500)'
                                  : 'var(--green-500)',
                            padding: '2px 8px',
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          {est}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '9px 10px',
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--blue-700)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {fmt(est * (p.preco_venda_vista || 0))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '10px 14px',
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      background: 'var(--gray-50)',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    Valor total do estoque
                  </td>
                  <td
                    style={{
                      padding: '10px 14px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--blue-700)',
                      background: 'var(--gray-50)',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    {fmt(
                      produtos.reduce(
                        (s, p) =>
                          s + (p.estoque_atual || 0) * (p.preco_venda_vista || 0),
                        0,
                      ),
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── RELATÓRIO CONTAS A RECEBER ────────────────────────────────────────────────
function RelContasReceber() {
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroSit, setFiltroSit] = useState('')

  async function carregar(sit) {
    setLoading(true)
    try {
      const data = await window.api.contasReceber.listar(sit ? { situacao: sit } : {})
      setContas(data)
    } catch (err) {
      console.error('Erro ao carregar contas a receber:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar('') }, [])

  const hoje = new Date().toISOString().slice(0, 10)
  const abertas = contas.filter((c) => c.situacao_docto === 'A')
  const pagas = contas.filter((c) => c.situacao_docto === 'P')
  const vencidas = abertas.filter((c) => c.data_vencimento < hoje)
  const totalAberto = abertas.reduce(
    (s, c) => s + ((c.valor_docto || 0) - (c.valor_pagamento || 0)),
    0,
  )
  const totalPago = pagas.reduce((s, c) => s + (c.valor_pagamento || 0), 0)
  const totalVencido = vencidas.reduce(
    (s, c) => s + ((c.valor_docto || 0) - (c.valor_pagamento || 0)),
    0,
  )

  const porCliente = abertas.reduce((acc, c) => {
    const cli = c.nome_cliente || c.codigo_cliente || '—'
    acc[cli] = (acc[cli] || 0) + ((c.valor_docto || 0) - (c.valor_pagamento || 0))
    return acc
  }, {})
  const maxCliente = Math.max(...Object.values(porCliente), 1)

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Situação</label>
          <select value={filtroSit} onChange={e => { setFiltroSit(e.target.value); carregar(e.target.value) }}
            style={{ height: 34, padding: '0 10px', borderRadius: 'var(--radius-md)' }}>
            <option value=''>Todas</option>
            <option value='A'>Abertas</option>
            <option value='P'>Pagas</option>
          </select>
        </div>
        <button onClick={() => carregar(filtroSit)} disabled={loading}
          style={{ height: 34, padding: '0 14px', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <RefreshCw size={12} /> Atualizar
        </button>
      </div>
      {loading ? (
        <Carregando />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <CardMetrica
              label='Em aberto'
              value={fmt(totalAberto)}
              color='var(--blue-700)'
            />
            <CardMetrica
              label='Recebido'
              value={fmt(totalPago)}
              color='var(--green-500)'
            />
            <CardMetrica
              label='Parcelas vencidas'
              value={vencidas.length}
              color='var(--red-500)'
            />
            <CardMetrica
              label='Total documentos'
              value={contas.length}
              sub='parcelas'
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                A receber por cliente (top 10)
              </div>
              {Object.entries(porCliente)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([cliente, valor]) => (
                  <BarraHorizontal
                    key={cliente}
                    label={cliente}
                    value={valor}
                    max={maxCliente}
                    color='var(--blue-400)'
                  />
                ))}
              {Object.keys(porCliente).length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  Nenhuma conta em aberto.
                </div>
              )}
            </div>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                Resumo por situação
              </div>
              {[
                {
                  label: 'Em aberto',
                  value: totalAberto,
                  color: 'var(--blue-400)',
                },
                {
                  label: 'Recebido',
                  value: totalPago,
                  color: 'var(--green-500)',
                },
                {
                  label: 'Vencido',
                  value: totalVencido,
                  color: 'var(--red-400)',
                },
              ].map((item) => (
                <BarraHorizontal
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  max={Math.max(totalAberto + totalPago, 1)}
                  color={item.color}
                />
              ))}
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                Listagem de parcelas ({contas.length})
              </div>
              <BtnExportar
                onClick={() =>
                  exportarCSV(
                    contas.map((c) => ({
                      Documento: c.nro_docto || '—',
                      Seq: c.seq_docto || '—',
                      Cliente: c.nome_cliente || c.codigo_cliente || '—',
                      Vencimento: fmtDate(c.data_vencimento),
                      'Valor (R$)': (c.valor_docto || 0).toFixed(2).replace('.', ','),
                      'Em Aberto (R$)': ((c.valor_docto || 0) - (c.valor_pagamento || 0)).toFixed(2).replace('.', ','),
                      Situação: c.situacao_docto === 'P' ? 'Baixado' : c.data_vencimento < new Date().toISOString().slice(0, 10) ? 'Vencido' : 'Aberto',
                    })),
                    'contas_receber',
                  )
                }
              />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    'Documento',
                    'Seq',
                    'Cliente',
                    'Vencimento',
                    'Valor',
                    'Em aberto',
                    'Situação',
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 14px',
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        textAlign: 'left',
                        background: 'var(--gray-50)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contas.map((c) => {
                  const vencido =
                    c.situacao_docto === 'A' && c.data_vencimento < hoje
                  const pago = c.situacao_docto === 'P'
                  const emAberto = (c.valor_docto || 0) - (c.valor_pagamento || 0)
                  return (
                    <tr
                      key={c.id}
                      style={{
                        background: vencido ? 'var(--red-50)' : 'transparent',
                        transition: 'background 0.08s',
                      }}
                      onMouseEnter={(e) => {
                        if (!vencido)
                          e.currentTarget.style.background = 'var(--gray-50)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = vencido
                          ? 'var(--red-50)'
                          : 'transparent'
                      }}
                    >
                      <td
                        style={{
                          padding: '9px 14px',
                          fontSize: 12,
                          fontFamily: 'monospace',
                          color: 'var(--text-muted)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {c.nro_docto || '—'}
                      </td>
                      <td
                        style={{
                          padding: '9px 14px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {c.seq_docto || '—'}
                      </td>
                      <td
                        style={{
                          padding: '9px 14px',
                          fontSize: 13,
                          fontWeight: 500,
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {c.nome_cliente || c.codigo_cliente || '—'}
                      </td>
                      <td
                        style={{
                          padding: '9px 14px',
                          fontSize: 12,
                          borderBottom: '1px solid var(--border)',
                          color: vencido ? 'var(--red-500)' : undefined,
                          fontWeight: vencido ? 500 : 400,
                        }}
                      >
                        {fmtDate(c.data_vencimento)}
                      </td>
                      <td
                        style={{
                          padding: '9px 14px',
                          fontSize: 13,
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {fmt(c.valor_docto)}
                      </td>
                      <td
                        style={{
                          padding: '9px 14px',
                          fontSize: 13,
                          fontWeight: 600,
                          borderBottom: '1px solid var(--border)',
                          color:
                            emAberto > 0
                              ? 'var(--blue-700)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {fmt(emAberto)}
                      </td>
                      <td
                        style={{
                          padding: '9px 14px',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <span
                          style={{
                            background: pago
                              ? 'var(--green-50)'
                              : vencido
                                ? 'var(--red-50)'
                                : 'var(--blue-50)',
                            color: pago
                              ? 'var(--green-700)'
                              : vencido
                                ? 'var(--red-500)'
                                : 'var(--blue-800)',
                            padding: '2px 9px',
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          {pago ? 'Baixado' : vencido ? 'Vencido' : 'Aberto'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── RELATÓRIO CONTAS A PAGAR ──────────────────────────────────────────────────
function RelContasPagar() {
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroSit, setFiltroSit] = useState('')

  async function carregar(sit) {
    setLoading(true)
    try {
      const data = await window.api.contasPagar.listar(sit ? { situacao: sit } : {})
      setContas(data)
    } catch (err) {
      console.error('Erro ao carregar contas a pagar:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar('') }, [])

  const hoje = new Date().toISOString().slice(0, 10)
  const abertas = contas.filter((c) => c.situacao_docto === 'A')
  const pagas = contas.filter((c) => c.situacao_docto === 'P')
  const vencidas = abertas.filter((c) => c.data_vencimento < hoje)
  const totalAberto = abertas.reduce(
    (s, c) => s + ((c.valor_docto || 0) - (c.valor_pagamento || 0)),
    0,
  )
  const totalPago = pagas.reduce((s, c) => s + (c.valor_pagamento || 0), 0)
  const totalVencido = vencidas.reduce(
    (s, c) => s + ((c.valor_docto || 0) - (c.valor_pagamento || 0)),
    0,
  )

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Situação</label>
          <select value={filtroSit} onChange={e => { setFiltroSit(e.target.value); carregar(e.target.value) }}
            style={{ height: 34, padding: '0 10px', borderRadius: 'var(--radius-md)' }}>
            <option value=''>Todas</option>
            <option value='A'>Abertas</option>
            <option value='P'>Pagas</option>
          </select>
        </div>
        <button onClick={() => carregar(filtroSit)} disabled={loading}
          style={{ height: 34, padding: '0 14px', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <RefreshCw size={12} /> Atualizar
        </button>
      </div>
      {loading ? (
        <Carregando />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <CardMetrica
              label='Em aberto'
              value={fmt(totalAberto)}
              color='var(--blue-700)'
            />
            <CardMetrica
              label='Vencido'
              value={fmt(totalVencido)}
              color='var(--red-500)'
            />
            <CardMetrica
              label='Pago'
              value={fmt(totalPago)}
              color='var(--green-500)'
            />
            <CardMetrica
              label='Total de contas'
              value={contas.length}
              sub='lançamentos'
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                Resumo por situação
              </div>
              {[
                {
                  label: 'Em aberto',
                  value: totalAberto,
                  color: 'var(--blue-400)',
                },
                {
                  label: 'Vencido',
                  value: totalVencido,
                  color: 'var(--red-400)',
                },
                { label: 'Pago', value: totalPago, color: 'var(--green-500)' },
              ].map((item) => (
                <BarraHorizontal
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  max={Math.max(totalAberto + totalPago, 1)}
                  color={item.color}
                />
              ))}
            </div>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                Próximos vencimentos
              </div>
              {abertas
                .filter((c) => c.data_vencimento >= hoje)
                .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
                .slice(0, 5)
                .map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>
                        {c.nro_docto || c.nome_fornecedor || '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {fmtDate(c.data_vencimento)}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--blue-700)',
                      }}
                    >
                      {fmt(c.valor_docto)}
                    </span>
                  </div>
                ))}
              {abertas.filter((c) => c.data_vencimento >= hoje).length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  Nenhum vencimento futuro.
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                Listagem de contas a pagar ({contas.length})
              </div>
              <BtnExportar
                onClick={() =>
                  exportarCSV(
                    contas.map((c) => {
                      const hoje = new Date().toISOString().slice(0, 10)
                      const vencido = c.situacao_docto === 'A' && c.data_vencimento < hoje
                      return {
                        Documento: c.nro_docto || '—',
                        Fornecedor: c.nome_fornecedor || '—',
                        Vencimento: fmtDate(c.data_vencimento),
                        'Valor (R$)': (c.valor_docto || 0).toFixed(2).replace('.', ','),
                        Situação: c.situacao_docto === 'P' ? 'Pago' : vencido ? 'Vencido' : 'Aberto',
                      }
                    }),
                    'contas_pagar',
                  )
                }
              />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Documento', 'Fornecedor', 'Vencimento', 'Valor', 'Situação'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: '8px 14px',
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'var(--text-secondary)',
                          textAlign: 'left',
                          background: 'var(--gray-50)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {contas.map((c) => {
                  const vencido =
                    c.situacao_docto === 'A' && c.data_vencimento < hoje
                  const pago = c.situacao_docto === 'P'
                  const situacao = pago
                    ? {
                        bg: 'var(--green-50)',
                        color: 'var(--green-700)',
                        label: 'Pago',
                      }
                    : vencido
                      ? {
                          bg: 'var(--red-50)',
                          color: 'var(--red-500)',
                          label: 'Vencido',
                        }
                      : {
                          bg: 'var(--blue-50)',
                          color: 'var(--blue-800)',
                          label: 'Aberto',
                        }
                  return (
                    <tr
                      key={c.id}
                      style={{
                        background: vencido ? 'var(--red-50)' : 'transparent',
                        transition: 'background 0.08s',
                      }}
                      onMouseEnter={(e) => {
                        if (!vencido)
                          e.currentTarget.style.background = 'var(--gray-50)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = vencido
                          ? 'var(--red-50)'
                          : 'transparent'
                      }}
                    >
                      <td
                        style={{
                          padding: '9px 14px',
                          fontSize: 13,
                          fontWeight: 500,
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {c.nro_docto || '—'}
                      </td>
                      <td
                        style={{
                          padding: '9px 14px',
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {c.nome_fornecedor || '—'}
                      </td>
                      <td
                        style={{
                          padding: '9px 14px',
                          fontSize: 12,
                          borderBottom: '1px solid var(--border)',
                          color: vencido ? 'var(--red-500)' : undefined,
                          fontWeight: vencido ? 500 : 400,
                        }}
                      >
                        {fmtDate(c.data_vencimento)}
                      </td>
                      <td
                        style={{
                          padding: '9px 14px',
                          fontSize: 13,
                          fontWeight: 600,
                          borderBottom: '1px solid var(--border)',
                          color: pago
                            ? 'var(--text-muted)'
                            : 'var(--text-primary)',
                        }}
                      >
                        {fmt(c.valor_docto)}
                      </td>
                      <td
                        style={{
                          padding: '9px 14px',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <span
                          style={{
                            background: situacao.bg,
                            color: situacao.color,
                            padding: '2px 9px',
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          {situacao.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      padding: '10px 14px',
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      background: 'var(--gray-50)',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    Total
                  </td>
                  <td
                    style={{
                      padding: '10px 14px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--blue-700)',
                      background: 'var(--gray-50)',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    {fmt(contas.reduce((s, c) => s + (c.valor_docto || 0), 0))}
                  </td>
                  <td
                    style={{
                      background: 'var(--gray-50)',
                      borderTop: '1px solid var(--border)',
                    }}
                  />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── RELATÓRIO FINANCEIRO ──────────────────────────────────────────────────────
function RelFinanceiro() {
  const { ini, fim } = mesAtual()
  const [dataInicio, setDataInicio] = useState(ini)
  const [dataFim, setDataFim] = useState(fim)
  const [vendas, setVendas] = useState([])
  const [contasReceber, setContasReceber] = useState([])
  const [contasPagar, setContasPagar] = useState([])
  const [loading, setLoading] = useState(true)

  async function carregar() {
    setLoading(true)
    try {
      const [v, cr, cp] = await Promise.all([
        window.api.vendas.listar({ dataInicio, dataFim, situacao: 'N' }),
        window.api.contasReceber.listar({ situacao: 'P', dataInicio, dataFim }),
        window.api.contasPagar.listar({ situacao: 'A' }),
      ])
      setVendas(v)
      setContasReceber(cr)
      setContasPagar(cp)
    } catch (err) {
      console.error('Erro ao carregar financeiro:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const totalVendas = vendas.reduce((s, v) => s + (v.valor_total || 0), 0)
  const totalRecebido = contasReceber.reduce(
    (s, c) => s + (c.valor_pagamento || 0),
    0,
  )
  const totalPagar = contasPagar.reduce(
    (s, c) => s + ((c.valor_docto || 0) - (c.valor_pagamento || 0)),
    0,
  )
  const saldo = totalVendas - totalPagar

  const totalDinheiro = vendas.reduce(
    (s, v) => s + (v.valor_pago_dinheiro || 0),
    0,
  )
  const totalCartaoC = vendas.reduce(
    (s, v) => s + (v.valor_pago_cartao_credito || 0),
    0,
  )
  const totalCartaoD = vendas.reduce(
    (s, v) => s + (v.valor_pago_cartao_debito || 0),
    0,
  )
  const totalCheque = vendas.reduce(
    (s, v) => s + (v.valor_pago_cheque || 0),
    0,
  )

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Data inicial</label>
          <input type='date' value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={{ height: 34, padding: '0 10px' }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Data final</label>
          <input type='date' value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ height: 34, padding: '0 10px' }} />
        </div>
        <button onClick={carregar} disabled={loading}
          style={{ height: 34, padding: '0 14px', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <RefreshCw size={12} /> Buscar
        </button>
      </div>
      {loading ? (
        <Carregando />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <CardMetrica
              label='Total de vendas (período)'
              value={fmt(totalVendas)}
              color='var(--blue-700)'
            />
            <CardMetrica
              label='Total recebido'
              value={fmt(totalRecebido)}
              color='var(--green-500)'
            />
            <CardMetrica
              label='Contas a pagar (abertas)'
              value={fmt(totalPagar)}
              color='var(--red-500)'
            />
            <CardMetrica
              label='Saldo do período'
              value={fmt(saldo)}
              color={saldo >= 0 ? 'var(--green-500)' : 'var(--red-500)'}
            />
          </div>

          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
          >
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                Receitas vs Despesas (mês atual)
              </div>
              {[
                {
                  label: 'Vendas (receita)',
                  value: totalVendas,
                  color: 'var(--blue-400)',
                },
                {
                  label: 'Recebido efetivo',
                  value: totalRecebido,
                  color: 'var(--green-500)',
                },
                {
                  label: 'Contas a pagar',
                  value: totalPagar,
                  color: 'var(--red-400)',
                },
              ].map((item) => (
                <BarraHorizontal
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  max={Math.max(totalVendas, 1)}
                  color={item.color}
                />
              ))}
            </div>

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                Resumo por forma de pagamento
              </div>
              {[
                {
                  label: 'Dinheiro',
                  value: totalDinheiro,
                  color: 'var(--green-500)',
                },
                {
                  label: 'Cartão Crédito',
                  value: totalCartaoC,
                  color: 'var(--blue-500)',
                },
                {
                  label: 'Cartão Débito',
                  value: totalCartaoD,
                  color: 'var(--blue-400)',
                },
                {
                  label: 'Cheque',
                  value: totalCheque,
                  color: 'var(--amber-500)',
                },
              ]
                .filter((i) => i.value > 0)
                .map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: item.color,
                      }}
                    >
                      {fmt(item.value)}
                    </span>
                  </div>
                ))}
              {totalDinheiro + totalCartaoC + totalCartaoD + totalCheque === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  Nenhuma venda no período.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── ITENS VENDIDOS ────────────────────────────────────────────────────────────
function RelItenisVendidos() {
  const { ini, fim } = mesAtual()
  const [dataInicio, setDataInicio] = useState(ini)
  const [dataFim, setDataFim] = useState(fim)
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      const data = await window.api.relatorios.itenisVendidos({ dataInicio, dataFim })
      setItens(data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  const totalQtd = itens.reduce((s, i) => s + (i.quantidade || 0), 0)
  const totalVal = itens.reduce((s, i) => s + (i.valor_venda || 0), 0)

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>De</label>
          <input type='date' value={dataInicio} onChange={e => setDataInicio(e.target.value)}
            style={{ height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Até</label>
          <input type='date' value={dataFim} onChange={e => setDataFim(e.target.value)}
            style={{ height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 13 }} />
        </div>
        <button onClick={carregar} style={{ height: 32, padding: '0 16px', borderRadius: 6, background: 'var(--blue-700)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          {loading ? 'Carregando…' : 'Atualizar'}
        </button>
        <BtnExportar onClick={() => exportarCSV(itens.map(i => ({
          Código: i.codigo, Descrição: i.descricao,
          Quantidade: String(i.quantidade || 0).replace('.', ','),
          'Valor Venda (R$)': (i.valor_venda || 0).toFixed(2).replace('.', ','),
        })), `itens_vendidos_${dataInicio}_${dataFim}`)} />
      </div>
      {loading ? <Carregando /> : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11 }}>CÓDIGO</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11 }}>DESCRIÇÃO</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11 }}>QUANTIDADE</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11 }}>VALOR VENDA</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((it, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '7px 12px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{it.codigo}</td>
                  <td style={{ padding: '7px 12px' }}>{it.descricao}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{(it.quantidade || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 500 }}>{fmt(it.valor_venda)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--gray-50)', borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                <td colSpan={2} style={{ padding: '8px 12px' }}>TOTAL — {itens.length} produtos</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{totalQtd.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--blue-700)' }}>{fmt(totalVal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

// ── ENTRADAS DE MERCADORIA ────────────────────────────────────────────────────
function RelEntradasMercadoria() {
  const { ini, fim } = mesAtual()
  const [dataInicio, setDataInicio] = useState(ini)
  const [dataFim, setDataFim] = useState(fim)
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      const data = await window.api.relatorios.entradasMercadoria({ dataInicio, dataFim })
      setItens(data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  const totalQtd = itens.reduce((s, i) => s + (i.qtde_total || 0), 0)
  const totalVal = itens.reduce((s, i) => s + (i.valor_total || 0), 0)

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>De</label>
          <input type='date' value={dataInicio} onChange={e => setDataInicio(e.target.value)}
            style={{ height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Até</label>
          <input type='date' value={dataFim} onChange={e => setDataFim(e.target.value)}
            style={{ height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 13 }} />
        </div>
        <button onClick={carregar} style={{ height: 32, padding: '0 16px', borderRadius: 6, background: 'var(--blue-700)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          {loading ? 'Carregando…' : 'Atualizar'}
        </button>
        <BtnExportar onClick={() => exportarCSV(itens.map(i => ({
          Código: i.codigo, 'Nome/Descrição': i.descricao,
          'Qtde Total': String(i.qtde_total || 0).replace('.', ','),
          'Valor Total (R$)': (i.valor_total || 0).toFixed(2).replace('.', ','),
        })), `entradas_mercadoria_${dataInicio}_${dataFim}`)} />
      </div>
      {loading ? <Carregando /> : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11 }}>CÓDIGO</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11 }}>NOME/DESCRIÇÃO</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11 }}>QTDE TOTAL</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11 }}>VALOR TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((it, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '7px 12px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{it.codigo}</td>
                  <td style={{ padding: '7px 12px' }}>{it.descricao}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{(it.qtde_total || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 500 }}>{fmt(it.valor_total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--gray-50)', borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                <td colSpan={2} style={{ padding: '8px 12px' }}>TOTAL — {itens.length} produtos</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{totalQtd.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--blue-700)' }}>{fmt(totalVal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

// ── INVENTÁRIO DE PRODUTOS ────────────────────────────────────────────────────
function RelInventario() {
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    window.api.relatorios.inventario().then(setItens).finally(() => setLoading(false))
  }, [])

  const filtrados = itens.filter(i =>
    !busca || i.descricao.toLowerCase().includes(busca.toLowerCase()) || i.codigo.includes(busca)
  )
  const totalCusto = filtrados.reduce((s, i) => s + (i.valor_custo || 0), 0)
  const totalVista = filtrados.reduce((s, i) => s + (i.valor_vista || 0), 0)

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <input placeholder='Buscar produto…' value={busca} onChange={e => setBusca(e.target.value)}
          style={{ height: 32, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 13, width: 240 }} />
        <BtnExportar onClick={() => exportarCSV(filtrados.map(i => ({
          Código: i.codigo, Descrição: i.descricao, Unidade: i.unidade,
          'Estoque Atual': String(i.estoque_atual || 0).replace('.', ','),
          'Estoque Mínimo': String(i.estoque_minimo || 0).replace('.', ','),
          'Custo Unit. (R$)': (i.preco_custo_atual || 0).toFixed(4).replace('.', ','),
          'Preço Vista (R$)': (i.preco_venda_vista || 0).toFixed(4).replace('.', ','),
          'Total Custo (R$)': (i.valor_custo || 0).toFixed(2).replace('.', ','),
          'Total Vista (R$)': (i.valor_vista || 0).toFixed(2).replace('.', ','),
        })), `inventario_${new Date().toISOString().slice(0,10)}`)} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{filtrados.length} produtos</span>
      </div>
      {loading ? <Carregando /> : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '2px solid var(--border)' }}>
                {['CÓDIGO','DESCRIÇÃO','UN','ESTOQUE','MÍN','CUSTO UNIT.','PREÇO VISTA','TOTAL CUSTO','TOTAL VISTA'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: h === 'CÓDIGO' || h === 'DESCRIÇÃO' || h === 'UN' ? 'left' : 'right', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((it, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{it.codigo}</td>
                  <td style={{ padding: '6px 10px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.descricao}</td>
                  <td style={{ padding: '6px 10px' }}>{it.unidade}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 500, color: (it.estoque_atual || 0) <= 0 ? '#DC2626' : 'inherit' }}>{(it.estoque_atual || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-muted)' }}>{it.estoque_minimo || 0}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right' }}>{(it.preco_custo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right' }}>{(it.preco_venda_vista || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right' }}>{fmt(it.valor_custo)}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 500 }}>{fmt(it.valor_vista)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--gray-50)', borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                <td colSpan={7} style={{ padding: '8px 10px' }}>TOTAL GERAL</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(totalCusto)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--blue-700)' }}>{fmt(totalVista)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

// ── EXTRATO ───────────────────────────────────────────────────────────────────
function RelExtrato() {
  const { ini, fim } = mesAtual()
  const [dataInicio, setDataInicio] = useState(ini)
  const [dataFim, setDataFim] = useState(fim)
  const [dados, setDados] = useState({ saldoInicial: 0, movimentos: [] })
  const [loading, setLoading] = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      const data = await window.api.relatorios.extrato({ dataInicio, dataFim })
      setDados(data || { saldoInicial: 0, movimentos: [] })
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  // Calcula saldo corrido
  let saldo = dados.saldoInicial || 0
  const linhas = (dados.movimentos || []).map(m => {
    saldo += (m.credito || 0) - (m.debito || 0)
    return { ...m, saldo }
  })

  const totalDeb = (dados.movimentos || []).reduce((s, m) => s + (m.debito || 0), 0)
  const totalCred = (dados.movimentos || []).reduce((s, m) => s + (m.credito || 0), 0)
  const saldoFinal = (dados.saldoInicial || 0) + totalCred - totalDeb

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>De</label>
          <input type='date' value={dataInicio} onChange={e => setDataInicio(e.target.value)}
            style={{ height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Até</label>
          <input type='date' value={dataFim} onChange={e => setDataFim(e.target.value)}
            style={{ height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 13 }} />
        </div>
        <button onClick={carregar} style={{ height: 32, padding: '0 16px', borderRadius: 6, background: 'var(--blue-700)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          {loading ? 'Carregando…' : 'Atualizar'}
        </button>
        <BtnExportar onClick={() => exportarCSV([
          { Data: '', Histórico: 'SALDO ANTERIOR', Débito: '', Crédito: '', Saldo: dados.saldoInicial.toFixed(2).replace('.', ','), Documento: '', Observação: '' },
          ...linhas.map(m => ({
            Data: fmtDate(m.data), Histórico: m.historico,
            'Débito (R$)': m.debito ? (m.debito).toFixed(2).replace('.', ',') : '',
            'Crédito (R$)': m.credito ? (m.credito).toFixed(2).replace('.', ',') : '',
            'Saldo (R$)': m.saldo.toFixed(2).replace('.', ','),
            Documento: m.documento || '', Observação: m.observacao || '',
          })),
          { Data: '', Histórico: 'SALDO FINAL', Débito: totalDeb.toFixed(2).replace('.', ','), Crédito: totalCred.toFixed(2).replace('.', ','), Saldo: saldoFinal.toFixed(2).replace('.', ','), Documento: '', Observação: '' },
        ], `extrato_${dataInicio}_${dataFim}`)} />
      </div>

      {/* Cards de totais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Saldo anterior', value: fmt(dados.saldoInicial), color: 'var(--text-primary)' },
          { label: 'Total créditos', value: fmt(totalCred), color: '#16A34A' },
          { label: 'Total débitos', value: fmt(totalDeb), color: '#DC2626' },
          { label: 'Saldo final', value: fmt(saldoFinal), color: saldoFinal >= 0 ? 'var(--blue-700)' : '#DC2626' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {loading ? <Carregando /> : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '2px solid var(--border)' }}>
                {['DATA','HISTÓRICO','DÉBITO','CRÉDITO','SALDO','DOCUMENTO','OBSERVAÇÃO'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: ['DÉBITO','CRÉDITO','SALDO'].includes(h) ? 'right' : 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: '#F0FDF4', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                <td colSpan={4} style={{ padding: '6px 10px', color: '#166534' }}>SALDO ANTERIOR</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', color: '#166534', fontWeight: 700 }}>{fmt(dados.saldoInicial)}</td>
                <td colSpan={2} />
              </tr>
              {linhas.map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>{fmtDate(m.data)}</td>
                  <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontWeight: 600, fontSize: 11 }}>{m.historico}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', color: m.debito ? '#DC2626' : 'var(--text-muted)' }}>{m.debito ? fmt(m.debito) : '—'}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', color: m.credito ? '#16A34A' : 'var(--text-muted)' }}>{m.credito ? fmt(m.credito) : '—'}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(m.saldo)}</td>
                  <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{m.documento}</td>
                  <td style={{ padding: '6px 10px', color: 'var(--text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.observacao}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--gray-50)', borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                <td colSpan={2} style={{ padding: '8px 10px' }}>SALDO</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#DC2626' }}>{fmt(totalDeb)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#16A34A' }}>{fmt(totalCred)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--blue-700)' }}>{fmt(saldoFinal)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function Relatorios({ paginaAtiva }) {
  const abaInicial = abas.find((a) => a.id === paginaAtiva)?.id || 'rel-vendas'
  const [abaAtiva, setAbaAtiva] = useState(abaInicial)

  async function exportarRelatorioGeral() {
    try {
      const { ini, fim } = (() => {
        const d = new Date()
        return {
          ini: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
          fim: d.toISOString().slice(0, 10),
        }
      })()
      const hoje = new Date().toISOString().slice(0, 10)
      const [vendas, produtos, contasRec, contasPag] = await Promise.all([
        window.api.vendas.listar({ dataInicio: ini, dataFim: fim, situacao: 'N' }),
        window.api.produtos.listar({ situacao: 'A' }),
        window.api.contasReceber.listar({}),
        window.api.contasPagar.listar({}),
      ])

      exportarCSV(
        vendas.map((v) => ({
          Seção: 'Venda',
          Referência: v.orcamento,
          Data: fmtDate(v.data),
          Descrição: v.nome_cliente || 'Consumidor',
          'Forma Pagamento': v.codigo_forma_pagamento1 || '—',
          'Valor (R$)': (v.valor_total || 0).toFixed(2).replace('.', ','),
          Situação: 'Finalizada',
        })).concat(
          produtos.map((p) => ({
            Seção: 'Produto',
            Referência: p.codigo,
            Data: '—',
            Descrição: p.descricao,
            'Forma Pagamento': p.unidade,
            'Valor (R$)': ((p.estoque_atual || 0) * (p.preco_venda_vista || 0)).toFixed(2).replace('.', ','),
            Situação: (p.estoque_atual || 0) === 0 ? 'Sem estoque' : 'OK',
          }))
        ).concat(
          contasRec.map((c) => ({
            Seção: 'A Receber',
            Referência: c.documento || '—',
            Data: fmtDate(c.data_vencimento),
            Descrição: c.nome_cliente || '—',
            'Forma Pagamento': '—',
            'Valor (R$)': (c.valor_docto || 0).toFixed(2).replace('.', ','),
            Situação: c.situacao_docto === 'P' ? 'Baixado' : c.data_vencimento < hoje ? 'Vencido' : 'Aberto',
          }))
        ).concat(
          contasPag.map((c) => ({
            Seção: 'A Pagar',
            Referência: c.nro_docto || '—',
            Data: fmtDate(c.data_vencimento),
            Descrição: c.nome_fornecedor || '—',
            'Forma Pagamento': '—',
            'Valor (R$)': (c.valor_docto || 0).toFixed(2).replace('.', ','),
            Situação: c.situacao_docto === 'P' ? 'Pago' : c.data_vencimento < hoje ? 'Vencido' : 'Aberto',
          }))
        ),
        `relatorio_geral_${hoje}`,
      )
    } catch (err) {
      console.error('Erro ao gerar relatório geral:', err)
    }
  }

  function renderAba() {
    switch (abaAtiva) {
      case 'rel-vendas':
        return <RelVendas />
      case 'rel-itens-vendidos':
        return <RelItenisVendidos />
      case 'rel-entradas':
        return <RelEntradasMercadoria />
      case 'rel-inventario':
        return <RelInventario />
      case 'rel-extrato':
        return <RelExtrato />
      case 'rel-produtos':
        return <RelProdutos />
      case 'rel-contas-receber':
        return <RelContasReceber />
      case 'rel-contas-pagar':
        return <RelContasPagar />
      case 'rel-financeiro':
        return <RelFinanceiro />
      default:
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-muted)',
              fontSize: 13,
            }}
          >
            Relatório em desenvolvimento
          </div>
        )
    }
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0 16px',
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          alignItems: 'center',
        }}
      >
        {abas.map((aba) => {
          const Icon = aba.icon
          const ativo = abaAtiva === aba.id
          return (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '13px 16px',
                fontSize: 13,
                fontWeight: ativo ? 500 : 400,
                color: ativo ? 'var(--blue-700)' : 'var(--text-secondary)',
                borderBottom: ativo
                  ? '2px solid var(--blue-700)'
                  : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.12s',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon
                size={14}
                style={{
                  color: ativo ? 'var(--blue-600)' : 'var(--text-muted)',
                }}
              />
              {aba.label}
            </button>
          )
        })}
        <div style={{ marginLeft: 'auto', padding: '0 8px', flexShrink: 0 }}>
          <button
            onClick={exportarRelatorioGeral}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 30,
              padding: '0 14px',
              border: '1px solid var(--blue-700)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--blue-700)',
              background: 'var(--surface)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--blue-700)'
              e.currentTarget.style.color = 'var(--surface)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface)'
              e.currentTarget.style.color = 'var(--blue-700)'
            }}
          >
            <Download size={12} /> Relatório Geral
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>{renderAba()}</div>
    </div>
  )
}
