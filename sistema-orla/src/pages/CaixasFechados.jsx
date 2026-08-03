import { useState, useEffect } from 'react'
import { RefreshCw, FolderOpen } from 'lucide-react'
import ThOrdenavel from '../components/ThOrdenavel'
import { BotoesRelatorio } from '../components/BotoesRelatorio'
import { useOrdenacao } from '../utils/ordenacao'
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

  async function carregar() {
    setLoading(true)
    try {
      const data = await window.api.caixa.historico({ dataInicio, dataFim })
      setSessoes((data || []).filter((s) => s.situacao === 'F'))
    } catch (e) {
      console.error('Erro ao carregar caixas fechados:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const totalVendas = sessoes.reduce((s, c) => s + (c.qtde_vendas || 0), 0)
  const totalGeral = sessoes.reduce((s, c) => s + (c.valor_total || 0), 0)
  const totalDinheiro = sessoes.reduce((s, c) => s + (c.valor_dinheiro || 0), 0)
  const totalCartaoC = sessoes.reduce((s, c) => s + (c.valor_cartao_credito || 0), 0)
  const totalCartaoD = sessoes.reduce((s, c) => s + (c.valor_cartao_debito || 0), 0)
  const totalCheque = sessoes.reduce((s, c) => s + (c.valor_cheque || 0), 0)

  const { ordenados, coluna, direcao, alternar } = useOrdenacao(sessoes, {
    colunaInicial: 'data_abertura',
    acessores: {
      data_abertura: (s) => `${s.data_abertura || ''} ${s.hora_abertura || ''}`,
      data_fechamento: (s) => `${s.data_fechamento || ''} ${s.hora_fechamento || ''}`,
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
      'Total (R$)': (s.valor_total || 0).toFixed(2).replace('.', ','),
    }))
    linhas.push({
      Abertura: '', 'Aberto por': '', Fechamento: '', 'Fechado por': '',
      Vendas: totalVendas,
      'Dinheiro (R$)': totalDinheiro.toFixed(2).replace('.', ','),
      'Cartão Créd. (R$)': totalCartaoC.toFixed(2).replace('.', ','),
      'Cartão Déb. (R$)': totalCartaoD.toFixed(2).replace('.', ','),
      'Cheque (R$)': totalCheque.toFixed(2).replace('.', ','),
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
        <td class="num">${fmtMoedaBR(s.valor_total)}</td>
      </tr>`,
      montarTotalGeral: () => `
        <td colspan="2">TOTAL GERAL</td>
        <td class="num">${totalVendas}</td>
        <td class="num">${fmtMoedaBR(totalDinheiro)}</td>
        <td class="num">${fmtMoedaBR(totalCartaoC)}</td>
        <td class="num">${fmtMoedaBR(totalCartaoD)}</td>
        <td class="num">${fmtMoedaBR(totalCheque)}</td>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { label: 'Caixas fechados', value: sessoes.length, color: 'var(--text-primary)' },
            { label: 'Vendas no período', value: totalVendas, color: 'var(--text-primary)' },
            { label: 'Dinheiro', value: fmt(totalDinheiro), color: '#22863A' },
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
                {ordenados.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(s.data_abertura)} {fmtHora(s.hora_abertura)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{s.usuario_abertura || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(s.data_fechamento)} {fmtHora(s.hora_fechamento)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{s.usuario_fechamento || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{s.qtde_vendas || 0}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(s.valor_dinheiro)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(s.valor_cartao_credito)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(s.valor_cartao_debito)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(s.valor_cheque)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, textAlign: 'right', color: '#185FA5' }}>{fmt(s.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--gray-50)', borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                  <td colSpan={4} style={{ padding: '10px 14px', fontSize: 12 }}>TOTAL — {sessoes.length} fechamento(s)</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{totalVendas}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(totalDinheiro)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(totalCartaoC)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(totalCartaoD)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(totalCheque)}</td>
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
