import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import ModalRelatorioCaixa from './ModalRelatorioCaixa'
import { montarHistoricoSessao } from '../utils/caixaHistorico'

// Exibido quando o usuário tenta fechar o app (X da janela / Alt+F4) com o
// caixa ainda aberto — ver main.js ('close' interceptado) e App.jsx. Avisa,
// mas não bloqueia: o usuário pode fechar o caixa agora (e ver o relatório
// detalhado de fechamento antes de sair) ou sair mesmo assim.
export default function ModalConfirmarSaida({ usuario, onCancelar, onCaixaFechado }) {
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [relatorioFechamento, setRelatorioFechamento] = useState(null)

  async function fecharCaixaESair() {
    setProcessando(true)
    setErro('')
    try {
      const resumoAntes = await window.api.caixa.resumoAtual()
      const vendas = resumoAntes
        ? await window.api.vendas.listar({ caixaSessaoId: resumoAntes.id, situacao: 'N' }).catch(() => [])
        : []
      const snapshotHistorico = montarHistoricoSessao(resumoAntes, vendas)

      const resultado = await window.api.caixa.fechar({ usuario: usuario?.nome || 'sistema' })
      if (!resultado.sucesso) {
        setErro(resultado.erro || 'Erro ao fechar o caixa.')
        return
      }
      onCaixaFechado?.()
      setRelatorioFechamento({
        resumo: {
          ...resumoAntes,
          ...resultado.resumo,
          usuarioFechamento: usuario?.nome || 'sistema',
          dataFechamento: new Date().toISOString().slice(0, 10),
          horaFechamento: new Date().toTimeString().slice(0, 8),
        },
        historico: snapshotHistorico,
      })
    } catch (err) {
      console.error('Erro ao fechar caixa antes de sair:', err)
      setErro('Erro ao fechar o caixa.')
    } finally {
      setProcessando(false)
    }
  }

  if (relatorioFechamento) {
    return (
      <ModalRelatorioCaixa
        resumo={relatorioFechamento.resumo}
        historico={relatorioFechamento.historico}
        onFechar={() => window.api.app.confirmarSaida()}
      />
    )
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
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: 28,
          width: 400,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--amber-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} style={{ color: 'var(--amber-500)' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Caixa ainda está aberto</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
          O caixa não foi fechado. Deseja fechar antes de sair, ou sair mesmo assim?
        </div>

        {erro && (
          <div
            style={{
              marginBottom: 14,
              padding: '8px 10px',
              borderRadius: 8,
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#B91C1C',
              fontSize: 12,
            }}
          >
            {erro}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={fecharCaixaESair}
            disabled={processando}
            autoFocus
            style={{
              width: '100%',
              height: 38,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: processando ? 'default' : 'pointer',
              background: 'var(--blue-700)',
              color: '#fff',
              border: 'none',
            }}
          >
            {processando ? 'Fechando caixa...' : 'Fechar caixa e sair'}
          </button>
          <button
            onClick={() => window.api.app.confirmarSaida()}
            disabled={processando}
            style={{
              width: '100%',
              height: 38,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: processando ? 'default' : 'pointer',
              background: '#C53030',
              color: '#fff',
              border: 'none',
            }}
          >
            Sair mesmo assim
          </button>
          <button
            onClick={onCancelar}
            disabled={processando}
            style={{
              width: '100%',
              height: 38,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: processando ? 'default' : 'pointer',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: 'none',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
