import { useState, useEffect, Fragment } from 'react'
import { RefreshCw, FolderOpen, ChevronRight } from 'lucide-react'
import ThOrdenavel from '../components/ThOrdenavel'
import { BotoesRelatorio } from '../components/BotoesRelatorio'
import { useOrdenacao } from '../utils/ordenacao'
import { totalRecebidoSessao } from '../utils/caixaHistorico'
import {
  exportarCSV,
  buscarEmpresa,
  gerarHtmlListaSimples,
  gerarPdfRelatorio,
  fmtMoedaBR,
} from '../utils/relatorios'

const fmt = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-')
const fmtHora = (h) => h || '--:--'

function mesAtual() {
  const hoje = new Date()
  const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  const fim = hoje.toISOString().slice(0, 10)
  return { ini, fim }
}

export default function CaixasFechados() {
  const { ini, fim } = mesAtual()
  const [dataInicio, setDataInicio] = useState(ini)
  const [dataFim, setDataFim] = useState(fim)
  const [sessoes, setSessoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandidos, setExpandidos] = useState(() => new Set())
  const [detalhes, setDetalhes] = useState({})

  async function carregar() {
    setLoading(true)
    try {
      const data = await window.api.caixa.historico({ dataInicio, dataFim })
      setSessoes((data || []).filter((s) => s.situacao === 'F'))
      setExpandidos(new Set())
      setDetalhes({})
    } catch (e) {
      console.error('Erro ao carregar caixas fechados:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  // Expande/recolhe os detalhes (vendas) de um caixa; busca sob demanda na
  // 1ª vez que a linha é aberta e guarda em cache pelo id da sessão.
  async function alternarExpandir(sessao) {
    const id = sessao.id
    setExpandidos((prev) => {
      const novo = new Set(prev)
      novo.has(id) ? novo.delete(id) : novo.add(id)
      return novo
    })
    if (detalhes[id]) return
    setDetalhes((prev) => ({ ...prev, [id]: { carregando: true, vendas: [] } }))
    try {
      const vendas = await window.api.vendas.listar({ caixaSessaoId: id })
      setDetalhes((prev) => ({ ...prev, [id]: { carregando: false, vendas: vendas || [] } }))
    } catch (e) {
      console.error('Erro ao carregar detalhes do caixa:', e)
      setDetalhes((prev) => ({ ...prev, [id]: { carregando: false, vendas: [], erro: true } }))
    }
  }

  const totalVendas = sessoes.reduce((s, c) => s + (c.qtde_vendas || 0), 0)
  const totalDinheiro = sessoes.reduce((s, c) => s + (c.valor_dinheiro || 0), 0)
  const totalCartaoC = sessoes.reduce((s, c) => s + (c.valor_cartao_credito || 0), 0)
  const totalCartaoD = sessoes.reduce((s, c) => s + (c.valor_cartao_debito || 0), 0)
  const totalCheque = sessoes.reduce((s, c) => s + (c.valor_cheque || 0), 0)
  const totalPix = sessoes.reduce((s, c) => s + (c.valor_pix || 0), 0)
  const totalPrejuizo = sessoes.reduce((s, c) => s + (c.valor_prejuizo || 0), 0)
  // "Total" é o que realmente entrou no caixa (formas de pagamento imediatas)
  // — não o faturamento da sessão, que incluiria vendas fiado/convênio ainda
  // não recebidas e inflaria o número (ver totalRecebidoSessao).
  const totalGeral = sessoes.reduce((s, c) => s + totalRecebidoSessao(c), 0)

  const { ordenados, coluna, direcao, alternar } = useOrdenacao(sessoes, {
    colunaInicial: 'data_abertura',
    acessores: {
      data_abertura: (s) => `${s.data_abertura || ''} ${s.hora_abertura || ''}`,
      data_fechamento: (s) => `${s.data_fechamento || ''} ${s.hora_fechamento || ''}`,
      valor_total: (s) => totalRecebidoSessao(s),
    },
  })

  function exportarExcel() {
    const linhas = sessoes.map((s) => ({
      Abertura: `${fmtDate(s.data_abertura)} ${fmtHora(s.hora_abertura)}`,
      'Aberto por': s.usuario_abertura || '—',
      Fechamento: `${fmtDate(s.data_fechamento)} ${fmtHora(s.hora_fechamento)}`,
      'Fechado por': s.usuario_fechamento || '—',
      Vendas: s.qtde_vendas || 0,
      'Dinheiro (R$)': (s.valor_dinheiro || 0).toFixed(2).replace('.', ','),
      'Cartão Créd. (R$)': (s.valor_cartao_credito || 0).toFixed(2).replace('.', ','),
      'Cartão Déb. (R$)': (s.valor_cartao_debito || 0).toFixed(2).replace('.', ','),
      'Cheque (R$)': (s.valor_cheque || 0).toFixed(2).replace('.', ','),
      'PIX (R$)': (s.valor_pix || 0).toFixed(2).replace('.', ','),
      'Prejuízo (R$)': (s.valor_prejuizo || 0).toFixed(2).replace('.', ','),
      'Total (R$)': totalRecebidoSessao(s).toFixed(2).replace('.', ','),
    }))
    linhas.push({
      Abertura: '', 'Aberto por': '', Fechamento: '', 'Fechado por': '',
      Vendas: totalVendas,
      'Dinheiro (R$)': totalDinheiro.toFixed(2).replace('.', ','),
      'Cartão Créd. (R$)': totalCartaoC.toFixed(2).replace('.', ','),
      'Cartão Déb. (R$)': totalCartaoD.toFixed(2).replace('.', ','),
      'Cheque (R$)': totalCheque.toFixed(2).replace('.', ','),
      'PIX (R$)': totalPix.toFixed(2).replace('.', ','),
      'Prejuízo (R$)': totalPrejuizo.toFixed(2).replace('.', ','),
      'Total (R$)': totalGeral.toFixed(2).replace('.', ','),
    })
    exportarCSV(linhas, `caixas_fechados_${dataInicio}_${dataFim}`)
  }

  async function gerarRelatorioPDF() {
    const empresa = await buscarEmpresa()
    const colunas = [
      { label: 'Abertura' },
      { label: 'Fechamento' },
      { label: 'Vendas', num: true },
      { label: 'Dinheiro', num: true },
      { label: 'Cartão Créd.', num: true },
      { label: 'Cartão Déb.', num: true },
      { label: 'Cheque', num: true },
      { label: 'PIX', num: true },
      { label: 'Prejuízo', num: true },
      { label: 'Total', num: true },
    ]
    const html = gerarHtmlListaSimples({
      empresa,
      titulo: 'Caixas Fechados',
      subtitulo: `Período de ${fmtDate(dataInicio)} a ${fmtDate(dataFim)} — ${sessoes.length} fechamento(s)`,
      colunas,
      linhas: sessoes,
      montarLinha: (s) => `<tr>
        <td>${fmtDate(s.data_abertura)} ${fmtHora(s.hora_abertura)}</td>
        <td>${fmtDate(s.data_fechamento)} ${fmtHora(s.hora_fechamento)}</td>
        <td class="num">${s.qtde_vendas || 0}</td>
        <td class="num">${fmtMoedaBR(s.valor_dinheiro)}</td>
        <td class="num">${fmtMoedaBR(s.valor_cartao_credito)}</td>
        <td class="num">${fmtMoedaBR(s.valor_cartao_debito)}</td>
        <td class="num">${fmtMoedaBR(s.valor_cheque)}</td>
        <td class="num">${fmtMoedaBR(s.valor_pix)}</td>
        <td class="num">${fmtMoedaBR(s.valor_prejuizo)}</td>
        <td class="num">${fmtMoedaBR(totalRecebidoSessao(s))}</td>
      </tr>`,
      montarTotalGeral: () => `
        <td colspan="2">TOTAL GERAL</td>
        <td class="num">${totalVendas}</td>
        <td class="num">${fmtMoedaBR(totalDinheiro)}</td>
        <td class="num">${fmtMoedaBR(totalCartaoC)}</td>
        <td class="num">${fmtMoedaBR(totalCartaoD)}</td>
        <td class="num">${fmtMoedaBR(totalCheque)}</td>
        <td class="num">${fmtMoedaBR(totalPix)}</td>
        <td class="num">${fmtMoedaBR(totalPrejuizo)}</td>
        <td class="num">${fmtMoedaBR(totalGeral)}</td>
      `,
    })
    await gerarPdfRelatorio(html, `caixas_fechados_${dataInicio}_${dataFim}`)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Cabeçalho */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, margin: 20, marginBottom: 0, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>De</label>
            <input type='date' value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
              style={{ height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Até</label>
            <input type='date' value={dataFim} onChange={(e) => setDataFim(e.target.value)}
              style={{ height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13 }} />
          </div>
          <button onClick={carregar}
            style={{ height: 34, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border-md)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', background: 'var(--surface)' }}
            title='Atualizar'>
            <RefreshCw size={13} /> Atualizar
          </button>
          <div style={{ flex: 1 }} />
          {sessoes.length > 0 && (
            <BotoesRelatorio onExportarExcel={exportarExcel} onGerarPDF={gerarRelatorioPDF} />
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
          {[
            { label: 'Caixas fechados', value: sessoes.length, color: 'var(--text-primary)' },
            { label: 'Vendas no período', value: totalVendas, color: 'var(--text-primary)' },
            { label: 'Dinheiro', value: fmt(totalDinheiro), color: '#22863A' },
            { label: 'Prejuízo', value: fmt(totalPrejuizo), color: '#C53030' },
            { label: 'Total geral', value: fmt(totalGeral), color: '#185FA5' },
          ].map((c) => (
            <div key={c.label} style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border-md)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{c.label}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div style={{ flex: 1, overflowY: 'auto', margin: '12px 20px 20px' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</div>
        ) : sessoes.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <FolderOpen size={28} style={{ color: 'var(--text-muted)' }} />
            Nenhum caixa fechado no período selecionado.
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    { label: 'Abertura', chave: 'data_abertura', align: 'left' },
                    { label: 'Por', chave: 'usuario_abertura', align: 'left' },
                    { label: 'Fechamento', chave: 'data_fechamento', align: 'left' },
                    { label: 'Por', chave: 'usuario_fechamento', align: 'left' },
                    { label: 'Vendas', chave: 'qtde_vendas', align: 'right' },
                    { label: 'Dinheiro', chave: 'valor_dinheiro', align: 'right' },
                    { label: 'Cartão Créd.', chave: 'valor_cartao_credito', align: 'right' },
                    { label: 'Cartão Déb.', chave: 'valor_cartao_debito', align: 'right' },
                    { label: 'Cheque', chave: 'valor_cheque', align: 'right' },
                    { label: 'PIX', chave: 'valor_pix', align: 'right' },
                    { label: 'Prejuízo', chave: 'valor_prejuizo', align: 'right' },
                    { label: 'Total', chave: 'valor_total', align: 'right' },
                  ].map((h) => (
                    <ThOrdenavel
                      key={h.chave}
                      label={h.label}
                      chave={h.chave}
                      colunaAtual={coluna}
                      direcao={direcao}
                      onOrdenar={alternar}
                      style={{ padding: '9px 14px', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textAlign: h.align, background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenados.map((s) => {
                  const aberta = expandidos.has(s.id)
                  return (
                    <Fragment key={s.id}>
                      <tr style={{ borderBottom: aberta ? 'none' : '1px solid var(--border)', cursor: 'pointer' }}
                        onClick={() => alternarExpandir(s)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '10px 14px', fontSize: 12, whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, transform: aberta ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} />
                            {fmtDate(s.data_abertura)} {fmtHora(s.hora_abertura)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{s.usuario_abertura || '—'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(s.data_fechamento)} {fmtHora(s.hora_fechamento)}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{s.usuario_fechamento || '—'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{s.qtde_vendas || 0}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(s.valor_dinheiro)}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(s.valor_cartao_credito)}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(s.valor_cartao_debito)}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(s.valor_cheque)}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(s.valor_pix)}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', color: s.valor_prejuizo > 0 ? '#C53030' : undefined }}>{fmt(s.valor_prejuizo)}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, textAlign: 'right', color: '#185FA5' }}>{fmt(totalRecebidoSessao(s))}</td>
                      </tr>
                      {aberta && (
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td colSpan={12} style={{ padding: 0, background: 'var(--gray-50)' }}>
                            <DetalheCaixa sessao={s} detalhe={detalhes[s.id]} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--gray-50)', borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                  <td colSpan={4} style={{ padding: '10px 14px', fontSize: 12 }}>TOTAL — {sessoes.length} fechamento(s)</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{totalVendas}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(totalDinheiro)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(totalCartaoC)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(totalCartaoD)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(totalCheque)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(totalPix)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', color: totalPrejuizo > 0 ? '#C53030' : undefined }}>{fmt(totalPrejuizo)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', color: '#185FA5' }}>{fmt(totalGeral)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Detalhe expandido de um caixa: cruza o faturamento da sessão com o que
// foi de fato recebido (a diferença é venda fiado/convênio ainda em aberto)
// e lista as vendas individuais daquele caixa, buscadas sob demanda.
function DetalheCaixa({ sessao, detalhe }) {
  const faturamento = sessao.valor_total || 0
  const recebido = totalRecebidoSessao(sessao)
  const aReceber = Math.max(0, faturamento - recebido - (sessao.valor_prejuizo || 0))

  return (
    <div style={{ padding: '4px 20px 16px 42px' }}>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', padding: '10px 0 12px', fontSize: 12 }}>
        <div><span style={{ color: 'var(--text-muted)' }}>Faturamento (vendas): </span><strong>{fmt(faturamento)}</strong></div>
        <div><span style={{ color: 'var(--text-muted)' }}>Recebido no caixa: </span><strong style={{ color: '#185FA5' }}>{fmt(recebido)}</strong></div>
        {aReceber > 0.004 && (
          <div><span style={{ color: 'var(--text-muted)' }}>Ainda a receber (fiado/convênio): </span><strong style={{ color: '#B7791F' }}>{fmt(aReceber)}</strong></div>
        )}
      </div>

      {!detalhe || detalhe.carregando ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 0 10px' }}>Carregando vendas...</div>
      ) : detalhe.erro ? (
        <div style={{ fontSize: 12, color: '#C53030', padding: '4px 0 10px' }}>Erro ao carregar as vendas desse caixa.</div>
      ) : detalhe.vendas.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 0 10px' }}>Nenhuma venda registrada nesse caixa.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 4 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 500, color: 'var(--text-muted)' }}>Venda</th>
              <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 500, color: 'var(--text-muted)' }}>Hora</th>
              <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 500, color: 'var(--text-muted)' }}>Cliente</th>
              <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 500, color: 'var(--text-muted)' }}>Forma de pagamento</th>
              <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 500, color: 'var(--text-muted)' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {detalhe.vendas.map((v) => (
              <tr key={v.orcamento} style={{ opacity: v.situacao === 'C' ? 0.55 : 1 }}>
                <td style={{ padding: '4px 8px' }}>#{v.orcamento}</td>
                <td style={{ padding: '4px 8px' }}>{v.hora_cadastro || '--:--'}</td>
                <td style={{ padding: '4px 8px' }}>{v.nome_cliente ? `${v.nome_cliente} (#${v.codigo_cliente})` : 'Consumidor'}</td>
                <td style={{ padding: '4px 8px' }}>
                  {v.codigo_forma_pagamento1 || '—'}
                  {v.situacao === 'C' && <span style={{ marginLeft: 6, color: '#C53030', fontWeight: 600, fontSize: 11 }}>CANCELADA</span>}
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600, textDecoration: v.situacao === 'C' ? 'line-through' : 'none' }}>{fmt(v.valor_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
