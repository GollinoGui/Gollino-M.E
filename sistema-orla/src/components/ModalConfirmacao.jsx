import { HelpCircle } from 'lucide-react'

const estilosBotao = {
  primaria: {
    background: 'var(--blue-700)',
    color: 'var(--surface)',
    border: 'none',
  },
  secundaria: {
    background: 'var(--gray-50)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-md)',
  },
  perigo: {
    background: '#C53030',
    color: '#fff',
    border: 'none',
  },
  fantasma: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: 'none',
  },
}

// Modal genérico de ação/confirmação — substitui dialogs nativos do Electron
// (window.api.dialog.confirm, dialog.showMessageBox) por uma UI consistente
// com o resto do app. `botoes` é uma lista de { label, onClick, variante,
// autoFocus }; cada clique já fecha o modal antes de disparar a ação.
export default function ModalConfirmacao({
  titulo = 'Confirmar',
  mensagem,
  icone: Icone = HelpCircle,
  corIcone = 'var(--blue-700)',
  corFundoIcone = 'var(--blue-50)',
  botoes,
  onFechar,
}) {
  function acionar(botao) {
    onFechar?.()
    botao.onClick?.()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
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
              background: corFundoIcone,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icone size={20} style={{ color: corIcone }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{titulo}</div>
        </div>
        {mensagem && (
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: 20,
            }}
          >
            {mensagem}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {botoes.map((botao, idx) => (
            <button
              key={idx}
              onClick={() => acionar(botao)}
              autoFocus={botao.autoFocus}
              style={{
                width: '100%',
                height: 38,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                ...estilosBotao[botao.variante || 'secundaria'],
              }}
            >
              {botao.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
