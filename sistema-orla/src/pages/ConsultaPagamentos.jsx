import { useState, useEffect } from 'react'
import { Search, RefreshCw, Receipt } from 'lucide-react'

const fmt = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-')

function mesAtual() {
  const hoje = new Date()
  const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  const fim = hoje.toISOString().slice(0, 10)
  return { ini, fim }
}

export default function ConsultaPagamentos() {
  const { ini, fim } = mesAtual()
  const [dataInicio, setDataInicio] = useState(ini)
  const [dataFim, setDataFim] = useState(fim)
  const [busca, setBusca] = useState('')
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)

  async function carregar() {
    setLoading(true)
    try {
      const result = await window.api.contasPagar.listar({ situacao: 'P' })
      setDados(result || [])
    } catch (e) {
      console.error('Erro ao carregar pagamentos:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const filtrados = dados
    .filter((c) => !dataInicio || (c.data_pagamento || '') >= dataInicio)
    .filter((c) => !dataFim || (c.data_pagamento || '') <= dataFim)
    .filter((c) => {
      if (!busca) return true
      const b = busca.toLowerCase()
      return (
        (c.nome_fornecedor || '').toLowerCase().includes(b) ||
        (c.codigo_fornecedor || '').toLowerCase().includes(b) ||
        (c.nro_docto || '').includes(busca)
      )
    })
    .sort((a, b) => (a.data_pagamento < b.data_pagamento ? 1 : -1))

  const totalPago = filtrados.reduce((s, c) => s + (c.valor_pagamento || 0), 0)
  const totalDesconto = filtrados.reduce((s, c) => s + (c.valor_desconto || 0), 0)

  const porForma = {}
  filtrados.forEach((c) => {
    const f = c.codigo_forma_pagamento || 'Não informado'
    porForma[f] = (porForma[f] || 0) + (c.valor_pagamento || 0)
  })

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
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={busca} onChange={(e) => setBusca(e.target.value)}
              placeholder='Buscar por fornecedor ou documento...'
              style={{ width: '100%', height: 34, paddingLeft: 32, borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13 }}
            />
          </div>
          <button onClick={carregar}
            style={{ height: 34, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border-md)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', background: 'var(--surface)' }}
            title='Atualizar'>
            <RefreshCw size={13} /> Atualizar
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border-md)', minWidth: 140 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Pago no período</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#C53030' }}>{fmt(totalPago)}</div>
          </div>
          <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border-md)', minWidth: 140 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Descontos obtidos</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#22863A' }}>{fmt(totalDesconto)}</div>
          </div>
          {Object.entries(porForma).map(([forma, valor]) => (
            <div key={forma} style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border-md)', minWidth: 120 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{forma}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#185FA5' }}>{fmt(valor)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div style={{ flex: 1, overflowY: 'auto', margin: '12px 20px 20px' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Receipt size={28} style={{ color: 'var(--text-muted)' }} />
            Nenhum pagamento encontrado no período.
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Data pagto.', 'Documento', 'Fornecedor', 'Forma', 'Valor doc.', 'Desconto', 'Valor pago', 'Usuário'].map((h) => (
                    <th key={h} style={{ padding: '9px 14px', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textAlign: ['Valor doc.', 'Desconto', 'Valor pago'].includes(h) ? 'right' : 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(c.data_pagamento)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'monospace' }}>{c.nro_docto || '-'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500 }}>{c.nome_fornecedor || c.codigo_fornecedor}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{c.codigo_forma_pagamento || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(c.valor_docto)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', color: c.valor_desconto ? '#22863A' : 'var(--text-muted)' }}>{fmt(c.valor_desconto)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, textAlign: 'right', color: '#C53030' }}>{fmt(c.valor_pagamento)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{c.usuario || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--gray-50)', borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                  <td colSpan={5} style={{ padding: '10px 14px', fontSize: 12 }}>TOTAL — {filtrados.length} pagamento(s)</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmt(totalDesconto)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', color: '#C53030' }}>{fmt(totalPago)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
