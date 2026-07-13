import { useState } from 'react'
import { Ban } from 'lucide-react'

// Modal de cancelamento de venda — exige um motivo, já que a operação
// reverte estoque e cancela parcelas (inclusive já pagas).
export default function ModalCancelarVenda({ orcamento, onFechar, onConfirmar }) {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function confirmar() {
    if (!motivo.trim()) return
    setEnviando(true)
    setErro('')
    try {
      await onConfirmar(motivo.trim())
    } catch (err) {
      setErro(err.message || 'Erro ao cancelar venda.')
      setEnviando(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
      onClick={onFechar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'fadeIn 0.15s ease' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ban size={20} style={{ color: '#C53030' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Cancelar venda</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
          Cancelar a venda #{orcamento}? O estoque será revertido e as parcelas geradas por ela serão canceladas.
        </div>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
          Motivo do cancelamento (obrigatório)
        </label>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          autoFocus
          rows={3}
          placeholder='Explique o motivo do cancelamento...'
          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', marginBottom: erro ? 8 : 16 }}
        />
        {erro && (
          <div style={{ fontSize: 12, color: '#C53030', marginBottom: 14 }}>{erro}</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={confirmar}
            disabled={!motivo.trim() || enviando}
            style={{
              width: '100%', height: 38, borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: motivo.trim() && !enviando ? 'pointer' : 'not-allowed',
              background: '#C53030', color: '#fff', border: 'none',
              opacity: motivo.trim() && !enviando ? 1 : 0.5,
            }}
          >
            {enviando ? 'Cancelando...' : 'Cancelar venda'}
          </button>
          <button
            onClick={onFechar}
            disabled={enviando}
            style={{ width: '100%', height: 38, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)', border: 'none' }}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
