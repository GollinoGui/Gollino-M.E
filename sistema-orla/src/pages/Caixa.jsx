import { useState, useEffect } from 'react'
import {
  FolderOpen,
  X,
  Clock,
  DollarSign,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Caixa({ caixaAberto, setCaixaAberto }) {
  const [confirmando, setConfirmando] = useState(false)
  const [statusCaixa, setStatusCaixa] = useState(null)
  const [vendasHoje, setVendasHoje] = useState([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')

  // ── Carrega status e vendas do banco ──────────────────────────
  async function carregar() {
    setLoading(true)
    try {
      const status = await window.api.caixa.status()
      setStatusCaixa(status)

      const hoje = new Date().toISOString().slice(0, 10)
      const vendas = await window.api.vendas.listar({
        dataInicio: hoje,
        dataFim: hoje,
        situacao: 'N',
      })
      setVendasHoje(vendas)
    } catch (err) {
      console.error('Erro ao carregar caixa:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  // Totais calculados das vendas reais
  const totalVendas = vendasHoje.reduce((s, v) => s + (v.valor_total || 0), 0)
  const totalDinheiro = vendasHoje.reduce(
    (s, v) => s + (v.valor_pago_dinheiro || 0),
    0,
  )
  const totalCartaoC = vendasHoje.reduce(
    (s, v) => s + (v.valor_pago_cartao_credito || 0),
    0,
  )
  const totalCartaoD = vendasHoje.reduce(
    (s, v) => s + (v.valor_pago_cartao_debito || 0),
    0,
  )
  const totalCheque = vendasHoje.reduce(
    (s, v) => s + (v.valor_pago_cheque || 0),
    0,
  )

  const horaAbertura = statusCaixa?.hora_abertura || '--:--'

  async function abrirCaixa() {
    setSalvando(true)
    try {
      await window.api.caixa.abrir({
        numero_caixa: '001',
        numero_turno: '1',
        usuario: 'rosangela',
        valor_abertura: 0,
      })
      setCaixaAberto(true)
      setConfirmando(false)
      setSucesso('✅ Caixa aberto com sucesso!')
      setTimeout(() => setSucesso(''), 2500)
      await carregar()
    } catch (err) {
      console.error('Erro ao abrir caixa:', err)
    } finally {
      setSalvando(false)
    }
  }

  async function fecharCaixa() {
    setSalvando(true)
    try {
      await window.api.caixa.fechar({
        usuario: 'rosangela',
        valor_fechamento: totalVendas,
        valor_dinheiro: totalDinheiro,
        valor_cheque: totalCheque,
        valor_cartao_credito: totalCartaoC,
        valor_cartao_debito: totalCartaoD,
      })
      setCaixaAberto(false)
      setConfirmando(false)
      setSucesso('✅ Caixa fechado com sucesso!')
      setTimeout(() => setSucesso(''), 2500)
      await carregar()
    } catch (err) {
      console.error('Erro ao fechar caixa:', err)
    } finally {
      setSalvando(false)
    }
  }

  // Monta histórico a partir das vendas reais
  const historico = [
    statusCaixa
      ? {
          tipo: 'abertura',
          hora: statusCaixa.hora_abertura || '--:--',
          descricao: 'Abertura de caixa',
          valor: 0,
        }
      : null,
    ...vendasHoje.map((v) => ({
      tipo: 'venda',
      hora: v.hora_cadastro || '--:--',
      descricao: `Venda #${v.orcamento} — ${v.nome_cliente || 'Consumidor'}`,
      valor: v.valor_total || 0,
    })),
    !caixaAberto && statusCaixa?.hora_fechamento
      ? {
          tipo: 'fechamento',
          hora: statusCaixa.hora_fechamento,
          descricao: 'Fechamento de caixa',
          valor: totalVendas,
        }
      : null,
  ].filter(Boolean)

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        position: 'relative',
      }}
    >
      {sucesso && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#22863A',
            color: 'var(--surface)',
            padding: '9px 22px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 300,
          }}
        >
          {sucesso}
        </div>
      )}

      {/* ── CARDS DO TOPO ── */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: 20,
          borderBottom: '1px solid var(--border-md)',
        }}
      >
        {/* Status */}
        <div
          style={{
            flex: 1,
            background: caixaAberto ? '#EAF6EE' : '#FFF0F0',
            border: `1px solid ${caixaAberto ? '#BBF0CC' : '#FECACA'}`,
            borderRadius: 14,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: caixaAberto ? '#BBF0CC' : '#FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {caixaAberto ? (
              <FolderOpen size={24} style={{ color: '#22863A' }} />
            ) : (
              <X size={24} style={{ color: '#C53030' }} />
            )}
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                color: caixaAberto ? '#22863A' : '#C53030',
                fontWeight: 500,
                marginBottom: 2,
              }}
            >
              STATUS DO CAIXA
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: caixaAberto ? '#155724' : '#9B1C1C',
              }}
            >
              {caixaAberto ? 'Aberto' : 'Fechado'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {caixaAberto ? `Aberto às ${horaAbertura}` : 'Caixa não iniciado'}
            </div>
          </div>
        </div>

        {/* Cards de totais */}
        {[
          {
            label: 'Total vendas',
            value: fmt(totalVendas),
            icon: TrendingUp,
            color: '#22863A',
          },
          {
            label: 'Dinheiro',
            value: fmt(totalDinheiro),
            icon: DollarSign,
            color: '#185FA5',
          },
          {
            label: 'Qtde vendas',
            value: vendasHoje.length,
            icon: TrendingUp,
            color: 'var(--text-muted)',
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              width: 160,
              background: 'var(--gray-50)',
              border: '1px solid var(--border-md)',
              borderRadius: 14,
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <card.icon size={18} style={{ color: card.color }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: card.color }}>
                {card.value}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={carregar}
          style={{
            alignSelf: 'flex-start',
            padding: '8px 10px',
            border: '1px solid var(--border-md)',
            borderRadius: 8,
            color: 'var(--text-muted)',
            marginTop: 4,
          }}
          title='Atualizar'
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* ── FORMAS DE PAGAMENTO ── */}
      {caixaAberto && totalVendas > 0 && (
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-md)',
            display: 'flex',
            gap: 10,
          }}
        >
          {[
            { label: 'Dinheiro', value: totalDinheiro, color: '#22863A' },
            { label: 'Cartão Créd.', value: totalCartaoC, color: '#185FA5' },
            { label: 'Cartão Déb.', value: totalCartaoD, color: '#B7791F' },
            { label: 'Cheque', value: totalCheque, color: 'var(--text-muted)' },
          ]
            .filter((f) => f.value > 0)
            .map((f) => (
              <div
                key={f.label}
                style={{
                  background: 'var(--gray-50)',
                  border: '1px solid var(--border-md)',
                  borderRadius: 8,
                  padding: '8px 14px',
                }}
              >
                <div
                  style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}
                >
                  {f.label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: f.color }}>
                  {fmt(f.value)}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── MOVIMENTAÇÃO ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-muted)',
            marginBottom: 12,
            letterSpacing: '0.03em',
          }}
        >
          MOVIMENTAÇÃO DO DIA
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
            Carregando...
          </div>
        ) : historico.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              padding: 40,
              fontSize: 13,
            }}
          >
            Nenhuma movimentação hoje.
          </div>
        ) : (
          historico.map((h, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border-md)',
                marginBottom: 6,
                background: h.tipo === 'fechamento' ? 'var(--gray-50)' : 'var(--surface)',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background:
                    h.tipo === 'venda'
                      ? '#EBF3FC'
                      : h.tipo === 'abertura'
                        ? '#EAF6EE'
                        : '#F0F4FA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {h.tipo === 'venda' ? (
                  <TrendingUp size={14} style={{ color: '#185FA5' }} />
                ) : h.tipo === 'abertura' ? (
                  <FolderOpen size={14} style={{ color: '#22863A' }} />
                ) : (
                  <X size={14} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  minWidth: 52,
                }}
              >
                <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    fontFamily: 'monospace',
                  }}
                >
                  {h.hora}
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: h.tipo !== 'venda' ? 500 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {h.descricao}
              </div>
              {h.valor > 0 && (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#185FA5',
                    flexShrink: 0,
                  }}
                >
                  {fmt(h.valor)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── RODAPÉ ── */}
      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-md)',
          background: 'var(--gray-50)',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}
      >
        {!caixaAberto ? (
          <>
            <button
              onClick={confirmando ? abrirCaixa : () => setConfirmando(true)}
              disabled={salvando}
              style={{
                height: 38,
                padding: '0 24px',
                background: confirmando ? '#22863A' : '#185FA5',
                color: 'var(--surface)',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <FolderOpen size={16} />
              {salvando
                ? 'Abrindo...'
                : confirmando
                  ? 'Confirmar abertura?'
                  : 'Abrir caixa'}
            </button>
            {confirmando && (
              <button
                onClick={() => setConfirmando(false)}
                style={{
                  height: 38,
                  padding: '0 16px',
                  border: '1px solid var(--border-md)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                Cancelar
              </button>
            )}
          </>
        ) : (
          <>
            <div style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>
              Total do dia:{' '}
              <strong style={{ color: '#185FA5' }}>{fmt(totalVendas)}</strong>{' '}
              em {vendasHoje.length} venda(s)
            </div>
            <button
              onClick={confirmando ? fecharCaixa : () => setConfirmando(true)}
              disabled={salvando}
              style={{
                height: 38,
                padding: '0 24px',
                background: confirmando ? '#C53030' : '#4A5568',
                color: 'var(--surface)',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
              {salvando
                ? 'Fechando...'
                : confirmando
                  ? 'Confirmar fechamento?'
                  : 'Fechar caixa'}
            </button>
            {confirmando && (
              <button
                onClick={() => setConfirmando(false)}
                style={{
                  height: 38,
                  padding: '0 16px',
                  border: '1px solid var(--border-md)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                Cancelar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
