import { useState, useEffect } from 'react'
import {
  FolderOpen,
  X,
  Clock,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  Wallet,
} from 'lucide-react'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function ModalMovimento({ tipo, onClose, onConfirm, salvando, erro }) {
  const [valor, setValor] = useState('')
  const [motivo, setMotivo] = useState('')
  const label = tipo === 'SANGRIA' ? 'Sangria (retirada)' : 'Reforço (entrada)'
  const cor = tipo === 'SANGRIA' ? '#C53030' : '#22863A'

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border-md)', width: 380, padding: 22, boxShadow: '0 16px 40px rgba(0,0,0,0.14)' }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: cor }}>{label}</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Valor (R$)</label>
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            type='number'
            min='0'
            step='0.01'
            autoFocus
            style={{ width: '100%', height: 38, padding: '0 12px', fontSize: 15, fontWeight: 500, borderRadius: 8, border: '1px solid var(--border-md)' }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Motivo</label>
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={tipo === 'SANGRIA' ? 'Ex: depósito no banco' : 'Ex: troco inicial extra'}
            style={{ width: '100%', height: 36, padding: '0 12px', fontSize: 13, borderRadius: 8, border: '1px solid var(--border-md)' }}
          />
        </div>
        {erro && (
          <div style={{ marginBottom: 14, padding: '8px 10px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: 12 }}>
            {erro}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-muted)' }}>
            Cancelar
          </button>
          <button
            disabled={!valor || parseFloat(valor) <= 0 || salvando}
            onClick={() => onConfirm(parseFloat(valor), motivo)}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              background: valor && parseFloat(valor) > 0 ? cor : 'var(--border-md)',
              color: valor && parseFloat(valor) > 0 ? '#fff' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: valor && parseFloat(valor) > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            {salvando ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Caixa({ caixaAberto, setCaixaAberto, usuario, onNavigate }) {
  const [confirmando, setConfirmando] = useState(false)
  const [statusCaixa, setStatusCaixa] = useState(null)
  const [resumoSessao, setResumoSessao] = useState(null)
  const [vendasSessao, setVendasSessao] = useState([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [sugestaoAberta, setSugestaoAberta] = useState(false)
  const [modalMovimento, setModalMovimento] = useState(null) // 'SANGRIA' | 'REFORCO' | null
  const [erroMovimento, setErroMovimento] = useState('')
  const [salvandoMovimento, setSalvandoMovimento] = useState(false)

  // ── Carrega status e resumo da sessão atual do banco ──────────
  // O resumo é calculado no servidor a partir das vendas ligadas à sessão de
  // caixa aberta (caixa_sessao_id), não por "vendas de hoje" — a sessão pode
  // ter sido aberta no dia anterior (ex.: abre às 6h, fecha a de ontem antes
  // de vender qualquer coisa hoje).
  async function carregar() {
    setLoading(true)
    try {
      const status = await window.api.caixa.status()
      setStatusCaixa(status)

      if (status?.situacao === 'A') {
        const resumo = await window.api.caixa.resumoAtual()
        setResumoSessao(resumo)

        const vendas = resumo
          ? await window.api.vendas.listar({ caixaSessaoId: resumo.id, situacao: 'N' })
          : []
        setVendasSessao(vendas)
      } else {
        setResumoSessao(null)
        setVendasSessao([])
      }
    } catch (err) {
      console.error('Erro ao carregar caixa:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const totalVendas = resumoSessao?.valorTotal || 0
  const totalDinheiro = resumoSessao?.dinheiro || 0
  const totalCartaoC = resumoSessao?.cartaoCredito || 0
  const totalCartaoD = resumoSessao?.cartaoDebito || 0
  const totalCheque = resumoSessao?.cheque || 0
  const qtdeVendas = resumoSessao?.qtdeVendas || 0
  const dinheiroEsperado = resumoSessao?.dinheiroEsperado ?? totalDinheiro

  async function confirmarMovimento(valor, motivo) {
    if (!modalMovimento) return
    setSalvandoMovimento(true)
    setErroMovimento('')
    try {
      const dados = { valor, motivo, usuario: usuario?.nome || 'sistema' }
      const resultado = await (modalMovimento === 'SANGRIA'
        ? window.api.caixa.sangria(dados)
        : window.api.caixa.reforco(dados))
      if (!resultado.sucesso) {
        setErroMovimento(resultado.erro || 'Erro ao registrar movimento.')
        return
      }
      setModalMovimento(null)
      setSucesso(modalMovimento === 'SANGRIA' ? '✅ Sangria registrada!' : '✅ Reforço registrado!')
      setTimeout(() => setSucesso(''), 2500)
      await carregar()
    } catch (err) {
      console.error('Erro ao registrar movimento de caixa:', err)
      setErroMovimento('Erro ao registrar movimento.')
    } finally {
      setSalvandoMovimento(false)
    }
  }

  const horaAbertura = resumoSessao?.horaAbertura || statusCaixa?.hora_abertura || '--:--'
  const dataAbertura = resumoSessao?.dataAbertura || statusCaixa?.data_abertura

  async function abrirCaixa() {
    setSalvando(true)
    try {
      await window.api.caixa.abrir({
        numero_caixa: '001',
        numero_turno: '1',
        usuario: usuario?.nome || 'sistema',
        valor_abertura: 0,
      })
      setCaixaAberto(true)
      setConfirmando(false)
      setSucesso('✅ Caixa aberto com sucesso!')
      setTimeout(() => setSucesso(''), 2500)
      setSugestaoAberta(true)
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
      const resultado = await window.api.caixa.fechar({ usuario: usuario?.nome || 'sistema' })
      if (!resultado.sucesso) throw new Error(resultado.erro)
      setCaixaAberto(false)
      setConfirmando(false)
      const r = resultado.resumo
      setSucesso(
        r
          ? `✅ Caixa fechado — ${r.qtdeVendas} venda(s), total ${fmt(r.valorTotal)}`
          : '✅ Caixa fechado com sucesso!',
      )
      setTimeout(() => setSucesso(''), 4000)
      await carregar()
    } catch (err) {
      console.error('Erro ao fechar caixa:', err)
      await window.api.dialog.alert(`Não foi possível fechar o caixa: ${err.message}`)
    } finally {
      setSalvando(false)
    }
  }

  // Linha do tempo da sessão aberta: abertura + vendas + sangria/reforço/despesas/vales/recebimentos
  const historico = [
    resumoSessao
      ? { tipo: 'abertura', hora: horaAbertura, descricao: `Abertura de caixa (${dataAbertura?.split('-').reverse().join('/') || ''})`, valor: 0 }
      : null,
    ...vendasSessao.map((v) => ({
      tipo: 'venda',
      hora: v.hora_cadastro || '--:--',
      descricao: `Venda #${v.orcamento} — ${v.nome_cliente || 'Consumidor'}`,
      valor: v.valor_total || 0,
    })),
    ...(resumoSessao?.movimentosExtras || []).map((m) => ({
      tipo: m.tipo.toLowerCase(),
      hora: m.hora || '--:--',
      descricao: m.descricao || m.tipo,
      valor: m.valor || 0,
    })),
  ]
    .filter(Boolean)
    .sort((a, b) => (a.hora > b.hora ? 1 : -1))

  const iconePorTipo = {
    venda: { icon: TrendingUp, bg: '#EBF3FC', color: '#185FA5' },
    abertura: { icon: FolderOpen, bg: '#EAF6EE', color: '#22863A' },
    sangria: { icon: ArrowDownCircle, bg: '#FEF2F2', color: '#C53030' },
    reforco: { icon: ArrowUpCircle, bg: '#EAF6EE', color: '#22863A' },
    despesa: { icon: ArrowDownCircle, bg: '#FEF2F2', color: '#C53030' },
    vale: { icon: Wallet, bg: '#EFF6FF', color: '#1E40AF' },
    receita: { icon: ArrowUpCircle, bg: '#F0FDF4', color: '#15803D' },
    recebimento_cr: { icon: Receipt, bg: '#F0FDF4', color: '#15803D' },
  }

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

      {modalMovimento && (
        <ModalMovimento
          tipo={modalMovimento}
          salvando={salvandoMovimento}
          erro={erroMovimento}
          onClose={() => { setModalMovimento(null); setErroMovimento('') }}
          onConfirm={confirmarMovimento}
        />
      )}

      {sugestaoAberta && caixaAberto && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 350,
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 14,
              border: '1px solid var(--border-md)',
              width: 360,
              padding: 24,
              boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#EAF6EE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <FolderOpen size={24} style={{ color: '#22863A' }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
              Caixa aberto!
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              O que você quer fazer agora?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => { setSugestaoAberta(false); onNavigate?.('vendas') }}
                style={{
                  height: 40,
                  background: '#185FA5',
                  color: '#fff',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Fazer uma venda
              </button>
              <button
                onClick={() => { setSugestaoAberta(false); onNavigate?.('dashboard') }}
                style={{
                  height: 40,
                  background: 'var(--gray-50)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-md)',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Voltar ao início
              </button>
              <button
                onClick={() => setSugestaoAberta(false)}
                style={{
                  height: 32,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Ficar aqui
              </button>
            </div>
          </div>
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
              {caixaAberto
                ? `Aberto às ${horaAbertura}`
                : statusCaixa?.hora_fechamento
                  ? `Fechado às ${statusCaixa.hora_fechamento}`
                  : 'Caixa não iniciado'}
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
            label: 'Dinheiro esperado',
            value: fmt(dinheiroEsperado),
            icon: DollarSign,
            color: '#185FA5',
          },
          {
            label: 'Qtde vendas',
            value: qtdeVendas,
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
          MOVIMENTAÇÃO DA SESSÃO ATUAL
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
            Nenhuma movimentação nesta sessão ainda.
          </div>
        ) : (
          historico.map((h, i) => {
            const cfgIcone = iconePorTipo[h.tipo] || { icon: X, bg: '#F0F4FA', color: 'var(--text-muted)' }
            const IconeTipo = cfgIcone.icon
            return (
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
                background: 'var(--surface)',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: cfgIcone.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconeTipo size={14} style={{ color: cfgIcone.color }} />
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
            )
          })
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
            <button
              onClick={() => setModalMovimento('SANGRIA')}
              style={{
                height: 38,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                border: '1px solid #FCA5A5',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: '#C53030',
                background: 'var(--surface)',
                cursor: 'pointer',
              }}
            >
              <ArrowDownCircle size={14} /> Sangria
            </button>
            <button
              onClick={() => setModalMovimento('REFORCO')}
              style={{
                height: 38,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                border: '1px solid #BBF0CC',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: '#22863A',
                background: 'var(--surface)',
                cursor: 'pointer',
              }}
            >
              <ArrowUpCircle size={14} /> Reforço
            </button>
            <div style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>
              Total da sessão:{' '}
              <strong style={{ color: '#185FA5' }}>{fmt(totalVendas)}</strong>{' '}
              em {qtdeVendas} venda(s)
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
