import { HelpCircle, X, ArrowRight } from 'lucide-react'

// Perguntas frequentes de "onde eu vejo isso no sistema" — cada uma leva
// direto pra tela que responde. Lista fixa e curta de propósito: é um atalho
// pras dúvidas mais comuns do dia a dia, não uma central de ajuda completa.
const PERGUNTAS = [
  {
    pergunta: 'Quanto eu vendi hoje?',
    local: 'Relatórios de Vendas — total do dia, da semana ou de qualquer período.',
    nav: 'rel-vendas',
  },
  {
    pergunta: 'Quanto eu tenho em caixa hoje?',
    local: 'Caixa — dinheiro que já entrou na sessão aberta, sangrias e reforços.',
    nav: 'abrir-caixa',
  },
  {
    pergunta: 'Onde vejo meu dinheiro, o saldo atual?',
    local: 'Também no Caixa — é onde o dinheiro físico da loja é conferido.',
    nav: 'abrir-caixa',
  },
  {
    pergunta: 'Qual cliente mais comprou de mim em um período?',
    local: 'Relatórios de Vendas → gráfico "Vendas por cliente (top 10)".',
    nav: 'rel-vendas',
  },
]

export default function ModalTutorial({ onFechar, onNavigate }) {
  function irPara(nav) {
    onNavigate(nav)
    onFechar()
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
        zIndex: 2000,
      }}
      onClick={onFechar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          width: 460,
          maxWidth: '92vw',
          maxHeight: '86vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          animation: 'fadeIn 0.15s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '20px 22px 16px',
            borderBottom: '1px solid var(--gray-100)',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--blue-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <HelpCircle size={19} style={{ color: '#185FA5' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Onde eu vejo isso?
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
              Perguntas comuns do dia a dia
            </div>
          </div>
          <button
            onClick={onFechar}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '10px 14px', overflowY: 'auto' }}>
          {PERGUNTAS.map((p, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 10px',
                borderRadius: 12,
                borderBottom: i < PERGUNTAS.length - 1 ? '1px solid var(--gray-100)' : 'none',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {p.pergunta}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>
                  {p.local}
                </div>
              </div>
              <button
                className='btn-action'
                onClick={() => irPara(p.nav)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#185FA5',
                  whiteSpace: 'nowrap',
                  padding: '7px 12px',
                  border: '1px solid #C5DEFA',
                  borderRadius: 8,
                  background: 'var(--blue-50)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  flexShrink: 0,
                }}
              >
                Ver <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
