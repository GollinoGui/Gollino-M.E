import { Construction } from 'lucide-react'

export default function EmBreve({ titulo }) {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12,
      color: 'var(--text-muted)', background: 'var(--surface)',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Construction size={26} style={{ color: 'var(--blue-400)' }} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)' }}>{titulo}</div>
      <div style={{ fontSize: 13 }}>Em desenvolvimento</div>
    </div>
  )
}