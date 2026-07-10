import { useState } from 'react'
import { Banknote, Coins, RotateCcw } from 'lucide-react'

const fmt = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const CEDULAS = [200, 100, 50, 20, 10, 5, 2]
const MOEDAS = [1, 0.5, 0.25, 0.1, 0.05]

export default function ContadorDinheiro() {
  const [qtds, setQtds] = useState({})

  function setQtd(valor, texto) {
    const n = Math.max(0, parseInt(texto, 10) || 0)
    setQtds((prev) => ({ ...prev, [valor]: n }))
  }

  function limpar() {
    setQtds({})
  }

  const total = [...CEDULAS, ...MOEDAS].reduce(
    (s, v) => s + v * (qtds[v] || 0),
    0,
  )

  function Linha({ valor, tipo }) {
    const qtd = qtds[valor] || 0
    const subtotal = valor * qtd
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid var(--border-md)',
          marginBottom: 6,
          background: qtd > 0 ? 'var(--blue-50)' : 'var(--surface)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            flexShrink: 0,
            background: tipo === 'cedula' ? '#EAF6EE' : '#FFF7E6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {tipo === 'cedula' ? (
            <Banknote size={16} style={{ color: '#22863A' }} />
          ) : (
            <Coins size={16} style={{ color: '#B7791F' }} />
          )}
        </div>
        <div style={{ width: 90, fontSize: 14, fontWeight: 600 }}>{fmt(valor)}</div>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>×</span>
        <input
          type='number'
          min='0'
          step='1'
          value={qtd || ''}
          onChange={(e) => setQtd(valor, e.target.value)}
          placeholder='0'
          style={{
            width: 80,
            height: 34,
            padding: '0 10px',
            borderRadius: 8,
            border: '1px solid var(--border-md)',
            fontSize: 14,
            textAlign: 'center',
          }}
        />
        <div style={{ flex: 1, textAlign: 'right', fontSize: 14, fontWeight: 600, color: qtd > 0 ? 'var(--blue-700)' : 'var(--text-muted)' }}>
          {fmt(subtotal)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24, background: 'var(--bg)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Contador de dinheiro</div>
          <button
            onClick={limpar}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              border: '1px solid var(--border-md)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-secondary)',
              background: 'var(--surface)',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={13} /> Limpar
          </button>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.03em' }}>CÉDULAS</div>
          {CEDULAS.map((v) => (
            <Linha key={v} valor={v} tipo='cedula' />
          ))}
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', margin: '16px 0 10px', letterSpacing: '0.03em' }}>MOEDAS</div>
          {MOEDAS.map((v) => (
            <Linha key={v} valor={v} tipo='moeda' />
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderRadius: 12,
            background: 'var(--blue-700)',
            color: '#fff',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500 }}>Total contado</span>
          <span style={{ fontSize: 24, fontWeight: 700 }}>{fmt(total)}</span>
        </div>
      </div>
    </div>
  )
}
