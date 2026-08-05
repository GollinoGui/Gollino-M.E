import { useState, useRef, useEffect } from 'react'
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react'

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

const itemBase = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '8px 12px',
  border: 'none',
  background: 'transparent',
  fontSize: 12,
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  textAlign: 'left',
}

// Botão isolado, só Excel — usado em listagens que ainda não têm versão em PDF.
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

// Botão único "Gerar Relatório": abre um dropdown com as opções PDF e Excel.
// PDF chama onGerarPDF (async, monta HTML e manda pro processo principal
// imprimir/salvar); Excel chama onExportarExcel (síncrono, gera o .xlsx/.csv).
export function BotaoGerarRelatorio({
  onExportarExcel,
  onGerarPDF,
  label = 'Gerar Relatório',
  abrirParaCima = false,
}) {
  const [aberto, setAberto] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!aberto) return
    function handleClickFora(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [aberto])

  async function escolherPdf() {
    setAberto(false)
    setGerando(true)
    setErro('')
    try {
      await onGerarPDF()
    } catch (err) {
      console.error('Erro ao gerar relatório:', err)
      setErro(err.message || 'Erro ao gerar relatório.')
      setTimeout(() => setErro(''), 4000)
    } finally {
      setGerando(false)
    }
  }

  function escolherExcel() {
    setAberto(false)
    onExportarExcel()
  }

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        onClick={() => setAberto((v) => !v)}
        disabled={gerando}
        style={{ ...btnBase, cursor: gerando ? 'default' : 'pointer' }}
        onMouseEnter={(e) => !gerando && (e.currentTarget.style.background = 'var(--gray-50)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
      >
        <Download size={12} /> {gerando ? 'Gerando…' : label} <ChevronDown size={12} />
      </button>
      {aberto && (
        <div
          style={{
            position: 'absolute',
            ...(abrirParaCima ? { bottom: '110%' } : { top: '110%' }),
            right: 0,
            zIndex: 20,
            minWidth: 160,
            background: 'var(--surface)',
            border: '1px solid var(--border-md)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={escolherPdf}
            style={itemBase}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <FileText size={14} /> PDF
          </button>
          <button
            onClick={escolherExcel}
            style={itemBase}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <FileSpreadsheet size={14} /> Excel (CSV)
          </button>
        </div>
      )}
      {erro && (
        <div
          style={{
            position: 'absolute',
            ...(abrirParaCima ? { bottom: '110%' } : { top: '110%' }),
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

export function BotoesRelatorio({ onExportarExcel, onGerarPDF, abrirParaCima }) {
  return (
    <BotaoGerarRelatorio
      onExportarExcel={onExportarExcel}
      onGerarPDF={onGerarPDF}
      abrirParaCima={abrirParaCima}
    />
  )
}
