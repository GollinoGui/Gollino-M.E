import { useState, useEffect } from 'react'
import { RefreshCw, FolderOpen } from 'lucide-react'

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
                  {['Abertura', 'Por', 'Fechamento', 'Por', 'Vendas', 'Dinheiro', 'Cartão Créd.', 'Cartão Déb.', 'Cheque', 'Total'].map((h) => (
                    <th key={h} style={{ padding: '9px 14px', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textAlign: ['Abertura', 'Por', 'Fechamento'].includes(h) ? 'left' : 'right', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessoes.map((s) => (
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
