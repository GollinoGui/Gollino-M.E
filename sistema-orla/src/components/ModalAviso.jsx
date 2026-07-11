import { AlertTriangle } from 'lucide-react'

export default function ModalAviso({ titulo = 'Aviso', mensagem, detalhes, onFechar }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onFechar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: 28,
          width: 380,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          animation: 'fadeIn 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#FFF0F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} style={{ color: '#C53030' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{titulo}</div>
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginBottom: detalhes?.length ? 12 : 20,
          }}
        >
          {mensagem}
        </div>
        {detalhes?.length > 0 && (
          <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
            {detalhes.map((d) => (
              <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{d.value}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={onFechar}
          autoFocus
          style={{
            width: '100%',
            height: 38,
            background: 'var(--blue-700)',
            color: 'var(--surface)',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Entendi
        </button>
      </div>
    </div>
  )
}
