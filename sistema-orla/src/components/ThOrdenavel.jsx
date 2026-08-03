import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

// Cabeçalho de coluna clicável: 1º clique ordena crescente, 2º clique decrescente.
export default function ThOrdenavel({ label, chave, colunaAtual, direcao, onOrdenar, style }) {
  const ativo = colunaAtual === chave
  return (
    <th
      onClick={() => onOrdenar(chave)}
      style={{ ...style, cursor: 'pointer', userSelect: 'none' }}
      title="Clique para ordenar"
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        {label}
        {ativo ? (
          direcao === 'asc' ? (
            <ChevronUp size={11} />
          ) : (
            <ChevronDown size={11} />
          )
        ) : (
          <ChevronsUpDown size={11} style={{ opacity: 0.35 }} />
        )}
      </span>
    </th>
  )
}
