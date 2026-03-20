import { useState } from 'react'
import { FolderOpen, X, Clock, DollarSign, TrendingUp } from 'lucide-react'

const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Caixa({ caixaAberto, setCaixaAberto }) {
  const [confirmando, setConfirmando] = useState(false)
  const [historico, setHistorico] = useState([
    { tipo: 'abertura', hora: '08:05', descricao: 'Abertura de caixa', valor: 0, saldo: 0 },
    { tipo: 'venda', hora: '09:22', descricao: 'Venda #00001520', valor: 187.00, saldo: 187.00 },
    { tipo: 'venda', hora: '10:14', descricao: 'Venda #00001521', valor: 419.50, saldo: 606.50 },
    { tipo: 'venda', hora: '11:45', descricao: 'Venda #00001522', valor: 56.80, saldo: 663.30 },
  ])

  const totalVendas = historico.filter(h => h.tipo === 'venda').reduce((s, h) => s + h.valor, 0)

  function abrirCaixa() {
    setHistorico([{ tipo: 'abertura', hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), descricao: 'Abertura de caixa', valor: 0, saldo: 0 }])
    setCaixaAberto(true)
    setConfirmando(false)
  }

  function fecharCaixa() {
    setHistorico(prev => [...prev, { tipo: 'fechamento', hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), descricao: 'Fechamento de caixa', valor: totalVendas, saldo: totalVendas }])
    setCaixaAberto(false)
    setConfirmando(false)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ display: 'flex', gap: 16, padding: 20, borderBottom: '1px solid var(--border)' }}>
        <div style={{
          flex: 1, background: caixaAberto ? 'var(--green-50)' : 'var(--red-50)',
          border: `1px solid ${caixaAberto ? 'var(--green-100)' : 'var(--red-100)'}`,
          borderRadius: 'var(--radius-lg)', padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: caixaAberto ? 'var(--green-100)' : 'var(--red-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {caixaAberto
              ? <FolderOpen size={24} style={{ color: 'var(--green-500)' }} />
              : <X size={24} style={{ color: 'var(--red-500)' }} />}
          </div>
          <div>
            <div style={{ fontSize: 12, color: caixaAberto ? 'var(--green-500)' : 'var(--red-500)', fontWeight: 500, marginBottom: 2 }}>STATUS DO CAIXA</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: caixaAberto ? 'var(--green-700)' : 'var(--red-700)' }}>
              {caixaAberto ? 'Aberto' : 'Fechado'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {caixaAberto ? `Aberto às ${historico[0]?.hora}` : 'Caixa não iniciado'}
            </div>
          </div>
        </div>

        {[
          { label: 'Saldo em caixa', value: fmt(totalVendas), icon: DollarSign, color: 'var(--blue-700)' },
          { label: 'Total vendas', value: fmt(totalVendas), icon: TrendingUp, color: 'var(--green-500)' },
          { label: 'Qtde vendas', value: historico.filter(h => h.tipo === 'venda').length, icon: TrendingUp, color: 'var(--text-secondary)' },
        ].map(card => (
          <div key={card.label} style={{
            width: 160, background: 'var(--gray-50)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px 18px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <card.icon size={18} style={{ color: card.color }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{card.label}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: card.color }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 12 }}>MOVIMENTAÇÃO DO CAIXA</div>
        {historico.map((h, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
            marginBottom: 6, background: h.tipo === 'fechamento' ? 'var(--gray-50)' : '#fff',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: h.tipo === 'venda' ? 'var(--blue-50)' : h.tipo === 'abertura' ? 'var(--green-50)' : 'var(--gray-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {h.tipo === 'venda'
                ? <TrendingUp size={14} style={{ color: 'var(--blue-600)' }} />
                : h.tipo === 'abertura'
                ? <FolderOpen size={14} style={{ color: 'var(--green-500)' }} />
                : <X size={14} style={{ color: 'var(--text-muted)' }} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 50 }}>
              <Clock size={11} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{h.hora}</span>
            </div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: h.tipo !== 'venda' ? 500 : 400 }}>{h.descricao}</div>
            {h.valor > 0 && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue-700)' }}>{fmt(h.valor)}</div>}
            <div style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 80, textAlign: 'right' }}>saldo: {fmt(h.saldo)}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--gray-50)', display: 'flex', gap: 10, alignItems: 'center' }}>
        {!caixaAberto ? (
          <>
            <button onClick={confirmando ? abrirCaixa : () => setConfirmando(true)} style={{
              height: 38, padding: '0 24px', background: confirmando ? 'var(--green-500)' : 'var(--blue-700)',
              color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <FolderOpen size={16} />
              {confirmando ? 'Confirmar abertura?' : 'Abrir caixa'}
            </button>
            {confirmando && (
              <button onClick={() => setConfirmando(false)} style={{ height: 38, padding: '0 16px', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-secondary)' }}>
                Cancelar
              </button>
            )}
          </>
        ) : (
          <>
            <div style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>
              Ao fechar o caixa, todas as movimentações do dia serão registradas.
            </div>
            <button onClick={confirmando ? fecharCaixa : () => setConfirmando(true)} style={{
              height: 38, padding: '0 24px',
              background: confirmando ? 'var(--red-500)' : 'var(--gray-600)',
              color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <X size={16} />
              {confirmando ? 'Confirmar fechamento?' : 'Fechar caixa'}
            </button>
            {confirmando && (
              <button onClick={() => setConfirmando(false)} style={{ height: 38, padding: '0 16px', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-secondary)' }}>
                Cancelar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}