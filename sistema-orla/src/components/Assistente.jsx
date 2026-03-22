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
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

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

export default function Assistente({ caixaAberto }) {
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState(mensagensIniciais)
  const [input, setInput] = useState('')
  const [digitando, setDigitando] = useState(false)
  const [notificacoes, setNotificacoes] = useState(0)
  const [dados, setDados] = useState({
    resumo: null,
    contasReceber: [],
    contasPagar: [],
    produtosBaixo: [],
  })
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const hoje = new Date()
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`
  const crVencidos = dados.contasReceber.filter(
    (r) => r.data_vencimento <= hojeStr,
  )
  const cpVencidos = dados.contasPagar.filter(
    (p) => p.data_vencimento <= hojeStr,
  )

  const alertas = [
    !caixaAberto && { tipo: 'danger', texto: 'Caixa não foi aberto hoje ainda!' },
    ...crVencidos.slice(0, 2).map((r) => ({
      tipo: 'warning',
      texto: `${r.nome_cliente || 'Cliente'} — ${fmt(r.valor_em_aberto)} vence hoje`,
    })),
    ...cpVencidos.slice(0, 1).map((p) => ({
      tipo: 'danger',
      texto: `${p.nome_fornecedor || p.descricao || 'Conta'} VENCIDA — ${fmt(p.valor_docto - (p.valor_pagamento || 0))}`,
    })),
    ...dados.produtosBaixo.slice(0, 2).map((pr) => ({
      tipo: 'info',
      texto: `${pr.descricao} com estoque baixo (${pr.estoque_atual} un.)`,
    })),
  ].filter(Boolean)

  async function carregarDados() {
    try {
      const [resumo, cr, cp, prods] = await Promise.all([
        window.api.dashboard.resumo('hoje'),
        window.api.contasReceber.listar({ situacao: 'A' }),
        window.api.contasPagar.listar({ situacao: 'A' }),
        window.api.produtos.listar({ estoqueBaixo: true }),
      ])
      const novosDados = {
        resumo,
        contasReceber: cr || [],
        contasPagar: cp || [],
        produtosBaixo: prods || [],
      }
      setDados(novosDados)
      const hoje = new Date().toISOString().slice(0, 10)
      const nCrVenc = (cr || []).filter((r) => r.data_vencimento <= hoje).length
      const nCpVenc = (cp || []).filter((p) => p.data_vencimento <= hoje).length
      const total = (!caixaAberto ? 1 : 0) + nCrVenc + nCpVenc + (prods?.length || 0)
      setNotificacoes(total)
    } catch (err) {
      console.error('Assistente: erro ao carregar dados', err)
    }
  }

  function gerarResposta(pergunta) {
    const p = pergunta.toLowerCase()
    const { resumo, contasPagar, produtosBaixo } = dados

    if (p.includes('venda') || p.includes('fluxo')) {
      if (!resumo) return 'Carregando dados de vendas...'
      const { total, qtde } = resumo.vendas
      const ticket = qtde > 0 ? total / qtde : 0
      return `Hoje foram realizadas **${qtde} venda${qtde !== 1 ? 's' : ''}**, totalizando **${fmt(total)}**. Ticket médio: ${fmt(ticket)}. 📈`
    }
    if (p.includes('estoque') || p.includes('produto')) {
      if (produtosBaixo.length === 0) return `Todos os produtos estão com estoque normal. ✅`
      const lista = produtosBaixo
        .slice(0, 5)
        .map((pr) => `• **${pr.descricao}** — ${pr.estoque_atual} un. (mínimo: ${pr.estoque_minimo})`)
        .join('\n')
      return `Há **${produtosBaixo.length} produto${produtosBaixo.length !== 1 ? 's' : ''} com estoque baixo**:\n\n${lista}\n\nDeseja registrar uma entrada de mercadoria?`
    }
    if (p.includes('conta') && (p.includes('venc') || p.includes('receber'))) {
      if (crVencidos.length === 0) return `Não há contas a receber vencidas hoje. ✅`
      const lista = crVencidos
        .slice(0, 5)
        .map((r) => `• ${r.nome_cliente || 'Cliente'} — ${fmt(r.valor_em_aberto)} (venc. ${r.data_vencimento})`)
        .join('\n')
      return `Há **${crVencidos.length} conta${crVencidos.length !== 1 ? 's' : ''} vencida${crVencidos.length !== 1 ? 's' : ''}**:\n\n${lista}\n\nTotal a receber: ${resumo ? fmt(resumo.contasReceber.total) : '...'}`
    }
    if (p.includes('caixa') || p.includes('total')) {
      if (!resumo) return 'Carregando dados do caixa...'
      return `Status do caixa: **${caixaAberto ? 'Aberto' : 'Fechado'}**.\n\nVendas do dia:\n• Total: ${fmt(resumo.vendas.total)}\n• Quantidade: ${resumo.vendas.qtde} venda${resumo.vendas.qtde !== 1 ? 's' : ''} 💰`
    }
    if (p.includes('financeiro') || p.includes('resumo')) {
      if (!resumo) return 'Carregando resumo financeiro...'
      return `Resumo financeiro de hoje:\n\n💚 Vendas: **${fmt(resumo.vendas.total)}**\n🟡 A receber (aberto): **${fmt(resumo.contasReceber.total)}**\n🔴 A pagar (aberto): **${fmt(resumo.contasPagar.total)}**\n\n${cpVencidos.length > 0 ? `⚠️ Atenção: ${cpVencidos.length} conta${cpVencidos.length !== 1 ? 's' : ''} a pagar vencida${cpVencidos.length !== 1 ? 's' : ''}!` : 'Contas em dia. ✅'}`
    }
    if (p.includes('pagar') || p.includes('despesa')) {
      if (contasPagar.length === 0) return `Nenhuma conta a pagar em aberto. ✅`
      const lista = [...cpVencidos, ...contasPagar.filter((c) => !cpVencidos.includes(c))]
        .slice(0, 5)
        .map((cp) => {
          const vencido = cp.data_vencimento <= hojeStr
          return `${vencido ? '⚠️' : '•'} **${cp.nome_fornecedor || cp.descricao || 'Conta'}** — ${fmt(cp.valor_docto - (cp.valor_pagamento || 0))} (${vencido ? 'VENCIDA' : `vence ${cp.data_vencimento}`})`
        })
        .join('\n')
      return `Contas a pagar em aberto:\n\n${lista}\n\nTotal: ${resumo ? fmt(resumo.contasPagar.total) : '...'}`
    }
    if (p.includes('oi') || p.includes('olá') || p.includes('ola') || p.includes('tudo')) {
      return `Tudo bem por aqui! 😊 O sistema está funcionando normalmente. Posso te ajudar com vendas, estoque, contas ou qualquer informação da empresa. O que você precisa?`
    }
    if (p.includes('fechar caixa') || p.includes('fecha')) {
      return `Para fechar o caixa, vá em **Operacional → Fechar caixa**. Antes de fechar, confira:\n\n✅ Todas as vendas foram registradas\n✅ Sangrias e reforços estão anotados\n✅ Valor em caixa confere com o sistema`
    }
    return `Entendi! Posso te ajudar com informações sobre **vendas**, **estoque**, **contas a receber/pagar**, **caixa** e **resumos financeiros**. O que você precisa saber?`
  }

  useEffect(() => {
    carregarDados()
    const intervalo = setInterval(carregarDados, 2 * 60 * 1000) // refresh a cada 2 minutos
    return () => clearInterval(intervalo)
  }, [caixaAberto])

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
