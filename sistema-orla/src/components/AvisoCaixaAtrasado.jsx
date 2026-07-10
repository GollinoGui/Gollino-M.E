import { useState, useEffect } from 'react'
import { AlertTriangle, FolderOpen } from 'lucide-react'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtData = (d) => (d ? d.split('-').reverse().join('/') : '')

// Modal bloqueante exibido ao abrir o sistema quando existe uma sessão de
// caixa aberta em um dia anterior (esquecida sem fechar). Não pode ser
// dispensado — só sai da tela fechando o caixa atrasado.
export default function AvisoCaixaAtrasado({ status, usuario, onFechado }) {
  const [resumo, setResumo] = useState(null)
  const [fechando, setFechando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    window.api.caixa.resumoAtual().then(setResumo).catch(() => {})
  }, [])

  async function fechar() {
    setFechando(true)
    setErro('')
    try {
      const resultado = await window.api.caixa.fechar({ usuario: usuario?.nome || 'sistema' })
      if (!resultado.sucesso) {
        setErro(resultado.erro || 'Erro ao fechar o caixa.')
        return
      }
      onFechado(resultado.resumo)
    } catch (err) {
      console.error('Erro ao fechar caixa atrasado:', err)
      setErro('Erro ao fechar o caixa.')
    } finally {
      setFechando(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,20,20,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          border: '1px solid var(--border-md)',
          width: 440,
          padding: 28,
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--amber-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} style={{ color: 'var(--amber-500)' }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Caixa do dia anterior ficou aberto
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
              O caixa aberto em {fmtData(status?.data_abertura)} não foi fechado. Feche-o
              antes de continuar para poder abrir o caixa de hoje.
            </div>
          </div>
        </div>

        {resumo && (
          <div
            style={{
              background: 'var(--gray-50)',
              border: '1px solid var(--border-md)',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 18,
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            {resumo.qtdeVendas || 0} venda(s) naquela sessão — total {fmt(resumo.valorTotal)}
          </div>
        )}

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

        <button
          onClick={fechar}
          disabled={fechando}
          style={{
            width: '100%',
            height: 42,
            background: '#C53030',
            color: '#fff',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: fechando ? 'default' : 'pointer',
          }}
        >
          {fechando ? (
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          ) : (
            <FolderOpen size={16} />
          )}
          {fechando ? 'Fechando...' : `Fechar caixa de ${fmtData(status?.data_abertura)}`}
        </button>
      </div>
    </div>
  )
}
