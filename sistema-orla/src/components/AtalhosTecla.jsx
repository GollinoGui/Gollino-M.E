import { useState, useEffect } from 'react'
import { Keyboard, X } from 'lucide-react'

const atalhos = [
  { tecla: 'F1', desc: 'Busca global' },
  { tecla: 'F2', desc: 'Vendas' },
  { tecla: 'F3', desc: 'Pré-Vendas' },
  { tecla: 'F4', desc: 'Contas a receber' },
  { tecla: 'F5', desc: 'Produtos' },
  { tecla: 'F6', desc: 'Clientes' },
  { tecla: 'F7', desc: 'Estoque' },
  { tecla: 'F8', desc: 'Dashboard (Início)' },
  { tecla: 'ESC', desc: 'Voltar ao início' },
  { tecla: 'Ctrl+K', desc: 'Busca global' },
  { tecla: 'Ctrl+N', desc: 'Novo registro (na tela atual)' },
  { tecla: 'Ctrl+S', desc: 'Salvar (na tela atual)' },
]

export default function AtalhosTecla() {
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    function handler(e) {
      if (e.key === 'F1') {
        e.preventDefault()
        setAberto((prev) => !prev)
      }
      if (e.key === 'Escape' && aberto) setAberto(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [aberto])

  return (
    <>
      <style>{`
        @keyframes atalhoEntrada {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <button
        onClick={() => setAberto((prev) => !prev)}
        title='Atalhos de teclado (F1)'
        style={{
          position: 'fixed',
          bottom: 84,
          left: 24,
          zIndex: 998,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0C3F7A, #185FA5)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(12,63,122,0.3)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <Keyboard size={18} style={{ color: '#fff' }} />
      </button>

      {aberto && (
        <div
          style={{
            position: 'fixed',
            bottom: 134,
            left: 24,
            zIndex: 999,
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #E2EAF4',
            boxShadow: '0 16px 48px rgba(12,63,122,0.18)',
            width: 300,
            overflow: 'hidden',
            animation: 'atalhoEntrada 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid #EEF3F9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #0C3F7A, #185FA5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Keyboard size={15} style={{ color: '#fff' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                Atalhos de teclado
              </span>
            </div>
            <button
              onClick={() => setAberto(false)}
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ padding: '10px 0', maxHeight: 340, overflowY: 'auto' }}>
            {atalhos.map((a, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 18px',
                  borderBottom:
                    i < atalhos.length - 1 ? '1px solid #F0F4FA' : 'none',
                }}
              >
                <span style={{ fontSize: 13, color: '#4A5568' }}>{a.desc}</span>
                <kbd
                  style={{
                    padding: '3px 8px',
                    background: '#F0F4FA',
                    border: '1px solid #DDE1E9',
                    borderRadius: 6,
                    fontSize: 11,
                    color: '#185FA5',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {a.tecla}
                </kbd>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: '10px 18px',
              background: '#F8FAFD',
              borderTop: '1px solid #EEF3F9',
            }}
          >
            <div
              style={{ fontSize: 11, color: '#9AA3B2', textAlign: 'center' }}
            >
              Pressione{' '}
              <kbd
                style={{
                  padding: '1px 5px',
                  background: '#fff',
                  border: '1px solid #DDE1E9',
                  borderRadius: 4,
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              >
                F1
              </kbd>{' '}
              para abrir/fechar
            </div>
          </div>
        </div>
      )}
    </>
  )
}
