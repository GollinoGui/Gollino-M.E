import { useState, useEffect } from 'react'
import {
  ShoppingCart,
  Wallet,
  FolderOpen,
  X,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  AlertCircle,
  ArrowRight,
  DollarSign,
  Clock,
  CheckCircle,
} from 'lucide-react'

const fmt = (v) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const target = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0
    const duration = 800
    const steps = 40
    const increment = target / steps
    let current = 0
    let step = 0
    const timer = setInterval(() => {
      step++
      current = Math.min(current + increment, target)
      setDisplay(current)
      if (step >= steps) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  if (typeof value === 'number' && value < 100)
    return (
      <>
        {prefix}
        {Math.round(display)}
        {suffix}
      </>
    )
  return (
    <>
      {prefix}
      {display.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
      {suffix}
    </>
  )
}

const SVGCalha = ({ style }) => (
  <svg viewBox='0 0 200 60' style={style} fill='none'>
    <path
      d='M0 45 Q50 10 100 30 Q150 50 200 20'
      stroke='currentColor'
      strokeWidth='8'
      strokeLinecap='round'
      fill='none'
    />
    <path
      d='M0 55 L200 55'
      stroke='currentColor'
      strokeWidth='3'
      strokeLinecap='round'
    />
    <path
      d='M10 45 L10 55 M50 32 L50 55 M100 30 L100 55 M150 42 L150 55 M190 25 L190 55'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      opacity='0.5'
    />
  </svg>
)

const SVGRufo = ({ style }) => (
  <svg viewBox='0 0 160 80' style={style} fill='none'>
    <path
      d='M0 60 L80 10 L160 60'
      stroke='currentColor'
      strokeWidth='7'
      strokeLinecap='round'
      strokeLinejoin='round'
      fill='none'
    />
    <path d='M0 60 L160 60' stroke='currentColor' strokeWidth='3' />
    <path
      d='M0 65 L160 65'
      stroke='currentColor'
      strokeWidth='2'
      opacity='0.4'
    />
    <path
      d='M30 60 L30 70 M80 10 L80 70 M130 60 L130 70'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      opacity='0.5'
    />
  </svg>
)

const SVGChapa = ({ style }) => (
  <svg viewBox='0 0 180 100' style={style} fill='none'>
    <rect
      x='5'
      y='5'
      width='170'
      height='90'
      rx='4'
      stroke='currentColor'
      strokeWidth='5'
      fill='none'
    />
    {[20, 40, 60, 80, 100, 120, 140, 160].map((x) => (
      <line
        key={x}
        x1={x}
        y1='5'
        x2={x}
        y2='95'
        stroke='currentColor'
        strokeWidth='1.5'
        opacity='0.3'
      />
    ))}
    {[20, 40, 60, 80].map((y) => (
      <line
        key={y}
        x1='5'
        y1={y}
        x2='175'
        y2={y}
        stroke='currentColor'
        strokeWidth='1.5'
        opacity='0.2'
      />
    ))}
  </svg>
)

const SVGParafuso = ({ style }) => (
  <svg viewBox='0 0 40 100' style={style} fill='none'>
    <rect
      x='8'
      y='2'
      width='24'
      height='16'
      rx='3'
      stroke='currentColor'
      strokeWidth='4'
      fill='none'
    />
    <line
      x1='20'
      y1='18'
      x2='20'
      y2='85'
      stroke='currentColor'
      strokeWidth='6'
      strokeLinecap='round'
    />
    {[30, 42, 54, 66, 78].map((y) => (
      <line
        key={y}
        x1='14'
        y1={y}
        x2='26'
        y2={y}
        stroke='currentColor'
        strokeWidth='2'
        opacity='0.5'
      />
    ))}
    <path
      d='M14 85 L20 98 L26 85Z'
      stroke='currentColor'
      strokeWidth='2'
      fill='none'
    />
  </svg>
)

export default function Dashboard({ onNavigate, caixaAberto }) {
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const hora = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const [periodo, setPeriodo] = useState('hoje')
  const [animKey, setAnimKey] = useState(0)

  const dadosPeriodo = {
    hoje: { vendas: 1183.3, qtde: 4, crescimento: +12.4 },
    semana: { vendas: 4820.0, qtde: 18, crescimento: +8.2 },
    mes: { vendas: 18640.0, qtde: 67, crescimento: +5.1 },
  }

  function mudarPeriodo(p) {
    setPeriodo(p)
    setAnimKey((k) => k + 1)
  }

  const dados = dadosPeriodo[periodo]

  const vendasHoje = [
    {
      hora: '08:32',
      cliente: 'Construtora Viver Ltda',
      valor: 520.0,
      forma: 'Convênio',
    },
    {
      hora: '09:15',
      cliente: 'João Carlos Ferreira',
      valor: 187.0,
      forma: 'Dinheiro',
    },
    {
      hora: '10:44',
      cliente: 'Consumidor a vista',
      valor: 56.8,
      forma: 'Dinheiro',
    },
    {
      hora: '11:20',
      cliente: 'Obras Rápidas ME',
      valor: 419.5,
      forma: 'Cartão',
    },
  ]

  const contasVencendo = [
    {
      cliente: 'Arnaldo Leonidas',
      valor: 43.1,
      vencimento: 'Hoje',
      urgencia: 'alta',
    },
    {
      cliente: 'Construtora Viver Ltda',
      valor: 520.0,
      vencimento: 'Amanhã',
      urgencia: 'media',
    },
    {
      cliente: 'João Carlos Ferreira',
      valor: 87.5,
      vencimento: 'Em 3 dias',
      urgencia: 'baixa',
    },
  ]

  const produtosBaixo = [
    { descricao: 'Calha PVC 4m branca', estoque: 3, minimo: 10 },
    { descricao: 'Chapa galvanizada 26', estoque: 7, minimo: 10 },
  ]

  const contasPagar = [
    {
      descricao: 'Fornecedor Aço Total',
      valor: 1250.0,
      vencimento: 'Em 5 dias',
      vencido: false,
    },
    {
      descricao: 'Aluguel do galpão',
      valor: 2200.0,
      vencimento: 'Vencido',
      vencido: true,
    },
  ]

  const formasPagamento = [
    { forma: 'Dinheiro', valor: 244.8, pct: 21, cor: '#22863A' },
    { forma: 'Cartão', valor: 419.5, pct: 35, cor: '#185FA5' },
    { forma: 'Convênio', valor: 519.0, pct: 44, cor: '#B7791F' },
  ]

  const totalHoje = vendasHoje.reduce((s, v) => s + v.valor, 0)
  const totalReceber = contasVencendo.reduce((s, c) => s + c.valor, 0)

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0F4FA' }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideRight {
          from { width: 0; }
          to   { width: var(--w); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.6; }
          100% { transform: scale(1.6);  opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(var(--r, 0deg)); }
          50%       { transform: translateY(-8px) rotate(var(--r, 0deg)); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .card-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(24,95,165,0.12);
          border-color: #8BBEF4 !important;
        }
        .btn-action {
          transition: transform 0.15s, opacity 0.15s, box-shadow 0.15s;
        }
        .btn-action:hover {
          transform: translateY(-2px);
          opacity: 0.93;
          box-shadow: 0 6px 20px rgba(0,0,0,0.18);
        }
        .btn-action:active { transform: scale(0.97); }
        .period-btn {
          transition: all 0.15s ease;
        }
        .period-btn:hover { opacity: 0.85; }
        .row-hover { transition: background 0.1s; }
        .row-hover:hover { background: #EBF4FD !important; }
      `}</style>

      <div
        style={{
          background:
            'linear-gradient(135deg, #0C3F7A 0%, #185FA5 50%, #1a56a0 100%)',
          padding: '28px 28px 80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <SVGCalha
          style={{
            position: 'absolute',
            right: -20,
            top: 10,
            width: 280,
            height: 80,
            color: 'rgba(255,255,255,0.06)',
            animation: 'float 6s ease-in-out infinite',
            '--r': '-5deg',
          }}
        />
        <SVGRufo
          style={{
            position: 'absolute',
            left: '30%',
            bottom: 20,
            width: 200,
            height: 100,
            color: 'rgba(255,255,255,0.05)',
            animation: 'float 8s ease-in-out infinite 1s',
            '--r': '3deg',
          }}
        />
        <SVGChapa
          style={{
            position: 'absolute',
            right: '25%',
            top: -10,
            width: 160,
            height: 90,
            color: 'rgba(255,255,255,0.04)',
            animation: 'float 7s ease-in-out infinite 0.5s',
          }}
        />
        <SVGParafuso
          style={{
            position: 'absolute',
            left: 40,
            bottom: 10,
            width: 40,
            height: 100,
            color: 'rgba(255,255,255,0.07)',
            animation: 'float 5s ease-in-out infinite 2s',
          }}
        />
        <SVGCalha
          style={{
            position: 'absolute',
            left: '55%',
            top: 5,
            width: 180,
            height: 55,
            color: 'rgba(255,255,255,0.04)',
            animation: 'float 9s ease-in-out infinite 0.8s',
            '--r': '8deg',
          }}
        />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ animation: 'fadeUp 0.5s ease both' }}>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: 6,
                  letterSpacing: '-0.5px',
                }}
              >
                Bom dia! 👋
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.65)',
                  textTransform: 'capitalize',
                }}
              >
                {hoje} · {hora}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 6,
                animation: 'fadeUp 0.5s ease 0.1s both',
              }}
            >
              {[
                { id: 'hoje', label: 'Hoje' },
                { id: 'semana', label: 'Semana' },
                { id: 'mes', label: 'Mês' },
              ].map((p) => (
                <button
                  key={p.id}
                  className='period-btn'
                  onClick={() => mudarPeriodo(p.id)}
                  style={{
                    padding: '7px 16px',
                    fontSize: 12,
                    borderRadius: 20,
                    background:
                      periodo === p.id
                        ? 'rgba(255,255,255,0.22)'
                        : 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    border:
                      periodo === p.id
                        ? '1px solid rgba(255,255,255,0.4)'
                        : '1px solid rgba(255,255,255,0.12)',
                    fontWeight: periodo === p.id ? 600 : 400,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 14,
              marginTop: 28,
              animation: 'fadeUp 0.5s ease 0.2s both',
            }}
          >
            {[
              {
                label: 'Faturamento',
                value: dados.vendas,
                isCurrency: true,
                sub: `${dados.qtde} vendas no período`,
                trend: dados.crescimento,
                nav: 'vendas',
              },
              {
                label: 'A receber',
                value: totalReceber,
                isCurrency: true,
                sub: `${contasVencendo.length} parcelas abertas`,
                trend: null,
                nav: 'contas-receber',
              },
              {
                label: 'Produtos',
                value: 12,
                isCurrency: false,
                sub: '2 com estoque baixo',
                trend: null,
                nav: 'produtos',
              },
              {
                label: 'Clientes',
                value: 6,
                isCurrency: false,
                sub: 'cadastrados',
                trend: null,
                nav: 'clientes',
              },
            ].map((card, i) => (
              <button
                key={card.label}
                onClick={() => onNavigate(card.nav)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 16,
                  padding: '18px 20px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  animation: `fadeUp 0.5s ease ${0.25 + i * 0.07}s both`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.17)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.65)',
                      fontWeight: 500,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {card.label.toUpperCase()}
                  </div>
                  {card.trend !== null && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 11,
                        fontWeight: 600,
                        color: card.trend >= 0 ? '#4ade80' : '#f87171',
                        background:
                          card.trend >= 0
                            ? 'rgba(74,222,128,0.15)'
                            : 'rgba(248,113,113,0.15)',
                        padding: '2px 7px',
                        borderRadius: 99,
                      }}
                    >
                      {card.trend >= 0 ? (
                        <TrendingUp size={10} />
                      ) : (
                        <TrendingDown size={10} />
                      )}
                      {Math.abs(card.trend)}%
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: '#fff',
                    lineHeight: 1,
                    marginBottom: 6,
                    letterSpacing: '-0.5px',
                  }}
                  key={animKey}
                >
                  {card.isCurrency ? (
                    <>
                      <span
                        style={{ fontSize: 14, fontWeight: 500, opacity: 0.7 }}
                      >
                        R${' '}
                      </span>
                      <AnimatedNumber value={card.value} />
                    </>
                  ) : (
                    <AnimatedNumber value={card.value} />
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  {card.sub}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '0 28px',
          marginTop: -44,
          position: 'relative',
          zIndex: 10,
        }}
      >
        {!caixaAberto && (
          <div
            style={{
              background: '#FFF8E6',
              border: '1px solid #FFE8A3',
              borderRadius: 14,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
              boxShadow: '0 4px 16px rgba(183,121,31,0.1)',
              animation: 'fadeUp 0.4s ease both',
            }}
          >
            <AlertCircle
              size={20}
              style={{ color: '#B7791F', flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#744210' }}>
                Caixa fechado
              </div>
              <div style={{ fontSize: 12, color: '#B7791F', marginTop: 1 }}>
                Abra o caixa antes de iniciar as vendas do dia.
              </div>
            </div>
            <button
              className='btn-action'
              onClick={() => onNavigate('abrir-caixa')}
              style={{
                padding: '8px 18px',
                background: '#B7791F',
                color: '#fff',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                flexShrink: 0,
              }}
            >
              Abrir caixa agora
            </button>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #E2EAF4',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(24,95,165,0.06)',
              animation: 'fadeUp 0.5s ease 0.3s both',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #EEF3F9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(90deg, #F7FAFF 0%, #fff 100%)',
              }}
            >
              <div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: '#1A202C' }}
                >
                  Vendas de hoje
                </div>
                <div style={{ fontSize: 11, color: '#9AA3B2', marginTop: 2 }}>
                  Últimas transações
                </div>
              </div>
              <button
                onClick={() => onNavigate('vendas')}
                style={{
                  fontSize: 12,
                  color: '#185FA5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  border: '1px solid #C5DEFA',
                  borderRadius: 99,
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#EBF3FC'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                Ver mais <ArrowRight size={11} />
              </button>
            </div>
            {vendasHoje.map((v, i) => (
              <div
                key={i}
                className='row-hover'
                style={{
                  padding: '12px 20px',
                  borderBottom:
                    i < vendasHoje.length - 1 ? '1px solid #F0F4FA' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: 'transparent',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #EBF3FC, #C5DEFA)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ShoppingCart size={14} style={{ color: '#185FA5' }} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: '#1A202C',
                    }}
                  >
                    {v.cliente}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#9AA3B2',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 2,
                    }}
                  >
                    <Clock size={10} /> {v.hora}
                    <span
                      style={{
                        background: '#EEF3F9',
                        color: '#4A5568',
                        padding: '1px 7px',
                        borderRadius: 99,
                        fontSize: 10,
                        fontWeight: 500,
                      }}
                    >
                      {v.forma}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{ fontSize: 14, fontWeight: 700, color: '#185FA5' }}
                  >
                    {fmt(v.valor)}
                  </div>
                  <CheckCircle
                    size={14}
                    style={{ color: '#22863A', flexShrink: 0 }}
                  />
                </div>
              </div>
            ))}
            <div
              style={{
                padding: '12px 20px',
                background: 'linear-gradient(90deg, #F7FAFF, #EBF3FC)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 12, color: '#4A5568', fontWeight: 500 }}>
                Total do dia
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0C3F7A' }}>
                {fmt(totalHoje)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #E2EAF4',
                padding: '18px 20px',
                boxShadow: '0 2px 12px rgba(24,95,165,0.06)',
                animation: 'fadeUp 0.5s ease 0.35s both',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#1A202C',
                  marginBottom: 4,
                }}
              >
                Formas de pagamento
              </div>
              <div style={{ fontSize: 11, color: '#9AA3B2', marginBottom: 16 }}>
                Hoje
              </div>
              {formasPagamento.map((fp, i) => (
                <div
                  key={fp.forma}
                  style={{
                    marginBottom: i < formasPagamento.length - 1 ? 12 : 0,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 5,
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 7 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: fp.cor,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          color: '#4A5568',
                          fontWeight: 500,
                        }}
                      >
                        {fp.forma}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#1A202C',
                      }}
                    >
                      {fmt(fp.valor)}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 7,
                      background: '#F0F4FA',
                      borderRadius: 99,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 99,
                        background: `linear-gradient(90deg, ${fp.cor}cc, ${fp.cor})`,
                        animation: `slideRight 0.8s ease ${0.5 + i * 0.1}s both`,
                        '--w': `${fp.pct}%`,
                        width: `${fp.pct}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #E2EAF4',
                padding: '18px 20px',
                boxShadow: '0 2px 12px rgba(24,95,165,0.06)',
                animation: 'fadeUp 0.5s ease 0.4s both',
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#1A202C',
                  marginBottom: 16,
                }}
              >
                Resumo financeiro
              </div>
              {[
                {
                  label: 'Entradas hoje',
                  value: fmt(totalHoje),
                  color: '#22863A',
                  bg: '#EAF6EE',
                  icon: TrendingUp,
                },
                {
                  label: 'A receber',
                  value: fmt(totalReceber),
                  color: '#B7791F',
                  bg: '#FFF8E6',
                  icon: Clock,
                },
                {
                  label: 'A pagar',
                  value: fmt(3450.0),
                  color: '#C53030',
                  bg: '#FFF0F0',
                  icon: TrendingDown,
                },
              ].map((item, i) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: 10,
                    background: item.bg,
                    marginBottom: i < 2 ? 8 : 0,
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <item.icon size={14} style={{ color: item.color }} />
                    <span
                      style={{
                        fontSize: 12,
                        color: item.color,
                        fontWeight: 500,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: item.color }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #E2EAF4',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(24,95,165,0.06)',
              animation: 'fadeUp 0.5s ease 0.45s both',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #EEF3F9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(90deg, #F7FAFF, #fff)',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C' }}>
                Contas a vencer
              </div>
              <button
                onClick={() => onNavigate('contas-receber')}
                style={{
                  fontSize: 12,
                  color: '#185FA5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 11px',
                  border: '1px solid #C5DEFA',
                  borderRadius: 99,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = '#EBF3FC')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                Ver todas <ArrowRight size={11} />
              </button>
            </div>
            {contasVencendo.map((c, i) => {
              const urgCores = {
                alta: { bg: '#FFF0F0', icon: '#C53030', text: '#C53030' },
                media: { bg: '#FFF8E6', icon: '#B7791F', text: '#B7791F' },
                baixa: { bg: '#EAF6EE', icon: '#22863A', text: '#22863A' },
              }
              const uc = urgCores[c.urgencia]
              return (
                <div
                  key={i}
                  className='row-hover'
                  style={{
                    padding: '12px 20px',
                    borderBottom:
                      i < contasVencendo.length - 1
                        ? '1px solid #F0F4FA'
                        : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'transparent',
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: uc.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Wallet size={14} style={{ color: uc.icon }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {c.cliente}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: uc.text,
                        fontWeight: 500,
                        marginTop: 1,
                      }}
                    >
                      Vence: {c.vencimento}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#1A202C',
                      flexShrink: 0,
                    }}
                  >
                    {fmt(c.valor)}
                  </div>
                </div>
              )
            })}
          </div>

          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #E2EAF4',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(24,95,165,0.06)',
              animation: 'fadeUp 0.5s ease 0.5s both',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #EEF3F9',
                background: 'linear-gradient(90deg, #F7FAFF, #fff)',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C' }}>
                Alertas
              </div>
              <div style={{ fontSize: 11, color: '#9AA3B2', marginTop: 2 }}>
                Estoque e pagamentos
              </div>
            </div>
            {produtosBaixo.map((p, i) => (
              <div
                key={i}
                className='row-hover'
                style={{
                  padding: '11px 20px',
                  borderBottom: '1px solid #F0F4FA',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'transparent',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: '#FFF8E6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Package size={14} style={{ color: '#B7791F' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {p.descricao}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#B7791F',
                      fontWeight: 500,
                      marginTop: 1,
                    }}
                  >
                    Estoque baixo: {p.estoque} un.
                  </div>
                </div>
                <button
                  className='btn-action'
                  onClick={() => onNavigate('entrada-mercadoria')}
                  style={{
                    fontSize: 11,
                    color: '#185FA5',
                    whiteSpace: 'nowrap',
                    padding: '5px 10px',
                    border: '1px solid #C5DEFA',
                    borderRadius: 8,
                    background: '#EBF3FC',
                    fontWeight: 600,
                  }}
                >
                  Repor
                </button>
              </div>
            ))}
            {contasPagar.map((c, i) => (
              <div
                key={i}
                className='row-hover'
                style={{
                  padding: '11px 20px',
                  borderBottom:
                    i < contasPagar.length - 1 ? '1px solid #F0F4FA' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'transparent',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: c.vencido ? '#FFF0F0' : '#EBF3FC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <DollarSign
                    size={14}
                    style={{ color: c.vencido ? '#C53030' : '#185FA5' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.descricao}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: c.vencido ? '#C53030' : '#9AA3B2',
                      fontWeight: c.vencido ? 600 : 400,
                      marginTop: 1,
                    }}
                  >
                    {c.vencimento} · {fmt(c.valor)}
                  </div>
                </div>
                <button
                  className='btn-action'
                  onClick={() => onNavigate('contas-pagar')}
                  style={{
                    fontSize: 11,
                    color: c.vencido ? '#C53030' : '#185FA5',
                    whiteSpace: 'nowrap',
                    padding: '5px 10px',
                    border: `1px solid ${c.vencido ? '#FECACA' : '#C5DEFA'}`,
                    borderRadius: 8,
                    background: c.vencido ? '#FFF0F0' : '#EBF3FC',
                    fontWeight: 600,
                  }}
                >
                  {c.vencido ? 'Urgente' : 'Ver'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            paddingBottom: 28,
          }}
        >
          {[
            {
              label: 'Nova venda',
              icon: ShoppingCart,
              gradient: 'linear-gradient(135deg, #0C3F7A, #185FA5)',
              nav: 'vendas',
            },
            {
              label: 'Contas a receber',
              icon: Wallet,
              gradient: 'linear-gradient(135deg, #155724, #22863A)',
              nav: 'contas-receber',
            },
            {
              label: caixaAberto ? 'Fechar caixa' : 'Abrir caixa',
              icon: caixaAberto ? X : FolderOpen,
              gradient: caixaAberto
                ? 'linear-gradient(135deg, #2D3748, #4A5568)'
                : 'linear-gradient(135deg, #0C3F7A, #378ADD)',
              nav: caixaAberto ? 'fechar-caixa' : 'abrir-caixa',
            },
          ].map((btn) => (
            <button
              key={btn.label}
              className='btn-action'
              onClick={() => onNavigate(btn.nav)}
              style={{
                height: 54,
                background: btn.gradient,
                color: '#fff',
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                border: 'none',
                letterSpacing: '-0.2px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              }}
            >
              <btn.icon size={18} />
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
