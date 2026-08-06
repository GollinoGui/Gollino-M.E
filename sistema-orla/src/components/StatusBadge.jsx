import { STATUS_CFG } from '../utils/statusContas'

export default function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.ABERTO
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: '2px 9px',
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {s.label}
    </span>
  )
}
