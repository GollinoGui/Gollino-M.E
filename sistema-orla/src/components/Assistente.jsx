import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, ChevronDown } from 'lucide-react'

const hora = new Date().getHours()
const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

const mensagensIniciais = [
  {
    tipo: 'bot',
    texto: `${saudacao}! 👋 Sou o assistente da Gollino M.E. Posso te ajudar com informações sobre vendas, estoque e financeiro.`,
    hora: new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  },
]

const sugestoes = [
  'Como foi o fluxo de vendas hoje?',
  'Quais produtos estão com estoque baixo?',
  'Tem alguma conta vencendo hoje?',
  'Qual o total em caixa agora?',
  'Resumo financeiro do dia',
]

const fmt = (v) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function gerarResposta(pergunta) {
  const p = pergunta.toLowerCase()

  if (p.includes('venda') || p.includes('fluxo')) {
    return `Hoje foram realizadas **4 vendas**, totalizando **R$ 1.183,30**. A maior venda foi para a Construtora Viver Ltda no valor de R$ 520,00 via Convênio. O ticket médio do dia está em R$ 295,83. 📈`
  }
  if (p.includes('estoque') || p.includes('produto')) {
    return `Há **2 produtos com estoque baixo** que precisam de atenção:\n\n• **Calha PVC 4m branca** — apenas 3 unidades (mínimo: 10)\n• **Chapa galvanizada 26** — apenas 7 unidades (mínimo: 10)\n\nDeseja registrar uma entrada de mercadoria?`
  }
  if (p.includes('conta') && p.includes('venc')) {
    return `Existem **3 parcelas a vencer em breve**:\n\n• Arnaldo Leonidas — R$ 43,10 vence **hoje** ⚠️\n• Construtora Viver Ltda — R$ 520,00 vence amanhã\n• João Carlos Ferreira — R$ 87,50 vence em 3 dias\n\nTotal em aberto: R$ 650,60`
  }
  if (p.includes('caixa') || p.includes('total')) {
    return `O caixa está **aberto** desde as 08:00. Saldo atual:\n\n• Dinheiro: R$ 244,80\n• Cartão: R$ 419,50\n• Convênio: R$ 519,00\n\n**Total: R$ 1.183,30** 💰`
  }
  if (p.includes('financeiro') || p.includes('resumo')) {
    return `Resumo financeiro de hoje:\n\n💚 Entradas: **R$ 1.183,30**\n🟡 A receber: **R$ 650,60**\n🔴 A pagar: **R$ 3.450,00**\n\nSaldo do período: R$ 1.183,30\n\nAtenção: há uma conta vencida com a Aluguel do galpão (R$ 2.200,00)!`
  }
  if (p.includes('pagar') || p.includes('despesa')) {
    return `Contas a pagar em aberto:\n\n⚠️ **Aluguel do galpão** — R$ 2.200,00 (VENCIDO!)\n• Fornecedor Aço Total — R$ 1.250,00 (vence em 5 dias)\n• Internet + Telefone — R$ 199,90 (vence em 10 dias)\n• Contador — R$ 450,00 (vence em 18 dias)\n\nTotal: R$ 4.099,90`
  }
  if (
    p.includes('oi') ||
    p.includes('olá') ||
    p.includes('ola') ||
    p.includes('tudo')
  ) {
    return `Tudo bem por aqui! 😊 O sistema está funcionando normalmente. Posso te ajudar com vendas, estoque, contas ou qualquer informação da empresa. O que você precisa?`
  }
  if (p.includes('fechar caixa') || p.includes('fecha')) {
    return `Para fechar o caixa, vá em **Operacional → Fechar caixa**. Antes de fechar, confira:\n\n✅ Todas as vendas foram registradas\n✅ Sangrias e reforços estão anotados\n✅ Valor em caixa confere com o sistema\n\nO backup automático será feito ao fechar o caixa.`
  }
  return `Entendi! Posso te ajudar com informações sobre **vendas**, **estoque**, **contas a receber/pagar**, **caixa** e **resumos financeiros**. O que você precisa saber?`
}

function formatarTexto(texto) {
  const partes = texto.split('\n')
  return partes.map((linha, i) => {
    const formatada = linha.replace(
      /\*\*(.*?)\*\*/g,
      (_, t) => `<strong>${t}</strong>`,
    )
    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: formatada }} />
        {i < partes.length - 1 && <br />}
      </span>
    )
  })
}

export default function Assistente({ caixaAberto, onNavigate }) {
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState(mensagensIniciais)
  const [input, setInput] = useState('')
  const [digitando, setDigitando] = useState(false)
  const [notificacoes, setNotificacoes] = useState(3)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const alertas = [
    !caixaAberto && {
      tipo: 'danger',
      texto: 'Caixa não foi aberto hoje ainda!',
    },
    { tipo: 'warning', texto: 'Arnaldo Leonidas vence hoje — R$ 43,10' },
    { tipo: 'danger', texto: 'Aluguel do galpão VENCIDO — R$ 2.200,00' },
    { tipo: 'info', texto: 'Calha PVC com estoque baixo (3 un.)' },
  ].filter(Boolean)

  useEffect(() => {
    if (aberto) {
      setNotificacoes(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [aberto])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, digitando])

  useEffect(() => {
    if (!caixaAberto && !aberto) {
      const timer = setTimeout(() => {
        setMensagens((prev) => [
          ...prev,
          {
            tipo: 'bot',
            texto:
              '⚠️ Lembrete: o caixa ainda não foi aberto hoje! Não esqueça de abrir antes de começar as vendas.',
            hora: new Date().toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            alerta: true,
          },
        ])
        setNotificacoes((prev) => prev + 1)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [caixaAberto])

  function enviar(texto) {
    const msg = texto || input.trim()
    if (!msg) return
    setInput('')

    setMensagens((prev) => [
      ...prev,
      {
        tipo: 'user',
        texto: msg,
        hora: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ])

    setDigitando(true)
    setTimeout(
      () => {
        setDigitando(false)
        setMensagens((prev) => [
          ...prev,
          {
            tipo: 'bot',
            texto: gerarResposta(msg),
            hora: new Date().toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ])
      },
      800 + Math.random() * 600,
    )
  }

  const corAlerta = { danger: '#C53030', warning: '#B7791F', info: '#185FA5' }
  const bgAlerta = { danger: '#FFF0F0', warning: '#FFF8E6', info: '#EBF3FC' }
  const bdAlerta = { danger: '#FECACA', warning: '#FFE8A3', info: '#C5DEFA' }

  return (
    <>
      <style>{`
        @keyframes botEntrada {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes userEntrada {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes ping {
          0%   { transform: scale(1);   opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes assistenteAbrir {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .msg-bot  { animation: botEntrada  0.25s ease both; }
        .msg-user { animation: userEntrada 0.2s ease both; }
        .assistente-chat { animation: assistenteAbrir 0.25s cubic-bezier(0.34,1.56,0.64,1) both; }
        .sugestao-btn {
          transition: all 0.15s;
          cursor: pointer;
        }
        .sugestao-btn:hover {
          background: #EBF3FC !important;
          border-color: #8BBEF4 !important;
          color: #0C3F7A !important;
        }
        .send-btn {
          transition: all 0.15s;
        }
        .send-btn:hover { background: #0C3F7A !important; }
        .send-btn:active { transform: scale(0.95); }
        .fab-btn {
          transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .fab-btn:hover { transform: scale(1.1) !important; }
        .fab-btn:active { transform: scale(0.95) !important; }
      `}</style>

      {!aberto && notificacoes > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 96,
            right: 24,
            zIndex: 998,
            background: '#fff',
            border: '1px solid #E2EAF4',
            borderRadius: 14,
            padding: '12px 16px',
            maxWidth: 280,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            animation:
              'assistenteAbrir 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#1A202C',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Bot size={13} style={{ color: '#185FA5' }} /> Assistente
            </div>
            <button
              onClick={() => setNotificacoes(0)}
              style={{ color: '#9AA3B2', lineHeight: 1 }}
            >
              <X size={13} />
            </button>
          </div>
          {alertas.slice(0, 2).map((a, i) => (
            <div
              key={i}
              style={{
                fontSize: 12,
                color: corAlerta[a.tipo],
                background: bgAlerta[a.tipo],
                border: `1px solid ${bdAlerta[a.tipo]}`,
                borderRadius: 8,
                padding: '6px 10px',
                marginBottom: i < 1 ? 6 : 0,
              }}
            >
              {a.texto}
            </div>
          ))}
          <button
            onClick={() => setAberto(true)}
            style={{
              width: '100%',
              marginTop: 10,
              padding: '7px',
              background: '#185FA5',
              color: '#fff',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Ver todos os alertas
          </button>
        </div>
      )}

      {aberto && (
        <div
          className='assistente-chat'
          style={{
            position: 'fixed',
            bottom: 84,
            right: 24,
            zIndex: 999,
            width: 360,
            height: 520,
            background: '#fff',
            borderRadius: 20,
            border: '1px solid #E2EAF4',
            boxShadow: '0 20px 60px rgba(12,63,122,0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #0C3F7A, #185FA5)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={18} style={{ color: '#fff' }} />
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: 1,
                  right: 1,
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: '#4ade80',
                  border: '2px solid #185FA5',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                Assistente Gollino
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
                Online agora
              </div>
            </div>
            <button
              onClick={() => setAberto(false)}
              style={{
                color: 'rgba(255,255,255,0.7)',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')
              }
            >
              <ChevronDown size={20} />
            </button>
          </div>

          {alertas.length > 0 && (
            <div
              style={{
                padding: '8px 14px',
                background: '#FFFBF0',
                borderBottom: '1px solid #FFE8A3',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#B7791F',
                  marginBottom: 4,
                }}
              >
                ALERTAS ATIVOS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {alertas.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 11,
                      color: corAlerta[a.tipo],
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: corAlerta[a.tipo],
                        flexShrink: 0,
                      }}
                    />
                    {a.texto}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px 14px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              background: '#F8FAFD',
            }}
          >
            {mensagens.map((m, i) => (
              <div
                key={i}
                className={m.tipo === 'bot' ? 'msg-bot' : 'msg-user'}
                style={{
                  display: 'flex',
                  justifyContent: m.tipo === 'user' ? 'flex-end' : 'flex-start',
                  gap: 8,
                  alignItems: 'flex-end',
                }}
              >
                {m.tipo === 'bot' && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0C3F7A, #185FA5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={13} style={{ color: '#fff' }} />
                  </div>
                )}
                <div style={{ maxWidth: '78%' }}>
                  <div
                    style={{
                      padding: '9px 13px',
                      borderRadius:
                        m.tipo === 'user'
                          ? '16px 16px 4px 16px'
                          : '16px 16px 16px 4px',
                      background:
                        m.tipo === 'user'
                          ? 'linear-gradient(135deg, #185FA5, #0C3F7A)'
                          : m.alerta
                            ? '#FFF0F0'
                            : '#fff',
                      color:
                        m.tipo === 'user'
                          ? '#fff'
                          : m.alerta
                            ? '#C53030'
                            : '#1A202C',
                      fontSize: 13,
                      lineHeight: 1.5,
                      border:
                        m.tipo === 'bot'
                          ? `1px solid ${m.alerta ? '#FECACA' : '#E2EAF4'}`
                          : 'none',
                      boxShadow:
                        m.tipo === 'user'
                          ? '0 2px 8px rgba(24,95,165,0.2)'
                          : '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                  >
                    {formatarTexto(m.texto)}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#9AA3B2',
                      marginTop: 3,
                      textAlign: m.tipo === 'user' ? 'right' : 'left',
                      paddingLeft: m.tipo === 'bot' ? 4 : 0,
                    }}
                  >
                    {m.hora}
                  </div>
                </div>
              </div>
            ))}

            {digitando && (
              <div
                className='msg-bot'
                style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0C3F7A, #185FA5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bot size={13} style={{ color: '#fff' }} />
                </div>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '16px 16px 16px 4px',
                    background: '#fff',
                    border: '1px solid #E2EAF4',
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#9AA3B2',
                        animation: `ping 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid #EEF3F9',
              background: '#F8FAFD',
              overflowX: 'auto',
            }}
          >
            <div style={{ display: 'flex', gap: 6, paddingBottom: 2 }}>
              {sugestoes.map((s) => (
                <button
                  key={s}
                  className='sugestao-btn'
                  onClick={() => enviar(s)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 500,
                    background: '#fff',
                    color: '#4A5568',
                    border: '1px solid #DDE1E9',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px 14px',
              background: '#fff',
              borderTop: '1px solid #EEF3F9',
              display: 'flex',
              gap: 8,
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && enviar()}
              placeholder='Pergunte algo...'
              style={{
                flex: 1,
                height: 38,
                padding: '0 14px',
                borderRadius: 99,
                border: '1.5px solid #DDE1E9',
                fontSize: 13,
                outline: 'none',
                transition: 'border 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#378ADD')}
              onBlur={(e) => (e.target.style.borderColor = '#DDE1E9')}
            />
            <button
              className='send-btn'
              onClick={() => enviar()}
              disabled={!input.trim()}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: input.trim() ? '#185FA5' : '#DDE1E9',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
              }}
            >
              <Send size={15} style={{ color: '#fff' }} />
            </button>
          </div>
        </div>
      )}

      <button
        className='fab-btn'
        onClick={() => setAberto((prev) => !prev)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 999,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: aberto
            ? '#4A5568'
            : 'linear-gradient(135deg, #0C3F7A, #185FA5)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(12,63,122,0.35)',
        }}
      >
        {aberto ? (
          <X size={22} style={{ color: '#fff' }} />
        ) : (
          <MessageCircle size={22} style={{ color: '#fff' }} />
        )}
        {!aberto && notificacoes > 0 && (
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#C53030',
              border: '2px solid #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {notificacoes}
          </div>
        )}
      </button>
    </>
  )
}
