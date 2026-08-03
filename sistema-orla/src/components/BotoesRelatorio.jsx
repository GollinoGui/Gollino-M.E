import { useState } from 'react'
import { Download, FileText } from 'lucide-react'

const btnBase = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  height: 30,
  padding: '0 12px',
  border: '1px solid var(--border-md)',
  borderRadius: 'var(--radius-md)',
  fontSize: 12,
  color: 'var(--text-secondary)',
  background: 'var(--surface)',
  cursor: 'pointer',
}

export function BotaoExportarExcel({ onClick, label = 'Exportar Excel' }) {
  return (
    <button
      onClick={onClick}
      style={btnBase}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
    >
      <Download size={12} /> {label}
    </button>
  )
}

// Botão "Gerar Relatório" (PDF): recebe uma função async que monta o HTML e
// chama o processo principal pra imprimir/salvar. Mostra erro inline se falhar.
export function BotaoGerarRelatorioPDF({ onGerar, label = 'Gerar Relatório' }) {
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleClick() {
    setGerando(true)
    setErro('')
    try {
      await onGerar()
    } catch (err) {
      console.error('Erro ao gerar relatório:', err)
      setErro(err.message || 'Erro ao gerar relatório.')
      setTimeout(() => setErro(''), 4000)
    } finally {
      setGerando(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleClick}
        disabled={gerando}
        style={{ ...btnBase, cursor: gerando ? 'default' : 'pointer' }}
        onMouseEnter={(e) => !gerando && (e.currentTarget.style.background = 'var(--gray-50)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
      >
        <FileText size={12} /> {gerando ? 'Gerando…' : label}
      </button>
      {erro && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            zIndex: 20,
            background: '#C53030',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: 11,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
          }}
        >
          {erro}
        </div>
      )}
    </div>
  )
}

export function BotoesRelatorio({ onExportarExcel, onGerarPDF }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <BotaoExportarExcel onClick={onExportarExcel} />
      <BotaoGerarRelatorioPDF onGerar={onGerarPDF} />
    </div>
  )
}
