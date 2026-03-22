import { useState } from 'react'
import { Wrench, CheckCircle, AlertTriangle } from 'lucide-react'

const acoes = [
  {
    id: 'corrigirCR',
    titulo: 'Corrigir CR de vendas canceladas',
    descricao: 'Cancela automaticamente títulos em aberto no Contas a Receber que pertencem a vendas já canceladas.',
    fn: () => window.api.manutencao.corrigirCR(),
    formatarResultado: (r) => `${r.corrigidos} registro(s) corrigido(s).`,
  },
]

export default function Manutencao() {
  const [resultados, setResultados] = useState({})
  const [loading, setLoading] = useState({})

  async function executar(acao) {
    setLoading((p) => ({ ...p, [acao.id]: true }))
    setResultados((p) => ({ ...p, [acao.id]: null }))
    try {
      const res = await acao.fn()
      setResultados((p) => ({ ...p, [acao.id]: { ok: true, msg: acao.formatarResultado(res) } }))
    } catch (e) {
      setResultados((p) => ({ ...p, [acao.id]: { ok: false, msg: e.message } }))
    } finally {
      setLoading((p) => ({ ...p, [acao.id]: false }))
    }
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24, background: 'var(--bg)' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
          Ferramentas para corrigir inconsistências no banco de dados.
        </div>
        {acoes.map((acao) => {
          const res = resultados[acao.id]
          const carregando = loading[acao.id]
          return (
            <div key={acao.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Wrench size={18} style={{ color: 'var(--blue-600)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{acao.titulo}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{acao.descricao}</div>
                {res && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: res.ok ? '#22543D' : '#C53030' }}>
                    {res.ok ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                    {res.msg}
                  </div>
                )}
              </div>
              <button
                onClick={() => executar(acao)}
                disabled={carregando}
                style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--blue-700)', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: carregando ? 'wait' : 'pointer', flexShrink: 0, opacity: carregando ? 0.7 : 1 }}
              >
                {carregando ? 'Executando...' : 'Executar'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
