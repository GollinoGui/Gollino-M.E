import { ShieldAlert } from 'lucide-react'

export default function ModalAcessoNegado({ mensagem, onFechar }) {
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
              background: '#FFFBEB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={20} style={{ color: '#B45309' }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Acesso restrito</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Esta ação exige permissão de administrador
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginBottom: 20,
          }}
        >
          {mensagem ||
            'Você não tem permissão para realizar esta ação. Entre em contato com um administrador.'}
        </div>
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
