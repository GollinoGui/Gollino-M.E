import { useState } from 'react'
import { Trash2 } from 'lucide-react'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Baixa por prejuízo (dívida incobrável) de uma ou mais parcelas de Contas a
// Receber. Quem tem nível >= 2 exclui direto; abaixo disso, vira um pedido de
// aprovação (ver Assistente.jsx / solicitacoes_aprovacao, tipo BAIXA_PREJUIZO_CR).
export default function ModalBaixarPrejuizo({ contas, podeExcluirDireto, onFechar, onConfirmar }) {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const total = contas.reduce((s, c) => s + (c.valor_docto - (c.valor_pagamento || 0)), 0)

  async function confirmar() {
    if (!motivo.trim()) return
    setEnviando(true)
    setErro('')
    try {
      await onConfirmar(motivo.trim())
    } catch (err) {
      setErro(err.message || 'Erro ao processar a baixa por prejuízo.')
      setEnviando(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
      onClick={onFechar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trash2 size={20} style={{ color: '#C53030' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {podeExcluirDireto ? 'Excluir por prejuízo' : 'Solicitar exclusão por prejuízo'}
          </div>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
          {podeExcluirDireto
            ? 'Esta ação marca as parcelas abaixo como dívida incobrável (prejuízo). Elas saem do "em aberto" e o valor entra como perda no relatório diário e no lucro. Não pode ser desfeita.'
            : 'Como você não tem permissão para excluir direto, será enviado um pedido de exclusão por prejuízo para um administrador aprovar. Nada muda até que seja aprovado.'}
        </div>

        <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border-md)', borderRadius: 10, marginBottom: 14 }}>
          {contas.map((c) => (
            <div
              key={c.id}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border-md)', fontSize: 12 }}
            >
              <div>
                <div style={{ fontWeight: 500 }}>{c.nome_cliente || c.codigo_cliente}</div>
                <div style={{ color: 'var(--text-muted)' }}>Doc. {c.nro_docto} · venc. {c.data_vencimento?.split('-').reverse().join('/')}</div>
              </div>
              <div style={{ fontWeight: 600, color: '#C53030', whiteSpace: 'nowrap', marginLeft: 8 }}>
                {fmt(c.valor_docto - (c.valor_pagamento || 0))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          <span>Total ({contas.length} parcela{contas.length !== 1 ? 's' : ''})</span>
          <span style={{ color: '#C53030' }}>{fmt(total)}</span>
        </div>

        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
          Motivo (obrigatório)
        </label>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          autoFocus
          rows={3}
          placeholder='Ex: cliente sumiu, dívida de mais de 1 ano, sem retorno após cobranças...'
          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', marginBottom: erro ? 8 : 16 }}
        />
        {erro && (
          <div style={{ fontSize: 12, color: '#C53030', marginBottom: 14 }}>{erro}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={confirmar}
            disabled={!motivo.trim() || enviando}
            style={{
              width: '100%', height: 38, borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: motivo.trim() && !enviando ? 'pointer' : 'not-allowed',
              background: '#C53030', color: '#fff', border: 'none',
              opacity: motivo.trim() && !enviando ? 1 : 0.5,
            }}
          >
            {enviando
              ? 'Processando...'
              : podeExcluirDireto
                ? 'Confirmar exclusão'
                : 'Enviar pedido de aprovação'}
          </button>
          <button
            onClick={onFechar}
            disabled={enviando}
            style={{ width: '100%', height: 38, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)', border: 'none' }}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
