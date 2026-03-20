import { useState, useMemo } from 'react'
import { BarChart2, TrendingUp, TrendingDown, DollarSign, Package, FileText, Filter, Download } from 'lucide-react'
import { produtos } from '../data/mock'
import { contasReceber } from '../data/mock'

const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-'

const vendasMock = [
  { id: '00001488', data: '2024-01-05', cliente: 'Construtora Viver Ltda', vendedor: 'Geral', forma: 'Convênio', total: 890.00, itens: 3 },
  { id: '00001489', data: '2024-01-08', cliente: 'João Carlos Ferreira', vendedor: 'Geral', forma: 'Dinheiro', total: 187.00, itens: 2 },
  { id: '00001490', data: '2024-01-10', cliente: 'Consumidor a vista', vendedor: 'Geral', forma: 'Dinheiro', total: 56.80, itens: 1 },
  { id: '00001491', data: '2024-01-12', cliente: 'Obras Rápidas ME', vendedor: 'Geral', forma: 'Cartão', total: 419.50, itens: 4 },
  { id: '00001492', data: '2024-01-15', cliente: 'Arnaldo Leonidas', vendedor: 'Geral', forma: 'Convênio', total: 129.30, itens: 3 },
  { id: '00001493', data: '2024-01-18', cliente: 'Maria Aparecida Santos', vendedor: 'Geral', forma: 'Dinheiro', total: 320.00, itens: 2 },
  { id: '00001494', data: '2024-01-20', cliente: 'Construtora Viver Ltda', vendedor: 'Geral', forma: 'Convênio', total: 1250.00, itens: 6 },
  { id: '00001495', data: '2024-01-22', cliente: 'João Carlos Ferreira', vendedor: 'Geral', forma: 'Cartão', total: 87.50, itens: 1 },
  { id: '00001496', data: '2024-01-25', cliente: 'Consumidor a vista', vendedor: 'Geral', forma: 'Dinheiro', total: 44.90, itens: 2 },
  { id: '00001497', data: '2024-01-28', cliente: 'Obras Rápidas ME', vendedor: 'Geral', forma: 'Convênio', total: 760.00, itens: 4 },
]

const abas = [
  { id: 'rel-vendas',         label: 'Vendas',            icon: BarChart2 },
  { id: 'rel-produtos',       label: 'Produtos',          icon: Package },
  { id: 'rel-contas-receber', label: 'Contas a receber',  icon: TrendingUp },
  { id: 'rel-contas-pagar',   label: 'Contas a pagar',    icon: TrendingDown },
  { id: 'rel-financeiro',     label: 'Financeiro',        icon: DollarSign },
]

function CardMetrica({ label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function BarraHorizontal({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmt(value)}</span>
      </div>
      <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color || 'var(--blue-400)', borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

function RelVendas() {
  const [dataInicio, setDataInicio] = useState('2024-01-01')
  const [dataFim, setDataFim] = useState('2024-01-31')
  const [filtroForma, setFiltroForma] = useState('todas')

  const filtradas = vendasMock.filter(v => {
    const matchForma = filtroForma === 'todas' || v.forma === filtroForma
    return matchForma
  })

  const totalVendas = filtradas.reduce((s, v) => s + v.total, 0)
  const ticketMedio = filtradas.length > 0 ? totalVendas / filtradas.length : 0

  const porForma = filtradas.reduce((acc, v) => {
    acc[v.forma] = (acc[v.forma] || 0) + v.total
    return acc
  }, {})

  const porCliente = filtradas.reduce((acc, v) => {
    acc[v.cliente] = (acc[v.cliente] || 0) + v.total
    return acc
  }, {})

  const maxCliente = Math.max(...Object.values(porCliente))
  const maxForma = Math.max(...Object.values(porForma))

  const cores = { Dinheiro: 'var(--green-500)', Cartão: 'var(--blue-400)', Convênio: 'var(--amber-500)', Cheque: 'var(--gray-500)' }

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Data inicial</label>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={{ height: 34, padding: '0 10px' }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Data final</label>
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ height: 34, padding: '0 10px' }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Forma de pagamento</label>
          <select value={filtroForma} onChange={e => setFiltroForma(e.target.value)} style={{ height: 34, padding: '0 10px', borderRadius: 'var(--radius-md)' }}>
            <option value="todas">Todas</option>
            <option>Dinheiro</option>
            <option>Cartão</option>
            <option>Convênio</option>
            <option>Cheque</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <CardMetrica label="Total vendido" value={fmt(totalVendas)} color="var(--blue-700)" />
        <CardMetrica label="Qtde de vendas" value={filtradas.length} sub="no período" />
        <CardMetrica label="Ticket médio" value={fmt(ticketMedio)} color="var(--green-500)" />
        <CardMetrica label="Total de itens" value={filtradas.reduce((s, v) => s + v.itens, 0)} sub="produtos vendidos" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Vendas por forma de pagamento</div>
          {Object.entries(porForma).map(([forma, valor]) => (
            <BarraHorizontal key={forma} label={forma} value={valor} max={maxForma} color={cores[forma]} />
          ))}
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Vendas por cliente</div>
          {Object.entries(porCliente).sort((a, b) => b[1] - a[1]).map(([cliente, valor]) => (
            <BarraHorizontal key={cliente} label={cliente} value={valor} max={maxCliente} color="var(--blue-400)" />
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Listagem de vendas</div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-secondary)' }}>
            <Download size={12} /> Exportar
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Nº Venda', 'Data', 'Cliente', 'Forma', 'Itens', 'Total'].map(h => (
              <th key={h} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtradas.map(v => (
              <tr key={v.id} style={{ transition: 'background 0.08s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '9px 14px', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{v.id}</td>
                <td style={{ padding: '9px 14px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{fmtDate(v.data)}</td>
                <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{v.cliente}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{v.forma}</span>
                </td>
                <td style={{ padding: '9px 14px', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>{v.itens}</td>
                <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 600, color: 'var(--blue-700)', borderBottom: '1px solid var(--border)' }}>{fmt(v.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--gray-50)', borderTop: '1px solid var(--border)' }}>Total do período</td>
              <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, color: 'var(--blue-700)', background: 'var(--gray-50)', borderTop: '1px solid var(--border)' }}>{fmt(totalVendas)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function RelProdutos() {
  const total = produtos.reduce((s, p) => s + p.estoque, 0)
  const semEstoque = produtos.filter(p => p.estoque === 0).length
  const baixo = produtos.filter(p => p.estoque > 0 && p.estoque <= 5).length
  const maxEstoque = Math.max(...produtos.map(p => p.estoque))

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <CardMetrica label="Total de produtos" value={produtos.length} />
        <CardMetrica label="Total em estoque" value={total} sub="unidades" color="var(--blue-700)" />
        <CardMetrica label="Sem estoque" value={semEstoque} color="var(--red-500)" />
        <CardMetrica label="Estoque baixo" value={baixo} color="var(--amber-500)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Estoque por produto</div>
          {produtos.filter(p => p.estoque > 0).sort((a, b) => b.estoque - a.estoque).map(p => (
            <BarraHorizontal key={p.id} label={p.descricao} value={p.estoque} max={maxEstoque} color={p.estoque <= 5 ? 'var(--amber-400)' : 'var(--blue-400)'} />
          ))}
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Valor do estoque por produto</div>
          {produtos.filter(p => p.estoque > 0).sort((a, b) => (b.estoque * b.preco_vista) - (a.estoque * a.preco_vista)).map(p => (
            <BarraHorizontal key={p.id} label={p.descricao} value={p.estoque * p.preco_vista} max={produtos.reduce((max, x) => Math.max(max, x.estoque * x.preco_vista), 0)} color="var(--green-500)" />
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Listagem de produtos</div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-secondary)' }}>
            <Download size={12} /> Exportar
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup><col style={{ width: 92 }} /><col /><col style={{ width: 46 }} /><col style={{ width: 90 }} /><col style={{ width: 90 }} /><col style={{ width: 80 }} /><col style={{ width: 100 }} /></colgroup>
          <thead>
            <tr>{['Código', 'Descrição', 'UN', 'Preço vista', 'Preço prazo', 'Estoque', 'Valor total'].map(h => (
              <th key={h} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {produtos.map(p => (
              <tr key={p.id} style={{ transition: 'background 0.08s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '9px 10px', fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontFamily: 'monospace' }}>{p.codigo}</td>
                <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.descricao}</td>
                <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{p.un}</td>
                <td style={{ padding: '9px 10px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{fmt(p.preco_vista)}</td>
                <td style={{ padding: '9px 10px', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{fmt(p.preco_prazo)}</td>
                <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ background: p.estoque === 0 ? 'var(--red-50)' : p.estoque <= 5 ? 'var(--amber-50)' : 'var(--green-50)', color: p.estoque === 0 ? 'var(--red-500)' : p.estoque <= 5 ? 'var(--amber-500)' : 'var(--green-500)', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>{p.estoque}</span>
                </td>
                <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 600, color: 'var(--blue-700)', borderBottom: '1px solid var(--border)' }}>{fmt(p.estoque * p.preco_vista)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--gray-50)', borderTop: '1px solid var(--border)' }}>Valor total do estoque</td>
              <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, color: 'var(--blue-700)', background: 'var(--gray-50)', borderTop: '1px solid var(--border)' }}>{fmt(produtos.reduce((s, p) => s + p.estoque * p.preco_vista, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function RelContasReceber() {
  const totalAberto = contasReceber.filter(c => c.situacao === 'ABERTO').reduce((s, c) => s + c.em_aberto, 0)
  const totalBaixado = contasReceber.filter(c => c.situacao === 'BAIXADO').reduce((s, c) => s + c.valor_pago, 0)
  const vencidas = contasReceber.filter(c => c.situacao === 'ABERTO' && new Date(c.vencimento) < new Date())

  const porCliente = contasReceber.reduce((acc, c) => {
    acc[c.cliente_nome] = (acc[c.cliente_nome] || 0) + c.em_aberto
    return acc
  }, {})
  const maxCliente = Math.max(...Object.values(porCliente))

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <CardMetrica label="Em aberto" value={fmt(totalAberto)} color="var(--blue-700)" />
        <CardMetrica label="Recebido" value={fmt(totalBaixado)} color="var(--green-500)" />
        <CardMetrica label="Parcelas vencidas" value={vencidas.length} color="var(--red-500)" />
        <CardMetrica label="Total documentos" value={contasReceber.length} sub="parcelas" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>A receber por cliente</div>
          {Object.entries(porCliente).sort((a, b) => b[1] - a[1]).map(([cliente, valor]) => (
            <BarraHorizontal key={cliente} label={cliente} value={valor} max={maxCliente} color="var(--blue-400)" />
          ))}
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Resumo por situação</div>
          {[
            { label: 'Em aberto', value: totalAberto, color: 'var(--blue-400)' },
            { label: 'Recebido', value: totalBaixado, color: 'var(--green-500)' },
            { label: 'Vencido', value: vencidas.reduce((s, c) => s + c.em_aberto, 0), color: 'var(--red-400)' },
          ].map(item => (
            <BarraHorizontal key={item.label} label={item.label} value={item.value} max={totalAberto + totalBaixado} color={item.color} />
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Listagem de parcelas</div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-secondary)' }}>
            <Download size={12} /> Exportar
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Documento', 'Seq', 'Cliente', 'Vencimento', 'Valor', 'Em aberto', 'Situação'].map(h => (
              <th key={h} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {contasReceber.map(c => {
              const vencido = c.situacao === 'ABERTO' && new Date(c.vencimento) < new Date()
              return (
                <tr key={c.id} style={{ background: vencido ? 'var(--red-50)' : 'transparent', transition: 'background 0.08s' }}
                  onMouseEnter={e => { if (!vencido) e.currentTarget.style.background = 'var(--gray-50)' }}
                  onMouseLeave={e => { if (!vencido) e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '9px 14px', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{c.documento}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{c.seq}</td>
                  <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{c.cliente_nome}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, borderBottom: '1px solid var(--border)', color: vencido ? 'var(--red-500)' : undefined, fontWeight: vencido ? 500 : 400 }}>{fmtDate(c.vencimento)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{fmt(c.valor_docto)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid var(--border)', color: c.em_aberto > 0 ? 'var(--blue-700)' : 'var(--text-muted)' }}>{fmt(c.em_aberto)}</td>
                  <td style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ background: c.situacao === 'BAIXADO' ? 'var(--green-50)' : vencido ? 'var(--red-50)' : 'var(--blue-50)', color: c.situacao === 'BAIXADO' ? 'var(--green-700)' : vencido ? 'var(--red-500)' : 'var(--blue-800)', padding: '2px 9px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>
                      {c.situacao === 'BAIXADO' ? 'Baixado' : vencido ? 'Vencido' : 'Aberto'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RelFinanceiro() {
  const totalRecebido = contasReceber.filter(c => c.situacao === 'BAIXADO').reduce((s, c) => s + c.valor_pago, 0)
  const totalVendas = vendasMock.reduce((s, v) => s + v.total, 0)
  const totalPagar = 4480.40
  const saldo = totalVendas - totalPagar

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <CardMetrica label="Total de vendas" value={fmt(totalVendas)} color="var(--blue-700)" />
        <CardMetrica label="Total recebido" value={fmt(totalRecebido)} color="var(--green-500)" />
        <CardMetrica label="Total a pagar" value={fmt(totalPagar)} color="var(--red-500)" />
        <CardMetrica label="Saldo do período" value={fmt(saldo)} color={saldo >= 0 ? 'var(--green-500)' : 'var(--red-500)'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Receitas vs Despesas</div>
          {[
            { label: 'Vendas (receita)', value: totalVendas, color: 'var(--blue-400)' },
            { label: 'Recebido efetivo', value: totalRecebido, color: 'var(--green-500)' },
            { label: 'Contas a pagar', value: totalPagar, color: 'var(--red-400)' },
          ].map(item => (
            <BarraHorizontal key={item.label} label={item.label} value={item.value} max={totalVendas} color={item.color} />
          ))}
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Resumo financeiro</div>
          {[
            { label: 'Total faturado', value: fmt(totalVendas), color: 'var(--blue-700)' },
            { label: 'Recebido em dinheiro', value: fmt(vendasMock.filter(v => v.forma === 'Dinheiro').reduce((s, v) => s + v.total, 0)), color: 'var(--green-500)' },
            { label: 'Recebido em cartão', value: fmt(vendasMock.filter(v => v.forma === 'Cartão').reduce((s, v) => s + v.total, 0)), color: 'var(--blue-500)' },
            { label: 'Recebido em convênio', value: fmt(vendasMock.filter(v => v.forma === 'Convênio').reduce((s, v) => s + v.total, 0)), color: 'var(--amber-500)' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
function RelContasPagar() {
  const totalAberto = 2830.40
  const totalVencido = 2200.00
  const totalPago = 890.00

  const categorias = [
    { label: 'Fornecedor', valor: 2140.00 },
    { label: 'Aluguel', valor: 2200.00 },
    { label: 'Utilidades', valor: 580.40 },
    { label: 'Serviços', valor: 450.00 },
    { label: 'Outros', valor: 199.90 },
  ]
  const maxCategoria = Math.max(...categorias.map(c => c.valor))

  const contasPagar = [
    { descricao: 'Fornecedor Aço Total',    categoria: 'Fornecedor', vencimento: '2024-02-10', valor: 1250.00, situacao: 'ABERTO' },
    { descricao: 'Conta de energia',        categoria: 'Utilidades', vencimento: '2024-02-15', valor: 380.50,  situacao: 'ABERTO' },
    { descricao: 'Aluguel do galpão',       categoria: 'Aluguel',    vencimento: '2024-02-05', valor: 2200.00, situacao: 'VENCIDO' },
    { descricao: 'Fornecedor Calhas Brasil', categoria: 'Fornecedor', vencimento: '2024-01-20', valor: 890.00,  situacao: 'PAGO' },
    { descricao: 'Internet + Telefone',     categoria: 'Utilidades', vencimento: '2024-02-20', valor: 199.90,  situacao: 'ABERTO' },
    { descricao: 'Contador',               categoria: 'Serviços',   vencimento: '2024-02-28', valor: 450.00,  situacao: 'ABERTO' },
  ]

  const statusCfg = {
    ABERTO:  { bg: 'var(--blue-50)',  color: 'var(--blue-800)',  label: 'Aberto' },
    VENCIDO: { bg: 'var(--red-50)',   color: 'var(--red-500)',   label: 'Vencido' },
    PAGO:    { bg: 'var(--green-50)', color: 'var(--green-700)', label: 'Pago' },
  }

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <CardMetrica label="Em aberto"       value={fmt(totalAberto)}  color="var(--blue-700)" />
        <CardMetrica label="Vencido"         value={fmt(totalVencido)} color="var(--red-500)" />
        <CardMetrica label="Pago no período" value={fmt(totalPago)}    color="var(--green-500)" />
        <CardMetrica label="Total de contas" value={contasPagar.length} sub="lançamentos" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Contas a pagar por categoria</div>
          {categorias.map(c => (
            <BarraHorizontal key={c.label} label={c.label} value={c.valor} max={maxCategoria} color="var(--blue-400)" />
          ))}
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Resumo por situação</div>
          {[
            { label: 'Em aberto', value: totalAberto,  color: 'var(--blue-400)' },
            { label: 'Vencido',   value: totalVencido, color: 'var(--red-400)' },
            { label: 'Pago',      value: totalPago,    color: 'var(--green-500)' },
          ].map(item => (
            <BarraHorizontal key={item.label} label={item.label} value={item.value} max={totalAberto + totalPago} color={item.color} />
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Listagem de contas a pagar</div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-secondary)' }}>
            <Download size={12} /> Exportar
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Descrição', 'Categoria', 'Vencimento', 'Valor', 'Situação'].map(h => (
                <th key={h} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contasPagar.map((c, i) => {
              const s = statusCfg[c.situacao]
              return (
                <tr key={i}
                  style={{ background: c.situacao === 'VENCIDO' ? 'var(--red-50)' : 'transparent', transition: 'background 0.08s' }}
                  onMouseEnter={e => { if (c.situacao !== 'VENCIDO') e.currentTarget.style.background = 'var(--gray-50)' }}
                  onMouseLeave={e => { if (c.situacao !== 'VENCIDO') e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{c.descricao}</td>
                  <td style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{c.categoria}</span>
                  </td>
                  <td style={{ padding: '9px 14px', fontSize: 12, borderBottom: '1px solid var(--border)', color: c.situacao === 'VENCIDO' ? 'var(--red-500)' : undefined, fontWeight: c.situacao === 'VENCIDO' ? 500 : 400 }}>
                    {new Date(c.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid var(--border)', color: c.situacao === 'PAGO' ? 'var(--text-muted)' : 'var(--text-primary)' }}>{fmt(c.valor)}</td>
                  <td style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ background: s.bg, color: s.color, padding: '2px 9px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>{s.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--gray-50)', borderTop: '1px solid var(--border)' }}>Total</td>
              <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, color: 'var(--blue-700)', background: 'var(--gray-50)', borderTop: '1px solid var(--border)' }}>
                {fmt(contasPagar.reduce((s, c) => s + c.valor, 0))}
              </td>
              <td style={{ background: 'var(--gray-50)', borderTop: '1px solid var(--border)' }}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
export default function Relatorios({ paginaAtiva }) {
  const abaInicial = abas.find(a => a.id === paginaAtiva)?.id || 'rel-vendas'
  const [abaAtiva, setAbaAtiva] = useState(abaInicial)

  function renderAba() {
    switch (abaAtiva) {
      case 'rel-vendas':         return <RelVendas />
      case 'rel-produtos':       return <RelProdutos />
      case 'rel-contas-receber': return <RelContasReceber />
      case 'rel-contas-pagar': return <RelContasPagar />
      case 'rel-financeiro':     return <RelFinanceiro />
      default:                   return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>
          Relatório em desenvolvimento
        </div>
      )
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '0 16px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {abas.map(aba => {
          const Icon = aba.icon
          const ativo = abaAtiva === aba.id
          return (
            <button key={aba.id} onClick={() => setAbaAtiva(aba.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '13px 16px', fontSize: 13,
              fontWeight: ativo ? 500 : 400,
              color: ativo ? 'var(--blue-700)' : 'var(--text-secondary)',
              borderBottom: ativo ? '2px solid var(--blue-700)' : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.12s', whiteSpace: 'nowrap',
            }}>
              <Icon size={14} style={{ color: ativo ? 'var(--blue-600)' : 'var(--text-muted)' }} />
              {aba.label}
            </button>
          )
        })}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {renderAba()}
      </div>
    </div>
  )
}