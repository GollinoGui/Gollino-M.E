import { useState, useEffect } from 'react'
import {
  ShoppingCart,
  Wallet,
  FolderOpen,
  X,
  TrendingUp,
  TrendingDown,
  Package,
  AlertCircle,
  ArrowRight,
  DollarSign,
  Clock,
  CheckCircle,
  Search,
  History,
} from 'lucide-react'
import ModalAcessoNegado from '../components/ModalAcessoNegado'
import ModalCancelarVenda from '../components/ModalCancelarVenda'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDataBr = (d) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '--')

function AnimatedNumber({ value, prefix = '', suffix = '', integer = false }) {
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

  if (integer)
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

// ── Saudação por horário ──────────────────────────────────────
function getSaudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia! 👋'
  if (h < 18) return 'Boa tarde! 👋'
  return 'Boa noite! 👋'
}

// ── Formatar data do banco (YYYY-MM-DD) para DD/MM ────────────
function fmtDataCurta(dataStr) {
  if (!dataStr) return ''
  const [, m, d] = dataStr.split('-')
  return `${d}/${m}`
}

export default function Dashboard({ onNavigate, caixaAberto, usuario }) {
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
  const [loading, setLoading] = useState(true)

  // Dados do banco
  const [resumo, setResumo] = useState({
    vendas: { total: 0, qtde: 0 },
    contasReceber: { total: 0 },
    contasPagar: { total: 0 },
    estoqueBaixo: 0,
    grafico7dias: [],
  })
  const [vendasHoje, setVendasHoje] = useState([])
  const [contasVencendo, setContasVencendo] = useState([])
  const [contasPagarAlerta, setContasPagarAlerta] = useState([])
  const [produtosBaixo, setProdutosBaixo] = useState([])
  const [totalClientes, setTotalClientes] = useState(0)
  const [totalProdutos, setTotalProdutos] = useState(0)
  const [cancelandoId, setCancelandoId] = useState(null)
  const [vendaParaCancelar, setVendaParaCancelar] = useState(null)
  const [acessoNegado, setAcessoNegado] = useState(null)

  // Busca de vendas antigas (fora do período "hoje") — pra achar e cancelar vendas de teste
  const [buscaAntigaAberta, setBuscaAntigaAberta] = useState(false)
  const [dataInicioAntiga, setDataInicioAntiga] = useState('')
  const [dataFimAntiga, setDataFimAntiga] = useState('')
  const [vendasAntigas, setVendasAntigas] = useState(null)
  const [carregandoVendasAntigas, setCarregandoVendasAntigas] = useState(false)

  const META_DIARIA = 2000

  // ── Carrega dados do banco ────────────────────────────────────
  async function carregarDados(p = 'hoje') {
    setLoading(true)
    try {
      // Resumo principal
      const res = await window.api.dashboard.resumo(p)
      setResumo(res)

      // Vendas de hoje (últimas 5)
      const dataHoje = new Date().toISOString().slice(0, 10)
      const vendas = await window.api.vendas.listar({
        dataInicio: dataHoje,
        dataFim: dataHoje,
        situacao: 'N',
      })
      setVendasHoje(vendas.slice(0, 5))

      // Contas a receber vencendo (próximos 7 dias)
      const d7 = new Date()
      d7.setDate(d7.getDate() + 7)
      const cr = await window.api.contasReceber.listar({
        situacao: 'A',
        dataFim: d7.toISOString().slice(0, 10),
      })
      setContasVencendo(cr.slice(0, 4))

      // Contas a pagar vencendo (próximos 7 dias)
      const cp = await window.api.contasPagar.listar({
        situacao: 'A',
        dataFim: d7.toISOString().slice(0, 10),
      })
      setContasPagarAlerta(cp.slice(0, 3))

      // Produtos com estoque baixo
      const prods = await window.api.produtos.listar({
        estoqueBaixo: true,
      })
      setProdutosBaixo(prods.slice(0, 3))

      // Totais de clientes e produtos
      const clientes = await window.api.clientes.listar({})
      setTotalClientes(clientes.length)

      const todosProds = await window.api.produtos.listar({
        situacao: 'A',
      })
      setTotalProdutos(todosProds.length)
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados(periodo)
  }, [])

  function mudarPeriodo(p) {
    setPeriodo(p)
    setAnimKey((k) => k + 1)
    carregarDados(p)
  }

  function cancelarVenda(orcamento) {
    if ((usuario?.nivel ?? 0) < 2) {
      setAcessoNegado('Você não tem permissão para cancelar vendas. Entre em contato com um administrador.')
      return
    }
    setVendaParaCancelar(orcamento)
  }

  async function executarCancelamentoVenda(motivo) {
    const orcamento = vendaParaCancelar
    setCancelandoId(orcamento)
    try {
      const resultado = await window.api.vendas.cancelar({ orcamento, motivo, usuario: usuario?.usuario || 'sistema' })
      if (!resultado.sucesso) throw new Error(resultado.erro)
      setVendaParaCancelar(null)
      await carregarDados(periodo)
      if (vendasAntigas !== null) await buscarVendasAntigas()
    } finally {
      setCancelandoId(null)
    }
  }

  async function buscarVendasAntigas() {
    if (!dataInicioAntiga || !dataFimAntiga) return
    setCarregandoVendasAntigas(true)
    try {
      const vendas = await window.api.vendas.listar({
        dataInicio: dataInicioAntiga,
        dataFim: dataFimAntiga,
        situacao: 'N',
      })
      setVendasAntigas(vendas)
    } catch (err) {
      console.error('Erro ao buscar vendas antigas:', err)
    } finally {
      setCarregandoVendasAntigas(false)
    }
  }

  // ── Gráfico 7 dias ────────────────────────────────────────────
  function montarGrafico() {
    const dias = []
    const hoje7 = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje7)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const encontrado = resumo.grafico7dias.find((g) => g.data === key)
      const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      dias.push({
        dia: i === 0 ? 'Hoje' : labels[d.getDay()],
        valor: encontrado?.total || 0,
        hoje: i === 0,
      })
    }
    return dias
  }

  // ── Urgência das contas a receber ─────────────────────────────
  function urgenciaVencimento(dataVenc) {
    if (!dataVenc) return 'baixa'
    const hoje2 = new Date().toISOString().slice(0, 10)
    if (dataVenc <= hoje2) return 'alta'
    const diff = Math.ceil((new Date(dataVenc) - new Date(hoje2)) / 86400000)
    if (diff <= 2) return 'media'
    return 'baixa'
  }

  function labelVencimento(dataVenc) {
    if (!dataVenc) return ''
    const hoje2 = new Date().toISOString().slice(0, 10)
    if (dataVenc < hoje2) return 'Vencido'
    if (dataVenc === hoje2) return 'Hoje'
    const diff = Math.ceil((new Date(dataVenc) - new Date(hoje2)) / 86400000)
    if (diff === 1) return 'Amanhã'
    return `Em ${diff} dias`
  }

  const totalHoje = resumo.entradasCaixa || 0
  const dias = montarGrafico()
  const maxValor = Math.max(...dias.map((d) => d.valor), META_DIARIA)

  // ── Formas de pagamento (calculadas das vendas de hoje) ───────
  const formasPagamento = (() => {
    const dinheiro = vendasHoje.reduce(
      (s, v) => s + (v.valor_pago_dinheiro || 0),
      0,
    )
    const cartaoC = vendasHoje.reduce(
      (s, v) => s + (v.valor_pago_cartao_credito || 0),
      0,
    )
    const cartaoD = vendasHoje.reduce(
      (s, v) => s + (v.valor_pago_cartao_debito || 0),
      0,
    )
    const cheque = vendasHoje.reduce(
      (s, v) => s + (v.valor_pago_cheque || 0),
      0,
    )
    const haver = vendasHoje.reduce(
      (s, v) => s + (v.valor_pago_haver || 0),
      0,
    )
    const total = dinheiro + cartaoC + cartaoD + cheque + haver || 1
    return [
      {
        forma: 'Dinheiro',
        valor: dinheiro,
        pct: Math.round((dinheiro / total) * 100),
        cor: '#22863A',
      },
      {
        forma: 'Cartão Crédito',
        valor: cartaoC,
        pct: Math.round((cartaoC / total) * 100),
        cor: '#185FA5',
      },
      {
        forma: 'Cartão Débito',
        valor: cartaoD,
        pct: Math.round((cartaoD / total) * 100),
        cor: '#B7791F',
      },
      {
        forma: 'Cheque',
        valor: cheque,
        pct: Math.round((cheque / total) * 100),
        cor: '#6B21A8',
      },
      {
        forma: 'Haver',
        valor: haver,
        pct: Math.round((haver / total) * 100),
        cor: '#0E7490',
      },
    ].filter((f) => f.valor > 0)
  })()

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideRight { from { width:0; } to { width:var(--w); } }
        @keyframes float { 0%,100% { transform:translateY(0px) rotate(var(--r,0deg)); } 50% { transform:translateY(-8px) rotate(var(--r,0deg)); } }
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .card-hover:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(24,95,165,0.12); border-color:#8BBEF4 !important; }
        .btn-action { transition: transform 0.15s, opacity 0.15s, box-shadow 0.15s; }
        .btn-action:hover { transform:translateY(-2px); opacity:0.93; box-shadow:0 6px 20px rgba(0,0,0,0.18); }
        .btn-action:active { transform:scale(0.97); }
        .period-btn { transition: all 0.15s ease; }
        .period-btn:hover { opacity:0.85; }
        .row-hover { transition: background 0.1s; }
        .row-hover:hover { background:#EBF4FD !important; }
      `}</style>

      {acessoNegado && (
        <ModalAcessoNegado
          mensagem={acessoNegado}
          onFechar={() => setAcessoNegado(null)}
        />
      )}
      {vendaParaCancelar && (
        <ModalCancelarVenda
          orcamento={vendaParaCancelar}
          onFechar={() => setVendaParaCancelar(null)}
          onConfirmar={executarCancelamentoVenda}
        />
      )}

      {/* ── HEADER AZUL ───────────────────────────────────────── */}
      <div
        style={{
          background:
            'linear-gradient(135deg,#0C3F7A 0%,#185FA5 50%,#1a56a0 100%)',
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
                  color: 'var(--surface)',
                  marginBottom: 6,
                  letterSpacing: '-0.5px',
                }}
              >
                {getSaudacao()}
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
                    color: 'var(--surface)',
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

          {/* CARDS DO TOPO */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: 14,
              marginTop: 28,
              animation: 'fadeUp 0.5s ease 0.2s both',
            }}
          >
            {[
              {
                label: 'Faturamento',
                value: resumo.vendas.total,
                isCurrency: true,
                sub: `${resumo.vendas.qtde} vendas no período`,
                nav: 'rel-vendas',
              },
              {
                label: 'A receber',
                value: resumo.contasReceber.total,
                isCurrency: true,
                sub: 'em aberto',
                nav: 'contas-receber',
              },
              {
                label: 'Produtos',
                value: totalProdutos,
                isCurrency: false,
                sub: `${resumo.estoqueBaixo} com estoque baixo`,
                nav: 'produtos',
              },
              {
                label: 'Clientes',
                value: totalClientes,
                isCurrency: false,
                sub: 'cadastrados',
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
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.65)',
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    marginBottom: 10,
                  }}
                >
                  {card.label.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: 'var(--surface)',
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
                    <AnimatedNumber value={card.value} integer />
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
        {/* ALERTA CAIXA FECHADO */}
        {!caixaAberto && (
          <div
            style={{
              background: 'var(--amber-50)',
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
              style={{ color: 'var(--amber-500)', flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--amber-700)' }}>
                Caixa fechado
              </div>
              <div style={{ fontSize: 12, color: 'var(--amber-500)', marginTop: 1 }}>
                Abra o caixa antes de iniciar as vendas do dia.
              </div>
            </div>
            <button
              className='btn-action'
              onClick={() => onNavigate('abrir-caixa')}
              style={{
                padding: '8px 18px',
                background: 'var(--amber-500)',
                color: 'var(--surface)',
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

        {/* META + GRÁFICO */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.8fr',
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* META DIÁRIA */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              border: '1px solid var(--border-md)',
              padding: '20px 22px',
              boxShadow: '0 2px 12px rgba(24,95,165,0.06)',
              animation: 'fadeUp 0.5s ease 0.28s both',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}
                >
                  Meta do dia
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Faturamento diário
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: totalHoje >= META_DIARIA ? '#22863A' : '#185FA5',
                  background: totalHoje >= META_DIARIA ? 'var(--green-50)' : 'var(--blue-50)',
                  padding: '3px 10px',
                  borderRadius: 99,
                }}
              >
                {Math.round((totalHoje / META_DIARIA) * 100)}%
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: 'var(--blue-800)',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {fmt(totalHoje)}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    alignSelf: 'flex-end',
                    marginBottom: 2,
                  }}
                >
                  de {fmt(META_DIARIA)}
                </span>
              </div>
              <div
                style={{
                  height: 10,
                  background: 'var(--gray-50)',
                  borderRadius: 99,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 99,
                    background:
                      totalHoje >= META_DIARIA
                        ? 'linear-gradient(90deg,#155724,#22863A)'
                        : 'linear-gradient(90deg,#0C3F7A,#378ADD)',
                    width: `${Math.min((totalHoje / META_DIARIA) * 100, 100)}%`,
                    transition: 'width 1s ease',
                  }}
                />
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {totalHoje >= META_DIARIA
                ? '🎉 Meta atingida! Parabéns!'
                : `Faltam ${fmt(META_DIARIA - totalHoje)} para a meta`}
            </div>
            <div
              style={{
                borderTop: '1px solid var(--gray-100)',
                marginTop: 14,
                paddingTop: 12,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              {[
                { label: 'Vendas', value: resumo.vendas.qtde },
                { label: 'A receber', value: fmt(resumo.contasReceber.total) },
                { label: 'A pagar', value: fmt(resumo.contasPagar.total) },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div
                    style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GRÁFICO 7 DIAS */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              border: '1px solid var(--border-md)',
              padding: '20px 22px',
              boxShadow: '0 2px 12px rgba(24,95,165,0.06)',
              animation: 'fadeUp 0.5s ease 0.3s both',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}
                >
                  Vendas — últimos 7 dias
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Comparativo diário
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 8,
                height: 120,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: `${(META_DIARIA / maxValor) * 100}%`,
                  borderTop: '1.5px dashed #C5DEFA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: '#185FA5',
                    background: 'var(--surface)',
                    padding: '0 4px',
                    marginTop: -8,
                  }}
                >
                  meta
                </span>
              </div>
              {dias.map((d, i) => {
                const altura = Math.max((d.valor / maxValor) * 100, 4)
                const atingiu = d.valor >= META_DIARIA
                return (
                  <div
                    key={d.dia}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: d.hoje ? '#0C3F7A' : 'var(--text-muted)',
                      }}
                    >
                      {d.valor >= 1000
                        ? `${(d.valor / 1000).toFixed(1)}k`
                        : d.valor > 0
                          ? d.valor
                          : ''}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        borderRadius: '6px 6px 0 0',
                        height: `${altura}%`,
                        background: d.hoje
                          ? 'linear-gradient(180deg,#185FA5,#0C3F7A)'
                          : atingiu
                            ? 'linear-gradient(180deg,#22863A99,#15572466)'
                            : 'linear-gradient(180deg,#C5DEFA,#8BBEF4)',
                        transition: `height 0.8s ease ${i * 0.08}s`,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 10,
                        color: d.hoje ? '#0C3F7A' : 'var(--text-muted)',
                        fontWeight: d.hoje ? 700 : 400,
                      }}
                    >
                      {d.dia}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* VENDAS DE HOJE + FORMAS PAGTO + RESUMO */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* VENDAS DE HOJE */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              border: '1px solid var(--border-md)',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(24,95,165,0.06)',
              animation: 'fadeUp 0.5s ease 0.3s both',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--gray-100)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(90deg,#F7FAFF 0%,#fff 100%)',
              }}
            >
              <div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}
                >
                  {vendasAntigas !== null ? 'Vendas no período' : 'Vendas de hoje'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {vendasAntigas !== null ? `${dataInicioAntiga} a ${dataFimAntiga}` : 'Últimas transações'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => {
                    setBuscaAntigaAberta((v) => !v)
                    if (buscaAntigaAberta) setVendasAntigas(null)
                  }}
                  title='Buscar vendas antigas'
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: buscaAntigaAberta ? '#185FA5' : 'var(--text-muted)',
                    background: buscaAntigaAberta ? 'var(--blue-50)' : 'transparent',
                    flexShrink: 0,
                  }}
                >
                  <History size={14} />
                </button>
                <button
                  onClick={() => onNavigate('rel-vendas')}
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
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--blue-50)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  Ver mais <ArrowRight size={11} />
                </button>
              </div>
            </div>

            {buscaAntigaAberta && (
              <div
                style={{
                  padding: '10px 20px',
                  borderBottom: '1px solid var(--gray-100)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--gray-50)',
                }}
              >
                <input
                  type='date'
                  value={dataInicioAntiga}
                  onChange={(e) => setDataInicioAntiga(e.target.value)}
                  style={{
                    fontSize: 12,
                    padding: '5px 8px',
                    borderRadius: 8,
                    border: '1px solid var(--border-md)',
                  }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>até</span>
                <input
                  type='date'
                  value={dataFimAntiga}
                  onChange={(e) => setDataFimAntiga(e.target.value)}
                  style={{
                    fontSize: 12,
                    padding: '5px 8px',
                    borderRadius: 8,
                    border: '1px solid var(--border-md)',
                  }}
                />
                <button
                  onClick={buscarVendasAntigas}
                  disabled={!dataInicioAntiga || !dataFimAntiga || carregandoVendasAntigas}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#fff',
                    background: '#185FA5',
                    padding: '5px 12px',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    opacity: !dataInicioAntiga || !dataFimAntiga || carregandoVendasAntigas ? 0.6 : 1,
                  }}
                >
                  <Search size={11} /> Buscar
                </button>
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {loading || carregandoVendasAntigas ? (
                <div
                  style={{
                    padding: '24px 20px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                  }}
                >
                  Carregando...
                </div>
              ) : (vendasAntigas !== null ? vendasAntigas : vendasHoje).length === 0 ? (
                <div
                  style={{
                    padding: '24px 20px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                  }}
                >
                  {vendasAntigas !== null ? 'Nenhuma venda no período.' : 'Nenhuma venda hoje ainda.'}
                </div>
              ) : (
                (vendasAntigas !== null ? vendasAntigas : vendasHoje).map((v, i, arr) => (
                  <div
                    key={i}
                    className='row-hover'
                    style={{
                      padding: '12px 20px',
                      borderBottom:
                        i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      background: 'transparent',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg,#EBF3FC,#C5DEFA)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ShoppingCart size={14} style={{ color: '#185FA5' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {v.nome_cliente || 'Consumidor'}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 2,
                        }}
                      >
                        <Clock size={10} />
                        {vendasAntigas !== null ? fmtDataBr(v.data) : (v.hora_cadastro || '--:--')}
                        <span
                          style={{
                            background: 'var(--gray-100)',
                            color: 'var(--text-secondary)',
                            padding: '1px 7px',
                            borderRadius: 99,
                            fontSize: 10,
                            fontWeight: 500,
                          }}
                        >
                          {v.codigo_forma_pagamento1 || 'Outros'}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#185FA5',
                        }}
                      >
                        {fmt(v.valor_total)}
                      </div>
                      <CheckCircle
                        size={14}
                        style={{ color: '#22863A', flexShrink: 0 }}
                      />
                      <button
                        onClick={() => cancelarVenda(v.orcamento)}
                        disabled={cancelandoId === v.orcamento}
                        title='Cancelar venda'
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          flexShrink: 0,
                          opacity: cancelandoId === v.orcamento ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--red-50)'
                          e.currentTarget.style.color = 'var(--red-500)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--text-muted)'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div
              style={{
                padding: '12px 20px',
                background: 'linear-gradient(90deg,#F7FAFF,#EBF3FC)',
                borderTop: '1px solid var(--border-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {vendasAntigas !== null ? `Total do período (${vendasAntigas.length})` : 'Total do dia'}
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--blue-800)' }}>
                {fmt(vendasAntigas !== null ? vendasAntigas.reduce((s, v) => s + (v.valor_total || 0), 0) : totalHoje)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* FORMAS DE PAGAMENTO */}
            <div
              style={{
                background: 'var(--surface)',
                borderRadius: 16,
                border: '1px solid var(--border-md)',
                padding: '18px 20px',
                boxShadow: '0 2px 12px rgba(24,95,165,0.06)',
                animation: 'fadeUp 0.5s ease 0.35s both',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                }}
              >
                Formas de pagamento
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
                Hoje
              </div>
              {formasPagamento.length === 0 ? (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    padding: '8px 0',
                  }}
                >
                  Sem vendas hoje
                </div>
              ) : (
                formasPagamento.map((fp, i) => (
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
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                        }}
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
                            color: 'var(--text-secondary)',
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
                          color: 'var(--text-primary)',
                        }}
                      >
                        {fmt(fp.valor)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 7,
                        background: 'var(--gray-50)',
                        borderRadius: 99,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 99,
                          background: `linear-gradient(90deg,${fp.cor}cc,${fp.cor})`,
                          width: `${fp.pct}%`,
                          transition: 'width 0.8s ease',
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* RESUMO FINANCEIRO */}
            <div
              style={{
                background: 'var(--surface)',
                borderRadius: 16,
                border: '1px solid var(--border-md)',
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
                  color: 'var(--text-primary)',
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
                  bg: 'var(--green-50)',
                  icon: TrendingUp,
                },
                {
                  label: 'A receber',
                  value: fmt(resumo.contasReceber.total),
                  color: 'var(--amber-500)',
                  bg: '#FFF8E6',
                  icon: Clock,
                },
                {
                  label: 'A pagar',
                  value: fmt(resumo.contasPagar.total),
                  color: '#C53030',
                  bg: 'var(--red-50)',
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

        {/* CONTAS A VENCER + ALERTAS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* CONTAS A RECEBER VENCENDO */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              border: '1px solid var(--border-md)',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(24,95,165,0.06)',
              animation: 'fadeUp 0.5s ease 0.45s both',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--gray-100)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(90deg,#F7FAFF,#fff)',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                A receber — vencendo em breve
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
                  (e.currentTarget.style.background = 'var(--blue-50)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                Ver todas <ArrowRight size={11} />
              </button>
            </div>
            {contasVencendo.length === 0 ? (
              <div
                style={{
                  padding: '24px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                }}
              >
                Nenhuma conta vencendo em breve. ✅
              </div>
            ) : (
              contasVencendo.map((c, i) => {
                const urg = urgenciaVencimento(c.data_vencimento)
                const uc = {
                  alta: { bg: 'var(--red-50)', icon: '#C53030', text: '#C53030' },
                  media: { bg: '#FFF8E6', icon: '#B7791F', text: '#B7791F' },
                  baixa: { bg: 'var(--green-50)', icon: '#22863A', text: '#22863A' },
                }[urg]
                return (
                  <div
                    key={i}
                    className='row-hover'
                    style={{
                      padding: '12px 20px',
                      borderBottom:
                        i < contasVencendo.length - 1
                          ? '1px solid var(--border)'
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
                        {c.nome_cliente || c.codigo_cliente}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: uc.text,
                          fontWeight: 500,
                          marginTop: 1,
                        }}
                      >
                        Vence: {labelVencimento(c.data_vencimento)}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        flexShrink: 0,
                      }}
                    >
                      {fmt(c.valor_docto - (c.valor_pagamento || 0))}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* ALERTAS — ESTOQUE BAIXO + CONTAS A PAGAR */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              border: '1px solid var(--border-md)',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(24,95,165,0.06)',
              animation: 'fadeUp 0.5s ease 0.5s both',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--gray-100)',
                background: 'linear-gradient(90deg,#F7FAFF,#fff)',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Alertas
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Estoque e pagamentos
              </div>
            </div>

            {produtosBaixo.length === 0 && contasPagarAlerta.length === 0 && (
              <div
                style={{
                  padding: '24px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                }}
              >
                Nenhum alerta no momento. ✅
              </div>
            )}

            {produtosBaixo.map((p, i) => (
              <div
                key={i}
                className='row-hover'
                style={{
                  padding: '11px 20px',
                  borderBottom: '1px solid var(--border)',
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
                    background: 'var(--amber-50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Package size={14} style={{ color: 'var(--amber-500)' }} />
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
                      color: 'var(--amber-500)',
                      fontWeight: 500,
                      marginTop: 1,
                    }}
                  >
                    Estoque: {p.estoque_atual} {p.unidade}
                  </div>
                </div>
                <button
                  className='btn-action'
                  onClick={() => onNavigate('estoque-posicao')}
                  style={{
                    fontSize: 11,
                    color: '#185FA5',
                    whiteSpace: 'nowrap',
                    padding: '5px 10px',
                    border: '1px solid #C5DEFA',
                    borderRadius: 8,
                    background: 'var(--blue-50)',
                    fontWeight: 600,
                  }}
                >
                  Repor
                </button>
              </div>
            ))}

            {contasPagarAlerta.map((c, i) => {
              const vencido =
                c.data_vencimento <= new Date().toISOString().slice(0, 10)
              return (
                <div
                  key={i}
                  className='row-hover'
                  style={{
                    padding: '11px 20px',
                    borderBottom:
                      i < contasPagarAlerta.length - 1
                        ? '1px solid var(--border)'
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
                      background: vencido ? 'var(--red-50)' : 'var(--blue-50)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <DollarSign
                      size={14}
                      style={{ color: vencido ? '#C53030' : '#185FA5' }}
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
                      {c.nome_fornecedor || c.codigo_fornecedor}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: vencido ? '#C53030' : 'var(--text-muted)',
                        fontWeight: vencido ? 600 : 400,
                        marginTop: 1,
                      }}
                    >
                      {labelVencimento(c.data_vencimento)} ·{' '}
                      {fmt(c.valor_docto)}
                    </div>
                  </div>
                  <button
                    className='btn-action'
                    onClick={() => onNavigate('contas-pagar')}
                    style={{
                      fontSize: 11,
                      color: vencido ? '#C53030' : '#185FA5',
                      whiteSpace: 'nowrap',
                      padding: '5px 10px',
                      border: `1px solid ${vencido ? '#FECACA' : '#C5DEFA'}`,
                      borderRadius: 8,
                      background: vencido ? 'var(--red-50)' : 'var(--blue-50)',
                      fontWeight: 600,
                    }}
                  >
                    {vencido ? 'Urgente' : 'Ver'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 12,
            paddingBottom: 28,
          }}
        >
          {[
            {
              label: 'Nova venda',
              icon: ShoppingCart,
              gradient: 'linear-gradient(135deg,#0C3F7A,#185FA5)',
              nav: 'vendas',
            },
            {
              label: 'Contas a receber',
              icon: Wallet,
              gradient: 'linear-gradient(135deg,#155724,#22863A)',
              nav: 'contas-receber',
            },
            {
              label: 'Contas a pagar',
              icon: DollarSign,
              gradient: 'linear-gradient(135deg,#8A4B0C,#C97A1E)',
              nav: 'contas-pagar',
            },
            {
              label: caixaAberto ? 'Fechar caixa' : 'Abrir caixa',
              icon: caixaAberto ? X : FolderOpen,
              gradient: caixaAberto
                ? 'linear-gradient(135deg,#2D3748,#4A5568)'
                : 'linear-gradient(135deg,#0C3F7A,#378ADD)',
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
                color: 'var(--surface)',
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
              <btn.icon size={18} /> {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
