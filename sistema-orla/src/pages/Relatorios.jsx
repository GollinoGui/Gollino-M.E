import { useState, useEffect, Fragment } from 'react'
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingCart,
  Truck,
  Archive,
  FileText,
  Wallet,
  Printer,
  Download,
  ListTree,
} from 'lucide-react'
import ThOrdenavel from '../components/ThOrdenavel'
import { BotaoGerarRelatorio } from '../components/BotoesRelatorio'
import StatusBadge from '../components/StatusBadge'
import { hojeLocal } from '../utils/data'
import ModalConfirmacao from '../components/ModalConfirmacao'
import { getSituacao as getSituacaoConta, STATUS_CFG } from '../utils/statusContas'
import { useOrdenacao } from '../utils/ordenacao'
import { fmtQtd } from '../utils/formatQtd'
import { totalRecebidoSessao } from '../utils/caixaHistorico'
import {
  exportarCSV,
  buscarEmpresa,
  gerarHtmlListaSimples,
  gerarPdfRelatorio,
  fmtMoedaBR,
} from '../utils/relatorios'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-'
const pessoaLabel = (nome, codigo, semCadastro = '—') =>
  codigo ? `#${codigo}${nome ? ` · ${nome}` : ''}` : nome || semCadastro

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
  { id: 'rel-caixa', label: 'Fechamento de Caixa', icon: Wallet },
  { id: 'rel-inventario', label: 'Inventário', icon: Archive },
  { id: 'rel-extrato', label: 'Extrato', icon: FileText },
  { id: 'rel-produtos', label: 'Produtos', icon: Package },
  { id: 'rel-contas-receber', label: 'Contas a receber', icon: TrendingUp },
  { id: 'rel-contas-pagar', label: 'Contas a pagar', icon: TrendingDown },
  { id: 'rel-financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'rel-plano-contas', label: 'Plano de Contas', icon: ListTree },
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
  const [imprimindo, setImprimindo] = useState(null)
  const [erroImpressao, setErroImpressao] = useState('')

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

  async function imprimirVenda(orcamento) {
    setImprimindo(orcamento)
    try {
      const res = await window.api.pdf.gerarVenda(orcamento)
      if (!res?.sucesso) throw new Error(res?.erro || 'Erro ao gerar recibo')
    } catch (err) {
      console.error('Erro ao imprimir venda:', err)
      setErroImpressao(`Erro ao imprimir venda #${orcamento}`)
      setTimeout(() => setErroImpressao(''), 4000)
    } finally {
      setImprimindo(null)
    }
  }

  const filtradas =
    filtroForma === 'todas'
      ? vendas
      : vendas.filter((v) => v.codigo_forma_pagamento1 === filtroForma)

  const { ordenados, coluna, direcao, alternar } = useOrdenacao(filtradas, {
    colunaInicial: 'orcamento',
    direcaoInicial: 'asc',
  })

  const totalVendas = filtradas.reduce((s, v) => s + (v.valor_total || 0), 0)
  const ticketMedio = filtradas.length > 0 ? totalVendas / filtradas.length : 0

  const porForma = filtradas.reduce((acc, v) => {
    const f = v.codigo_forma_pagamento1 || 'Outros'
    acc[f] = (acc[f] || 0) + (v.valor_total || 0)
    return acc
  }, {})

  const porCliente = filtradas.reduce((acc, v) => {
    const cli = pessoaLabel(v.nome_cliente, v.codigo_cliente, 'Consumidor')
    acc[cli] = (acc[cli] || 0) + (v.valor_total || 0)
    return acc
  }, {})

  const maxForma = Math.max(...Object.values(porForma), 1)
  const maxCliente = Math.max(...Object.values(porCliente), 1)
  const formas = [...new Set(vendas.map((v) => v.codigo_forma_pagamento1).filter(Boolean))]

  function exportarExcel() {
    exportarCSV(
      ordenados.map((v) => ({
        'Nº Venda': v.orcamento,
        Data: fmtDate(v.data),
        Cliente: pessoaLabel(v.nome_cliente, v.codigo_cliente),
        'Forma Pagamento': v.codigo_forma_pagamento1 || '—',
        'Total (R$)': (v.valor_total || 0).toFixed(2).replace('.', ','),
      })),
      `vendas_${dataInicio}_${dataFim}`,
    )
  }

  async function gerarRelatorioPDF() {
    const empresa = await buscarEmpresa()
    const colunas = [
      { label: 'Nº Venda' },
      { label: 'Data' },
      { label: 'Cliente' },
      { label: 'Forma' },
      { label: 'Total', num: true },
    ]
    const html = gerarHtmlListaSimples({
      empresa,
      titulo: 'Vendas',
      subtitulo: `Período de ${fmtDate(dataInicio)} a ${fmtDate(dataFim)} — ${filtradas.length} venda(s)`,
      colunas,
      linhas: ordenados,
      montarLinha: (v) =>
        `<tr><td>${v.orcamento}</td><td>${fmtDate(v.data)}</td><td>${pessoaLabel(v.nome_cliente, v.codigo_cliente)}</td><td>${v.codigo_forma_pagamento1 || '—'}</td><td class="num">${fmtMoedaBR(v.valor_total)}</td></tr>`,
      montarTotalGeral: () => `<td colspan="4">TOTAL DO PERÍODO</td><td class="num">${fmtMoedaBR(totalVendas)}</td>`,
    })
    await gerarPdfRelatorio(html, `vendas_${dataInicio}_${dataFim}`)
  }

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%', position: 'relative' }}>
      {erroImpressao && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#C53030', color: '#fff', padding: '9px 22px', borderRadius: 8,
          fontSize: 13, fontWeight: 500, zIndex: 999,
        }}>
          {erroImpressao}
        </div>
      )}
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
              <BotaoGerarRelatorio onExportarExcel={exportarExcel} onGerarPDF={gerarRelatorioPDF} />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    { label: 'Nº Venda', chave: 'orcamento' },
                    { label: 'Data', chave: 'data' },
                    { label: 'Cliente', chave: 'nome_cliente' },
                    { label: 'Forma', chave: 'codigo_forma_pagamento1' },
                    { label: 'Total', chave: 'valor_total' },
                  ].map((h) => (
                    <ThOrdenavel
                      key={h.chave}
                      label={h.label}
                      chave={h.chave}
                      colunaAtual={coluna}
                      direcao={direcao}
                      onOrdenar={alternar}
                      style={{
                        padding: '8px 14px',
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        textAlign: 'left',
                        background: 'var(--gray-50)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    />
                  ))}
                  <th
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
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {ordenados.map((v) => (
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
                      {pessoaLabel(v.nome_cliente, v.codigo_cliente)}
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
                    <td
                      style={{
                        padding: '9px 14px',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <button
                        onClick={() => imprimirVenda(v.orcamento)}
                        disabled={imprimindo === v.orcamento}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: imprimindo === v.orcamento ? 'default' : 'pointer',
                          border: '1px solid var(--border)',
                          color: 'var(--text-secondary)',
                          background: 'transparent',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Printer size={12} /> {imprimindo === v.orcamento ? 'Gerando…' : 'Imprimir'}
                      </button>
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

  const { ordenados, coluna, direcao, alternar } = useOrdenacao(produtos, {
    colunaInicial: 'descricao',
    acessores: {
      valor_total: (p) => (p.estoque_atual || 0) * (p.preco_venda_vista || 0),
    },
  })

  async function gerarRelatorioPDF() {
    const empresa = await buscarEmpresa()
    const emOrdem = [...produtos].sort((a, b) =>
      String(a.descricao || '').localeCompare(String(b.descricao || ''), 'pt-BR', { sensitivity: 'base' }),
    )
    const valorTotalEstoque = produtos.reduce(
      (s, p) => s + (p.estoque_atual || 0) * (p.preco_venda_vista || 0),
      0,
    )
    const colunas = [
      { label: 'Código' },
      { label: 'Descrição' },
      { label: 'UN' },
      { label: 'Preço vista', num: true },
      { label: 'Preço prazo', num: true },
      { label: 'Estoque', num: true },
      { label: 'Valor total', num: true },
    ]
    const html = gerarHtmlListaSimples({
      empresa,
      titulo: 'Produtos',
      subtitulo: `${produtos.length} produto(s), em ordem alfabética`,
      colunas,
      linhas: emOrdem,
      montarLinha: (p) => `<tr>
        <td>${p.codigo}</td>
        <td>${p.descricao}</td>
        <td>${p.unidade || ''}</td>
        <td class="num">${fmtMoedaBR(p.preco_venda_vista)}</td>
        <td class="num">${fmtMoedaBR(p.preco_venda_prazo)}</td>
        <td class="num">${p.estoque_atual || 0}</td>
        <td class="num">${fmtMoedaBR((p.estoque_atual || 0) * (p.preco_venda_vista || 0))}</td>
      </tr>`,
      montarTotalGeral: () => `<td colspan="6">VALOR TOTAL DO ESTOQUE</td><td class="num">${fmtMoedaBR(valorTotalEstoque)}</td>`,
    })
    await gerarPdfRelatorio(html, 'produtos_estoque')
  }

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
              <div style={{ display: 'flex', gap: 8 }}>
                <BotaoGerarRelatorio
                  onExportarExcel={() =>
                    exportarCSV(
                      [...produtos]
                        .sort((a, b) =>
                          String(a.descricao || '').localeCompare(String(b.descricao || ''), 'pt-BR', { sensitivity: 'base' }),
                        )
                        .map((p) => ({
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
                  onGerarPDF={gerarRelatorioPDF}
                />
              </div>
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
                    { label: 'Código', chave: 'codigo' },
                    { label: 'Descrição', chave: 'descricao' },
                    { label: 'UN', chave: 'unidade' },
                    { label: 'Preço vista', chave: 'preco_venda_vista' },
                    { label: 'Preço prazo', chave: 'preco_venda_prazo' },
                    { label: 'Estoque', chave: 'estoque_atual' },
                    { label: 'Valor total', chave: 'valor_total' },
                  ].map((h) => (
                    <ThOrdenavel
                      key={h.chave}
                      label={h.label}
                      chave={h.chave}
                      colunaAtual={coluna}
                      direcao={direcao}
                      onOrdenar={alternar}
                      style={{
                        padding: '8px 10px',
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        textAlign: 'left',
                        background: 'var(--gray-50)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenados.map((p) => {
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
                          {fmtQtd(est, p.unidade)}
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

  const hoje = hojeLocal()
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
    const cli = pessoaLabel(c.nome_cliente, c.codigo_cliente)
    acc[cli] = (acc[cli] || 0) + ((c.valor_docto || 0) - (c.valor_pagamento || 0))
    return acc
  }, {})
  const maxCliente = Math.max(...Object.values(porCliente), 1)

  const situacaoDe = (c) => STATUS_CFG[getSituacaoConta(c)].label

  const { ordenados, coluna, direcao, alternar } = useOrdenacao(contas, {
    acessores: {
      nome_cliente: (c) => c.nome_cliente || c.codigo_cliente || '',
      em_aberto: (c) => (c.valor_docto || 0) - (c.valor_pagamento || 0),
      situacao: (c) => situacaoDe(c),
    },
  })

  function exportarExcel() {
    const porVencimento = [...contas].sort((a, b) =>
      (a.data_vencimento || '').localeCompare(b.data_vencimento || ''),
    )
    const linhas = porVencimento.map((c) => ({
      Documento: c.nro_docto || '—',
      Seq: c.seq_docto || '—',
      Cliente: pessoaLabel(c.nome_cliente, c.codigo_cliente),
      Vencimento: fmtDate(c.data_vencimento),
      'Valor (R$)': (c.valor_docto || 0).toFixed(2).replace('.', ','),
      'Pago (R$)': (c.valor_pagamento || 0).toFixed(2).replace('.', ','),
      'Em Aberto (R$)': ((c.valor_docto || 0) - (c.valor_pagamento || 0)).toFixed(2).replace('.', ','),
      Situação: situacaoDe(c),
    }))
    const totalDocto = contas.reduce((s, c) => s + (c.valor_docto || 0), 0)
    const totalPagoLinhas = contas.reduce((s, c) => s + (c.valor_pagamento || 0), 0)
    linhas.push({
      Documento: '', Seq: '', Cliente: 'TOTAL GERAL', Vencimento: '',
      'Valor (R$)': totalDocto.toFixed(2).replace('.', ','),
      'Pago (R$)': totalPagoLinhas.toFixed(2).replace('.', ','),
      'Em Aberto (R$)': totalAberto.toFixed(2).replace('.', ','),
      Situação: '',
    })
    exportarCSV(linhas, 'contas_receber')
  }

  async function gerarRelatorioPDF() {
    const empresa = await buscarEmpresa()
    const porVencimento = [...contas].sort((a, b) =>
      (a.data_vencimento || '').localeCompare(b.data_vencimento || ''),
    )
    const totalDocto = contas.reduce((s, c) => s + (c.valor_docto || 0), 0)
    const totalPagoLinhas = contas.reduce((s, c) => s + (c.valor_pagamento || 0), 0)
    const colunas = [
      { label: 'Documento' },
      { label: 'Cliente' },
      { label: 'Vencimento' },
      { label: 'Valor', num: true },
      { label: 'Pago', num: true },
      { label: 'Em Aberto', num: true },
      { label: 'Situação' },
    ]
    const html = gerarHtmlListaSimples({
      empresa,
      titulo: 'Contas a Receber',
      subtitulo: `${contas.length} parcela(s), ordenadas por vencimento`,
      colunas,
      linhas: porVencimento,
      montarLinha: (c) => {
        const emAberto = (c.valor_docto || 0) - (c.valor_pagamento || 0)
        return `<tr><td>${c.nro_docto || '—'}</td><td>${pessoaLabel(c.nome_cliente, c.codigo_cliente)}</td><td>${fmtDate(c.data_vencimento)}</td><td class="num">${fmtMoedaBR(c.valor_docto)}</td><td class="num">${fmtMoedaBR(c.valor_pagamento || 0)}</td><td class="num">${fmtMoedaBR(emAberto)}</td><td>${situacaoDe(c)}</td></tr>`
      },
      montarTotalGeral: () =>
        `<td colspan="3">TOTAL GERAL</td><td class="num">${fmtMoedaBR(totalDocto)}</td><td class="num">${fmtMoedaBR(totalPagoLinhas)}</td><td class="num">${fmtMoedaBR(totalAberto)}</td><td></td>`,
    })
    await gerarPdfRelatorio(html, 'contas_receber')
  }

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
              <div style={{ display: 'flex', gap: 8 }}>
                <BotaoGerarRelatorio onExportarExcel={exportarExcel} onGerarPDF={gerarRelatorioPDF} />
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    { label: 'Documento', chave: 'nro_docto' },
                    { label: 'Seq', chave: 'seq_docto' },
                    { label: 'Cliente', chave: 'nome_cliente' },
                    { label: 'Vencimento', chave: 'data_vencimento' },
                    { label: 'Valor', chave: 'valor_docto' },
                    { label: 'Pago', chave: 'valor_pagamento' },
                    { label: 'Em aberto', chave: 'em_aberto' },
                    { label: 'Situação', chave: 'situacao' },
                  ].map((h) => (
                    <ThOrdenavel
                      key={h.chave}
                      label={h.label}
                      chave={h.chave}
                      colunaAtual={coluna}
                      direcao={direcao}
                      onOrdenar={alternar}
                      style={{
                        padding: '8px 14px',
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        textAlign: 'left',
                        background: 'var(--gray-50)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenados.map((c) => {
                  const vencido =
                    c.situacao_docto === 'A' && c.data_vencimento < hoje
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
                        {pessoaLabel(c.nome_cliente, c.codigo_cliente)}
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
                          borderBottom: '1px solid var(--border)',
                          color: c.valor_pagamento > 0 ? 'var(--green-700)' : 'var(--text-muted)',
                        }}
                      >
                        {c.valor_pagamento > 0 ? fmt(c.valor_pagamento) : '-'}
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
                        <StatusBadge status={getSituacaoConta(c)} />
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

  const hoje = hojeLocal()
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

  function situacaoDe(c) {
    if (c.situacao_docto === 'P') return 'Pago'
    if (c.situacao_docto === 'A' && c.data_vencimento < hoje) return 'Vencido'
    return 'Aberto'
  }

  const { ordenados, coluna, direcao, alternar } = useOrdenacao(contas, {
    acessores: {
      nome_fornecedor: (c) => c.nome_fornecedor || '',
      situacao: (c) => situacaoDe(c),
    },
  })

  function exportarExcel() {
    const porVencimento = [...contas].sort((a, b) =>
      (a.data_vencimento || '').localeCompare(b.data_vencimento || ''),
    )
    const linhas = porVencimento.map((c) => ({
      Documento: c.nro_docto || '—',
      Fornecedor: pessoaLabel(c.nome_fornecedor, c.codigo_fornecedor),
      Vencimento: fmtDate(c.data_vencimento),
      'Valor (R$)': (c.valor_docto || 0).toFixed(2).replace('.', ','),
      Situação: situacaoDe(c),
    }))
    const totalGeral = contas.reduce((s, c) => s + (c.valor_docto || 0), 0)
    linhas.push({
      Documento: '', Fornecedor: 'TOTAL GERAL', Vencimento: '',
      'Valor (R$)': totalGeral.toFixed(2).replace('.', ','), Situação: '',
    })
    exportarCSV(linhas, 'contas_pagar')
  }

  async function gerarRelatorioPDF() {
    const empresa = await buscarEmpresa()
    const porVencimento = [...contas].sort((a, b) =>
      (a.data_vencimento || '').localeCompare(b.data_vencimento || ''),
    )
    const totalGeral = contas.reduce((s, c) => s + (c.valor_docto || 0), 0)
    const colunas = [
      { label: 'Documento' },
      { label: 'Fornecedor' },
      { label: 'Vencimento' },
      { label: 'Valor', num: true },
      { label: 'Situação' },
    ]
    const html = gerarHtmlListaSimples({
      empresa,
      titulo: 'Contas a Pagar',
      subtitulo: `${contas.length} conta(s), ordenadas por vencimento`,
      colunas,
      linhas: porVencimento,
      montarLinha: (c) =>
        `<tr><td>${c.nro_docto || '—'}</td><td>${pessoaLabel(c.nome_fornecedor, c.codigo_fornecedor)}</td><td>${fmtDate(c.data_vencimento)}</td><td class="num">${fmtMoedaBR(c.valor_docto)}</td><td>${situacaoDe(c)}</td></tr>`,
      montarTotalGeral: () => `<td colspan="3">TOTAL GERAL</td><td class="num">${fmtMoedaBR(totalGeral)}</td><td></td>`,
    })
    await gerarPdfRelatorio(html, 'contas_pagar')
  }

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
                        {c.nro_docto || pessoaLabel(c.nome_fornecedor, c.codigo_fornecedor)}
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
              <div style={{ display: 'flex', gap: 8 }}>
                <BotaoGerarRelatorio onExportarExcel={exportarExcel} onGerarPDF={gerarRelatorioPDF} />
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    { label: 'Documento', chave: 'nro_docto' },
                    { label: 'Fornecedor', chave: 'nome_fornecedor' },
                    { label: 'Vencimento', chave: 'data_vencimento' },
                    { label: 'Valor', chave: 'valor_docto' },
                    { label: 'Situação', chave: 'situacao' },
                  ].map((h) => (
                    <ThOrdenavel
                      key={h.chave}
                      label={h.label}
                      chave={h.chave}
                      colunaAtual={coluna}
                      direcao={direcao}
                      onOrdenar={alternar}
                      style={{
                        padding: '8px 14px',
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        textAlign: 'left',
                        background: 'var(--gray-50)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenados.map((c) => {
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
                        {pessoaLabel(c.nome_fornecedor, c.codigo_fornecedor)}
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
  const [contasReceberPeriodo, setContasReceberPeriodo] = useState([])
  const [contasPagarPeriodo, setContasPagarPeriodo] = useState([])
  const [contasReceberAbertas, setContasReceberAbertas] = useState([])
  const [contasPagarAbertas, setContasPagarAbertas] = useState([])
  const [loading, setLoading] = useState(true)

  async function carregar() {
    setLoading(true)
    try {
      const [v, crP, cpP, crA, cpA] = await Promise.all([
        window.api.vendas.listar({ dataInicio, dataFim, situacao: 'N' }),
        window.api.contasReceber.listar({ situacao: 'P', dataInicio, dataFim }),
        window.api.contasPagar.listar({ situacao: 'P', dataInicio, dataFim }),
        window.api.contasReceber.listar({ situacao: 'A' }),
        window.api.contasPagar.listar({ situacao: 'A' }),
      ])
      setVendas(v)
      setContasReceberPeriodo(crP)
      setContasPagarPeriodo(cpP)
      setContasReceberAbertas(crA)
      setContasPagarAbertas(cpA)
    } catch (err) {
      console.error('Erro ao carregar financeiro:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const hoje = hojeLocal()

  const totalVendas = vendas.reduce((s, v) => s + (v.valor_total || 0), 0)
  const totalRecebido = contasReceberPeriodo.reduce(
    (s, c) => s + (c.valor_pagamento || 0),
    0,
  )
  const totalPago = contasPagarPeriodo.reduce(
    (s, c) => s + (c.valor_pagamento || 0),
    0,
  )
  // Saldo de caixa real do período: o que entrou menos o que saiu — não
  // comparar vendas/período com um saldo de contas a pagar sem filtro de data.
  const saldo = totalRecebido - totalPago

  const totalAbertoReceber = contasReceberAbertas.reduce(
    (s, c) => s + ((c.valor_docto || 0) - (c.valor_pagamento || 0)),
    0,
  )
  const totalAbertoPagar = contasPagarAbertas.reduce(
    (s, c) => s + ((c.valor_docto || 0) - (c.valor_pagamento || 0)),
    0,
  )
  const vencidasReceber = contasReceberAbertas.filter((c) => c.data_vencimento < hoje)
  const vencidasPagar = contasPagarAbertas.filter((c) => c.data_vencimento < hoje)
  const totalVencidoReceber = vencidasReceber.reduce(
    (s, c) => s + ((c.valor_docto || 0) - (c.valor_pagamento || 0)),
    0,
  )
  const totalVencidoPagar = vencidasPagar.reduce(
    (s, c) => s + ((c.valor_docto || 0) - (c.valor_pagamento || 0)),
    0,
  )

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
  const totalPix = vendas.reduce(
    (s, v) => s + (v.valor_pago_pix || 0),
    0,
  )
  // Venda em convênio zera todos os valor_pago_* (o valor inteiro vira conta
  // a receber) — por isso não aparece em nenhuma forma de pagamento acima,
  // mesmo já estando contado em "Total de vendas". Calculado à parte pra
  // deixar claro que esse dinheiro ainda não entrou no caixa.
  const totalConvenio = vendas
    .filter((v) => v.codigo_forma_pagamento1 === 'Convênio')
    .reduce((s, v) => s + (v.valor_total || 0), 0)

  const resumoLinhas = [
    { item: 'Total de vendas (período)', valor: totalVendas },
    { item: 'Recebido (período)', valor: totalRecebido },
    { item: 'Pago (período)', valor: totalPago },
    { item: 'Saldo de caixa do período', valor: saldo },
    { item: 'Em aberto a receber (hoje)', valor: totalAbertoReceber },
    { item: 'Em aberto a pagar (hoje)', valor: totalAbertoPagar },
    { item: 'Vencido a receber (hoje)', valor: totalVencidoReceber },
    { item: 'Vencido a pagar (hoje)', valor: totalVencidoPagar },
    { item: 'Dinheiro', valor: totalDinheiro },
    { item: 'Cartão Crédito', valor: totalCartaoC },
    { item: 'Cartão Débito', valor: totalCartaoD },
    { item: 'Cheque', valor: totalCheque },
    { item: 'PIX', valor: totalPix },
    { item: 'Convênio vendido no período (já em "Total de vendas" — ainda NÃO em "Recebido", entra só quando o convênio pagar)', valor: totalConvenio },
  ]

  function exportarExcel() {
    exportarCSV(
      resumoLinhas.map((l) => ({ Item: l.item, 'Valor (R$)': l.valor.toFixed(2).replace('.', ',') })),
      `financeiro_${dataInicio}_${dataFim}`,
    )
  }

  async function gerarRelatorioPDF() {
    const empresa = await buscarEmpresa()
    const html = gerarHtmlListaSimples({
      empresa,
      titulo: 'Resumo Financeiro',
      subtitulo: `Período de ${fmtDate(dataInicio)} a ${fmtDate(dataFim)}`,
      colunas: [{ label: 'Item' }, { label: 'Valor', num: true }],
      linhas: resumoLinhas,
      montarLinha: (l) => `<tr><td>${l.item}</td><td class="num">${fmtMoedaBR(l.valor)}</td></tr>`,
    })
    await gerarPdfRelatorio(html, `financeiro_${dataInicio}_${dataFim}`)
  }

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
        <div style={{ flex: 1 }} />
        {!loading && <BotaoGerarRelatorio onExportarExcel={exportarExcel} onGerarPDF={gerarRelatorioPDF} />}
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
              label='Recebido (período)'
              value={fmt(totalRecebido)}
              color='var(--green-500)'
            />
            <CardMetrica
              label='Pago (período)'
              value={fmt(totalPago)}
              color='var(--red-500)'
            />
            <CardMetrica
              label='Saldo de caixa do período'
              value={fmt(saldo)}
              color={saldo >= 0 ? 'var(--green-500)' : 'var(--red-500)'}
              sub='recebido − pago, no período'
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <CardMetrica
              label='Vencido a receber (hoje)'
              value={fmt(totalVencidoReceber)}
              sub={`${vencidasReceber.length} parcela(s)`}
              color='var(--red-500)'
            />
            <CardMetrica
              label='Vencido a pagar (hoje)'
              value={fmt(totalVencidoPagar)}
              sub={`${vencidasPagar.length} conta(s)`}
              color='var(--red-500)'
            />
            <CardMetrica
              label='Em aberto a receber'
              value={fmt(totalAbertoReceber)}
              sub='todas as datas'
              color='var(--blue-700)'
            />
            <CardMetrica
              label='Em aberto a pagar'
              value={fmt(totalAbertoPagar)}
              sub='todas as datas'
              color='var(--text-secondary)'
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
                Vendas vs Caixa (período selecionado)
              </div>
              {[
                {
                  label: 'Vendas (faturamento)',
                  value: totalVendas,
                  color: 'var(--blue-400)',
                },
                {
                  label: 'Recebido (caixa)',
                  value: totalRecebido,
                  color: 'var(--green-500)',
                },
                {
                  label: 'Pago (caixa)',
                  value: totalPago,
                  color: 'var(--red-400)',
                },
              ].map((item) => (
                <BarraHorizontal
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  max={Math.max(totalVendas, totalRecebido, totalPago, 1)}
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
                {
                  label: 'PIX',
                  value: totalPix,
                  color: '#0D9488',
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
              {totalDinheiro + totalCartaoC + totalCartaoD + totalCheque + totalPix + totalConvenio === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  Nenhuma venda no período.
                </div>
              )}
              {totalConvenio > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 10,
                    borderTop: '1px dashed var(--border)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#7C3AED' }}>
                      Convênio (vendido no período)
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#7C3AED' }}>
                      {fmt(totalConvenio)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Já contado em "Total de vendas" acima, mas esse dinheiro ainda não entrou —
                    só soma em "Recebido" quando a baixa do convênio for feita.
                  </div>
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

  function exportarExcel() {
    exportarCSV(itens.map(i => ({
      Código: i.codigo, Descrição: i.descricao,
      Quantidade: String(i.quantidade || 0).replace('.', ','),
      'Valor Venda (R$)': (i.valor_venda || 0).toFixed(2).replace('.', ','),
    })), `itens_vendidos_${dataInicio}_${dataFim}`)
  }

  async function gerarRelatorioPDF() {
    const empresa = await buscarEmpresa()
    const colunas = [
      { label: 'Código' },
      { label: 'Descrição' },
      { label: 'Quantidade', num: true },
      { label: 'Valor Venda', num: true },
    ]
    const html = gerarHtmlListaSimples({
      empresa,
      titulo: 'Itens Vendidos',
      subtitulo: `Período de ${fmtDate(dataInicio)} a ${fmtDate(dataFim)} — ${itens.length} produto(s)`,
      colunas,
      linhas: itens,
      montarLinha: (it) =>
        `<tr><td>${it.codigo}</td><td>${it.descricao}</td><td class="num">${(it.quantidade || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</td><td class="num">${fmtMoedaBR(it.valor_venda)}</td></tr>`,
      montarTotalGeral: () =>
        `<td>TOTAL — ${itens.length} produtos</td><td></td><td class="num">${totalQtd.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</td><td class="num">${fmtMoedaBR(totalVal)}</td>`,
    })
    await gerarPdfRelatorio(html, `itens_vendidos_${dataInicio}_${dataFim}`)
  }

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
        <BotaoGerarRelatorio onExportarExcel={exportarExcel} onGerarPDF={gerarRelatorioPDF} />
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

  function exportarExcel() {
    exportarCSV(itens.map(i => ({
      Código: i.codigo, 'Nome/Descrição': i.descricao,
      'Qtde Total': String(i.qtde_total || 0).replace('.', ','),
      'Valor Total (R$)': (i.valor_total || 0).toFixed(2).replace('.', ','),
    })), `entradas_mercadoria_${dataInicio}_${dataFim}`)
  }

  async function gerarRelatorioPDF() {
    const empresa = await buscarEmpresa()
    const colunas = [
      { label: 'Código' },
      { label: 'Nome/Descrição' },
      { label: 'Qtde Total', num: true },
      { label: 'Valor Total', num: true },
    ]
    const html = gerarHtmlListaSimples({
      empresa,
      titulo: 'Entradas de Mercadoria',
      subtitulo: `Período de ${fmtDate(dataInicio)} a ${fmtDate(dataFim)} — ${itens.length} produto(s)`,
      colunas,
      linhas: itens,
      montarLinha: (it) =>
        `<tr><td>${it.codigo}</td><td>${it.descricao}</td><td class="num">${(it.qtde_total || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</td><td class="num">${fmtMoedaBR(it.valor_total)}</td></tr>`,
      montarTotalGeral: () =>
        `<td>TOTAL — ${itens.length} produtos</td><td></td><td class="num">${totalQtd.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</td><td class="num">${fmtMoedaBR(totalVal)}</td>`,
    })
    await gerarPdfRelatorio(html, `entradas_mercadoria_${dataInicio}_${dataFim}`)
  }

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
        <BotaoGerarRelatorio onExportarExcel={exportarExcel} onGerarPDF={gerarRelatorioPDF} />
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

// ── FECHAMENTO DE CAIXA ────────────────────────────────────────────────────────
const fmtHora = (h) => h || '--:--'

function RelFechamentoCaixa() {
  const { ini, fim } = mesAtual()
  const [dataInicio, setDataInicio] = useState(ini)
  const [dataFim, setDataFim] = useState(fim)
  const [sessoes, setSessoes] = useState([])
  const [loading, setLoading] = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      const data = await window.api.caixa.historico({ dataInicio, dataFim })
      setSessoes(data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  const fechadas = sessoes.filter((s) => s.situacao === 'F')
  const totalVendas = fechadas.reduce((s, c) => s + (c.qtde_vendas || 0), 0)
  // "Total" é o que realmente entrou no caixa — não o faturamento da sessão
  // (valor_total), que inclui vendas fiado/convênio ainda não recebidas.
  const totalGeral = fechadas.reduce((s, c) => s + totalRecebidoSessao(c), 0)
  const totalDinheiro = fechadas.reduce((s, c) => s + (c.valor_dinheiro || 0), 0)
  const totalCartaoC = fechadas.reduce((s, c) => s + (c.valor_cartao_credito || 0), 0)
  const totalCartaoD = fechadas.reduce((s, c) => s + (c.valor_cartao_debito || 0), 0)
  const totalCheque = fechadas.reduce((s, c) => s + (c.valor_cheque || 0), 0)
  const totalPix = fechadas.reduce((s, c) => s + (c.valor_pix || 0), 0)
  const totalConvenio = fechadas.reduce((s, c) => s + (c.valor_convenio || 0), 0)

  const { ordenados, coluna, direcao, alternar } = useOrdenacao(sessoes, {
    colunaInicial: 'data_abertura',
    acessores: {
      data_abertura: (s) => `${s.data_abertura || ''} ${s.hora_abertura || ''}`,
      data_fechamento: (s) => `${s.data_fechamento || ''} ${s.hora_fechamento || ''}`,
      situacao: (s) => (s.situacao === 'F' ? 'Fechado' : 'Aberto'),
      valor_total: (s) => totalRecebidoSessao(s),
    },
  })

  async function gerarRelatorioPDF() {
    const empresa = await buscarEmpresa()
    const colunas = [
      { label: 'Abertura' },
      { label: 'Fechamento' },
      { label: 'Situação' },
      { label: 'Vendas', num: true },
      { label: 'Dinheiro', num: true },
      { label: 'Cartão Créd.', num: true },
      { label: 'Cartão Déb.', num: true },
      { label: 'Cheque', num: true },
      { label: 'PIX', num: true },
      { label: 'Convênio', num: true },
      { label: 'Total', num: true },
    ]
    const html = gerarHtmlListaSimples({
      empresa,
      titulo: 'Fechamento de Caixa',
      subtitulo: `Período de ${fmtDate(dataInicio)} a ${fmtDate(dataFim)} — ${fechadas.length} fechamento(s)`,
      colunas,
      linhas: sessoes,
      montarLinha: (s) => `<tr>
        <td>${fmtDate(s.data_abertura)} ${fmtHora(s.hora_abertura)}</td>
        <td>${s.situacao === 'F' ? `${fmtDate(s.data_fechamento)} ${fmtHora(s.hora_fechamento)}` : '—'}</td>
        <td>${s.situacao === 'F' ? 'Fechado' : 'Aberto'}</td>
        <td class="num">${s.qtde_vendas || 0}</td>
        <td class="num">${fmtMoedaBR(s.valor_dinheiro)}</td>
        <td class="num">${fmtMoedaBR(s.valor_cartao_credito)}</td>
        <td class="num">${fmtMoedaBR(s.valor_cartao_debito)}</td>
        <td class="num">${fmtMoedaBR(s.valor_cheque)}</td>
        <td class="num">${fmtMoedaBR(s.valor_pix)}</td>
        <td class="num">${fmtMoedaBR(s.valor_convenio)}</td>
        <td class="num">${fmtMoedaBR(totalRecebidoSessao(s))}</td>
      </tr>`,
      montarTotalGeral: () => `
        <td colspan="3">TOTAL — ${fechadas.length} fechamento(s)</td>
        <td class="num">${totalVendas}</td>
        <td class="num">${fmtMoedaBR(totalDinheiro)}</td>
        <td class="num">${fmtMoedaBR(totalCartaoC)}</td>
        <td class="num">${fmtMoedaBR(totalCartaoD)}</td>
        <td class="num">${fmtMoedaBR(totalCheque)}</td>
        <td class="num">${fmtMoedaBR(totalPix)}</td>
        <td class="num">${fmtMoedaBR(totalConvenio)}</td>
        <td class="num">${fmtMoedaBR(totalGeral)}</td>
      `,
    })
    await gerarPdfRelatorio(html, `fechamento_caixa_${dataInicio}_${dataFim}`)
  }

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
        <BotaoGerarRelatorio
          onExportarExcel={() => exportarCSV(sessoes.map(s => ({
            'Abertura (data)': fmtDate(s.data_abertura), 'Abertura (hora)': fmtHora(s.hora_abertura), 'Usuário abertura': s.usuario_abertura || '—',
            'Fechamento (data)': fmtDate(s.data_fechamento), 'Fechamento (hora)': fmtHora(s.hora_fechamento), 'Usuário fechamento': s.usuario_fechamento || '—',
            Situação: s.situacao === 'F' ? 'Fechado' : 'Aberto',
            'Qtde vendas': s.qtde_vendas || 0,
            'Dinheiro (R$)': (s.valor_dinheiro || 0).toFixed(2).replace('.', ','),
            'Cartão Créd. (R$)': (s.valor_cartao_credito || 0).toFixed(2).replace('.', ','),
            'Cartão Déb. (R$)': (s.valor_cartao_debito || 0).toFixed(2).replace('.', ','),
            'Cheque (R$)': (s.valor_cheque || 0).toFixed(2).replace('.', ','),
            'PIX (R$)': (s.valor_pix || 0).toFixed(2).replace('.', ','),
            'Convênio (R$)': (s.valor_convenio || 0).toFixed(2).replace('.', ','),
            'Total (R$)': totalRecebidoSessao(s).toFixed(2).replace('.', ','),
          })), `fechamento_caixa_${dataInicio}_${dataFim}`)}
          onGerarPDF={gerarRelatorioPDF}
        />
      </div>

      {!loading && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <CardMetrica label='Fechamentos no período' value={fechadas.length} />
          <CardMetrica label='Vendas no período' value={totalVendas} />
          <CardMetrica label='Total geral' value={fmt(totalGeral)} color='var(--blue-700)' />
        </div>
      )}

      {loading ? <Carregando /> : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '2px solid var(--border)' }}>
                {[
                  { label: 'ABERTURA', chave: 'data_abertura', align: 'left' },
                  { label: 'POR', chave: 'usuario_abertura', align: 'left' },
                  { label: 'FECHAMENTO', chave: 'data_fechamento', align: 'left' },
                  { label: 'POR', chave: 'usuario_fechamento', align: 'left' },
                  { label: 'SITUAÇÃO', chave: 'situacao', align: 'left' },
                  { label: 'VENDAS', chave: 'qtde_vendas', align: 'right' },
                  { label: 'DINHEIRO', chave: 'valor_dinheiro', align: 'right' },
                  { label: 'CARTÃO CRÉD.', chave: 'valor_cartao_credito', align: 'right' },
                  { label: 'CARTÃO DÉB.', chave: 'valor_cartao_debito', align: 'right' },
                  { label: 'CHEQUE', chave: 'valor_cheque', align: 'right' },
                  { label: 'PIX', chave: 'valor_pix', align: 'right' },
                  { label: 'CONVÊNIO', chave: 'valor_convenio', align: 'right' },
                  { label: 'TOTAL', chave: 'valor_total', align: 'right' },
                ].map((h) => (
                  <ThOrdenavel
                    key={h.chave}
                    label={h.label}
                    chave={h.chave}
                    colunaAtual={coluna}
                    direcao={direcao}
                    onOrdenar={alternar}
                    style={{ padding: '8px 10px', textAlign: h.align, fontWeight: 600, color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {ordenados.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{fmtDate(s.data_abertura)} {fmtHora(s.hora_abertura)}</td>
                  <td style={{ padding: '7px 10px' }}>{s.usuario_abertura || '—'}</td>
                  <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{s.situacao === 'F' ? `${fmtDate(s.data_fechamento)} ${fmtHora(s.hora_fechamento)}` : '—'}</td>
                  <td style={{ padding: '7px 10px' }}>{s.usuario_fechamento || '—'}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                      background: s.situacao === 'F' ? 'var(--gray-50)' : '#EAF6EE',
                      color: s.situacao === 'F' ? 'var(--text-muted)' : '#22863A',
                    }}>
                      {s.situacao === 'F' ? 'Fechado' : 'Aberto'}
                    </span>
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{s.qtde_vendas || 0}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmt(s.valor_dinheiro)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmt(s.valor_cartao_credito)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmt(s.valor_cartao_debito)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmt(s.valor_cheque)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmt(s.valor_pix)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: '#7C3AED' }}>{fmt(s.valor_convenio)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(totalRecebidoSessao(s))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--gray-50)', borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                <td colSpan={5} style={{ padding: '8px 10px' }}>TOTAL — {fechadas.length} fechamento(s)</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{totalVendas}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(totalDinheiro)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(totalCartaoC)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(totalCartaoD)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(totalCheque)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(totalPix)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#7C3AED' }}>{fmt(totalConvenio)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--blue-700)' }}>{fmt(totalGeral)}</td>
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

  function exportarExcel() {
    exportarCSV(filtrados.map(i => ({
      Código: i.codigo, Descrição: i.descricao, Unidade: i.unidade,
      'Estoque Atual': String(i.estoque_atual || 0).replace('.', ','),
      'Estoque Mínimo': String(i.estoque_minimo || 0).replace('.', ','),
      'Custo Unit. (R$)': (i.preco_custo_atual || 0).toFixed(4).replace('.', ','),
      'Preço Vista (R$)': (i.preco_venda_vista || 0).toFixed(4).replace('.', ','),
      'Total Custo (R$)': (i.valor_custo || 0).toFixed(2).replace('.', ','),
      'Total Vista (R$)': (i.valor_vista || 0).toFixed(2).replace('.', ','),
    })), `inventario_${new Date().toISOString().slice(0,10)}`)
  }

  async function gerarRelatorioPDF() {
    const empresa = await buscarEmpresa()
    const colunas = [
      { label: 'Código' },
      { label: 'Descrição' },
      { label: 'Un' },
      { label: 'Estoque', num: true },
      { label: 'Mín', num: true },
      { label: 'Custo Unit.', num: true },
      { label: 'Preço Vista', num: true },
      { label: 'Total Custo', num: true },
      { label: 'Total Vista', num: true },
    ]
    const html = gerarHtmlListaSimples({
      empresa,
      titulo: 'Inventário de Produtos',
      subtitulo: `${filtrados.length} produto(s) — gerado em ${fmtDate(new Date().toISOString().slice(0, 10))}`,
      colunas,
      linhas: filtrados,
      montarLinha: (it) => `<tr>
        <td>${it.codigo}</td><td>${it.descricao}</td><td>${it.unidade}</td>
        <td class="num">${(it.estoque_atual || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</td>
        <td class="num">${it.estoque_minimo || 0}</td>
        <td class="num">${(it.preco_custo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
        <td class="num">${(it.preco_venda_vista || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
        <td class="num">${fmtMoedaBR(it.valor_custo)}</td>
        <td class="num">${fmtMoedaBR(it.valor_vista)}</td>
      </tr>`,
      montarTotalGeral: () =>
        `<td colspan="7">TOTAL GERAL</td><td class="num">${fmtMoedaBR(totalCusto)}</td><td class="num">${fmtMoedaBR(totalVista)}</td>`,
    })
    await gerarPdfRelatorio(html, `inventario_${new Date().toISOString().slice(0, 10)}`)
  }

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <input placeholder='Buscar produto…' value={busca} onChange={e => setBusca(e.target.value)}
          style={{ height: 32, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 13, width: 240 }} />
        <BotaoGerarRelatorio onExportarExcel={exportarExcel} onGerarPDF={gerarRelatorioPDF} />
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

// Junta em uma linha só sequências consecutivas do mesmo dia/forma/pessoa —
// é o caso de uma baixa em lote no Contas a Receber (várias parcelas do mesmo
// cliente, na mesma hora), que senão aparece 1 linha por parcela e polui o
// extrato. O detalhe fica disponível expandindo a linha; a soma 1x1 já existe
// no relatório de Contas a Receber, não precisa duplicar aqui.
function agruparLinhasExtrato(linhas) {
  const grupos = []
  for (const l of linhas) {
    const ultimo = grupos[grupos.length - 1]
    const mesmaChave = ultimo && ultimo.data === l.data && ultimo.historico === l.historico && ultimo.observacao === l.observacao
    if (mesmaChave) {
      ultimo.debito += l.debito || 0
      ultimo.credito += l.credito || 0
      ultimo.saldo = l.saldo
      ultimo.itens.push(l)
    } else {
      grupos.push({ ...l, itens: [l] })
    }
  }
  return grupos
}

// ── EXTRATO ───────────────────────────────────────────────────────────────────
function RelExtrato() {
  const { ini, fim } = mesAtual()
  const [dataInicio, setDataInicio] = useState(ini)
  const [dataFim, setDataFim] = useState(fim)
  const [dados, setDados] = useState({ saldoInicial: 0, movimentos: [] })
  const [loading, setLoading] = useState(false)
  const [expandidos, setExpandidos] = useState(new Set())

  async function carregar() {
    setLoading(true)
    try {
      const data = await window.api.relatorios.extrato({ dataInicio, dataFim })
      setDados(data || { saldoInicial: 0, movimentos: [] })
      setExpandidos(new Set())
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  // Calcula saldo corrido
  let saldo = dados.saldoInicial || 0
  const linhas = (dados.movimentos || []).map(m => {
    saldo += (m.credito || 0) - (m.debito || 0)
    return { ...m, saldo }
  })
  const linhasAgrupadas = agruparLinhasExtrato(linhas)

  function toggleExpandido(i) {
    setExpandidos(prev => {
      const novo = new Set(prev)
      novo.has(i) ? novo.delete(i) : novo.add(i)
      return novo
    })
  }

  const totalDeb = (dados.movimentos || []).reduce((s, m) => s + (m.debito || 0), 0)
  const totalCred = (dados.movimentos || []).reduce((s, m) => s + (m.credito || 0), 0)
  const saldoFinal = (dados.saldoInicial || 0) + totalCred - totalDeb

  function exportarExcel() {
    exportarCSV([
      { Data: '', Histórico: 'SALDO ANTERIOR', Débito: '', Crédito: '', Saldo: dados.saldoInicial.toFixed(2).replace('.', ','), Documento: '', Observação: '' },
      ...linhasAgrupadas.map(m => ({
        Data: fmtDate(m.data), Histórico: m.historico,
        'Débito (R$)': m.debito ? (m.debito).toFixed(2).replace('.', ',') : '',
        'Crédito (R$)': m.credito ? (m.credito).toFixed(2).replace('.', ',') : '',
        'Saldo (R$)': m.saldo.toFixed(2).replace('.', ','),
        Documento: m.documento || '', Observação: m.observacao || '',
      })),
      { Data: '', Histórico: 'SALDO FINAL', Débito: totalDeb.toFixed(2).replace('.', ','), Crédito: totalCred.toFixed(2).replace('.', ','), Saldo: saldoFinal.toFixed(2).replace('.', ','), Documento: '', Observação: '' },
    ], `extrato_${dataInicio}_${dataFim}`)
  }

  async function gerarRelatorioPDF() {
    const empresa = await buscarEmpresa()
    const colunas = [
      { label: 'Data' },
      { label: 'Histórico' },
      { label: 'Débito', num: true },
      { label: 'Crédito', num: true },
      { label: 'Saldo', num: true },
      { label: 'Documento' },
      { label: 'Observação' },
    ]
    const linhasRelatorio = [
      { tipo: 'marco', rotulo: 'SALDO ANTERIOR', saldo: dados.saldoInicial },
      ...linhasAgrupadas.map((m) => ({ tipo: 'movimento', ...m })),
      { tipo: 'marco', rotulo: 'TOTAL / SALDO FINAL', saldo: saldoFinal, debito: totalDeb, credito: totalCred },
    ]
    const montarLinha = (l) =>
      l.tipo === 'marco'
        ? `<tr><td colspan="2"><b>${l.rotulo}</b></td><td class="num"><b>${l.debito != null ? fmtMoedaBR(l.debito) : ''}</b></td><td class="num"><b>${l.credito != null ? fmtMoedaBR(l.credito) : ''}</b></td><td class="num"><b>${fmtMoedaBR(l.saldo)}</b></td><td colspan="2"></td></tr>`
        : `<tr><td>${fmtDate(l.data)}</td><td>${l.historico}</td><td class="num">${l.debito ? fmtMoedaBR(l.debito) : '—'}</td><td class="num">${l.credito ? fmtMoedaBR(l.credito) : '—'}</td><td class="num">${fmtMoedaBR(l.saldo)}</td><td>${l.documento || ''}</td><td>${l.observacao || ''}</td></tr>`
    const html = gerarHtmlListaSimples({
      empresa,
      titulo: 'Extrato',
      subtitulo: `Período de ${fmtDate(dataInicio)} a ${fmtDate(dataFim)}`,
      colunas,
      linhas: linhasRelatorio,
      montarLinha,
    })
    await gerarPdfRelatorio(html, `extrato_${dataInicio}_${dataFim}`)
  }

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
        <BotaoGerarRelatorio onExportarExcel={exportarExcel} onGerarPDF={gerarRelatorioPDF} />
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
              {linhasAgrupadas.map((m, i) => {
                const agrupada = m.itens.length > 1
                const aberta = expandidos.has(i)
                return (
                  <Fragment key={i}>
                    <tr style={{ borderBottom: '1px solid var(--border)', cursor: agrupada ? 'pointer' : 'default' }}
                      onClick={() => agrupada && toggleExpandido(i)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>{fmtDate(m.data)}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontWeight: 600, fontSize: 11 }}>{m.historico}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: m.debito ? '#DC2626' : 'var(--text-muted)' }}>{m.debito ? fmt(m.debito) : '—'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: m.credito ? '#16A34A' : 'var(--text-muted)' }}>{m.credito ? fmt(m.credito) : '—'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(m.saldo)}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                        {agrupada ? `${aberta ? '▾' : '▸'} ${m.itens.length} títulos` : m.documento}
                      </td>
                      <td style={{ padding: '6px 10px', color: 'var(--text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.observacao}</td>
                    </tr>
                    {agrupada && aberta && m.itens.map((it, j) => (
                      <tr key={j} style={{ borderBottom: '1px solid var(--border)', background: 'var(--gray-50)' }}>
                        <td />
                        <td />
                        <td style={{ padding: '4px 10px', textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>{it.debito ? fmt(it.debito) : '—'}</td>
                        <td style={{ padding: '4px 10px', textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>{it.credito ? fmt(it.credito) : '—'}</td>
                        <td />
                        <td style={{ padding: '4px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{it.documento}</td>
                        <td />
                      </tr>
                    ))}
                  </Fragment>
                )
              })}
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

// ── PLANO DE CONTAS ──────────────────────────────────────────────────────────
function RelPlanoContas() {
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    window.api.planoContas.listar({ situacao: 'A' }).then(setContas).finally(() => setLoading(false))
  }, [])

  const filtradas = busca
    ? contas.filter((c) => c.descricao.toLowerCase().includes(busca.toLowerCase()) || c.codigo.includes(busca))
    : contas
  const totalContas = filtradas.filter((c) => c.nivel >= 4).length

  function exportarExcel() {
    exportarCSV(
      filtradas.map((c) => ({
        Código: c.codigo,
        Número: c.numero_conta,
        Nível: c.nivel,
        Descrição: c.descricao,
        Histórico: c.historico_nome || '',
      })),
      `plano_contas_${new Date().toISOString().slice(0, 10)}`,
    )
  }

  async function gerarRelatorioPDF() {
    const empresa = await buscarEmpresa()
    const html = gerarHtmlListaSimples({
      empresa,
      titulo: 'Plano de Contas - Despesas Empresariais',
      subtitulo: `${totalContas} conta(s)`,
      colunas: [
        { label: 'Código' },
        { label: 'Número' },
        { label: 'Nível', num: true },
        { label: 'Descrição' },
        { label: 'Histórico' },
      ],
      linhas: filtradas,
      montarLinha: (c) => `<tr${c.nivel < 4 ? ' style="font-weight:700;background:#f3f4f6"' : ''}>
        <td>${c.codigo}</td>
        <td>${c.numero_conta}</td>
        <td class="num">${c.nivel}</td>
        <td>${c.descricao}</td>
        <td>${c.historico_nome || ''}</td>
      </tr>`,
    })
    await gerarPdfRelatorio(html, `plano_contas_${new Date().toISOString().slice(0, 10)}`)
  }

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <input
          placeholder='Buscar conta…'
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ height: 32, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 13, width: 240 }}
        />
        {!loading && <BotaoGerarRelatorio onExportarExcel={exportarExcel} onGerarPDF={gerarRelatorioPDF} />}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{totalContas} conta(s)</span>
      </div>
      {loading ? (
        <Carregando />
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '2px solid var(--border)' }}>
                {['CÓDIGO', 'NÚMERO', 'NÍVEL', 'DESCRIÇÃO', 'HISTÓRICO'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: h === 'NÍVEL' ? 'right' : 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((c) => (
                <tr
                  key={c.codigo}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: c.nivel < 4 ? 'var(--gray-50)' : 'transparent',
                    fontWeight: c.nivel < 4 ? 600 : 400,
                  }}
                >
                  <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{c.codigo}</td>
                  <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>{c.numero_conta}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right' }}>{c.nivel}</td>
                  <td style={{ padding: '6px 10px', paddingLeft: 10 + (c.nivel - 2) * 18 }}>{c.descricao}</td>
                  <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{c.historico_nome || ''}</td>
                </tr>
              ))}
            </tbody>
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
      const hoje = hojeLocal()
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
          Descrição: pessoaLabel(v.nome_cliente, v.codigo_cliente, 'Consumidor'),
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
            Descrição: pessoaLabel(c.nome_cliente, c.codigo_cliente),
            'Forma Pagamento': '—',
            'Valor (R$)': (c.valor_docto || 0).toFixed(2).replace('.', ','),
            Situação: c.situacao_docto === 'P' ? 'Baixado' : c.data_vencimento < hoje ? 'Vencido' : 'Aberto',
          }))
        ).concat(
          contasPag.map((c) => ({
            Seção: 'A Pagar',
            Referência: c.nro_docto || '—',
            Data: fmtDate(c.data_vencimento),
            Descrição: pessoaLabel(c.nome_fornecedor, c.codigo_fornecedor),
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
      case 'rel-caixa':
        return <RelFechamentoCaixa />
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
      case 'rel-plano-contas':
        return <RelPlanoContas />
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
