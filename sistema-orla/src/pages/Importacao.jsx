import { useState } from 'react'
import { Upload, Package, Users, CheckCircle, AlertTriangle, FileText } from 'lucide-react'

export default function Importacao() {
  const [tipo, setTipo] = useState('produtos')
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function selecionar() {
    setErro('')
    setResultado(null)
    setLoading(true)
    try {
      const conteudo = await window.api.importar.abrirArquivo()
      if (!conteudo) { setLoading(false); return }

      const res = tipo === 'produtos'
        ? await window.api.importar.produtos(conteudo)
        : await window.api.importar.clientes(conteudo)

      setResultado(res)
    } catch (e) {
      setErro('Erro ao importar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const inseridos   = resultado?.resultados?.filter(r => r.status === 'inserido').length  || 0
  const atualizados = resultado?.resultados?.filter(r => r.status === 'atualizado').length || 0
  const erros       = resultado?.resultados?.filter(r => r.status === 'erro').length       || 0

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24, background: 'var(--bg)' }}>

      {/* Seleção de tipo */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>O que deseja importar?</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[
            { id: 'produtos', label: 'Produtos', icon: Package },
            { id: 'clientes', label: 'Clientes', icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setTipo(id); setResultado(null); setErro('') }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 10,
                border: `2px solid ${tipo === id ? 'var(--blue-700)' : 'var(--border-md)'}`,
                background: tipo === id ? 'var(--blue-50)' : 'var(--surface)',
                color: tipo === id ? 'var(--blue-700)' : 'var(--text-secondary)',
                fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>

        {/* Instruções */}
        <div style={{ background: 'var(--gray-50)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 18px', marginBottom: 18, fontSize: 13, lineHeight: 1.7 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={14} /> Como preparar o arquivo CSV
          </div>
          {tipo === 'produtos' ? (
            <>
              <div>• Formato aceito: <strong>.csv</strong> com separador <strong>ponto-e-vírgula (;)</strong> ou vírgula (,)</div>
              <div>• <strong>Colunas obrigatórias:</strong> <code>codigo</code>, <code>descricao</code></div>
              <div>• Colunas úteis: <code>unidade</code>, <code>preco_venda_vista</code>, <code>preco_venda_prazo</code>, <code>custo_preco_unitario</code>, <code>estoque_atual</code>, <code>estoque_minimo</code>, <code>controla_estoque</code> (S/N)</div>
              <div>• Preços: use ponto ou vírgula — <code>12.50</code> ou <code>12,50</code></div>
              <div>• Se o código já existir no banco, o produto será <strong>atualizado</strong></div>
            </>
          ) : (
            <>
              <div>• Formato aceito: <strong>.csv</strong> com separador <strong>ponto-e-vírgula (;)</strong> ou vírgula (,)</div>
              <div>• <strong>Colunas obrigatórias:</strong> <code>codigo</code>, <code>nome</code></div>
              <div>• Colunas úteis: <code>cpf_cnpj</code>, <code>telefone</code>, <code>celular</code>, <code>cidade</code>, <code>uf</code>, <code>limite_credito</code>, <code>haver</code></div>
              <div>• Se o código já existir no banco, o cliente será <strong>atualizado</strong></div>
            </>
          )}
          <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 12 }}>
            Dica: abra o arquivo template no Excel, preencha os dados e salve como CSV (separado por ponto-e-vírgula).
            <br/>Template: <strong>scripts/{tipo}_template.csv</strong> na pasta do sistema.
          </div>
        </div>

        <button onClick={selecionar} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
            background: loading ? 'var(--border-md)' : 'var(--blue-700)', color: '#fff',
            borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none',
            cursor: loading ? 'wait' : 'pointer' }}>
          <Upload size={16} />
          {loading ? 'Importando...' : `Selecionar arquivo CSV e importar ${tipo}`}
        </button>

        {erro && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: '#C53030', fontSize: 13 }}>
            <AlertTriangle size={14} /> {erro}
          </div>
        )}
      </div>

      {/* Resultado */}
      {resultado && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <CheckCircle size={18} style={{ color: '#38A169' }} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>Importação concluída</span>
          </div>

          {/* Totalizadores */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Inseridos',   value: inseridos,   color: '#22543D', bg: '#F0FFF4' },
              { label: 'Atualizados', value: atualizados, color: '#1A365D', bg: '#EBF8FF' },
              { label: 'Erros',       value: erros,       color: '#C53030', bg: '#FFF5F5' },
            ].map(c => (
              <div key={c.label} style={{ flex: 1, background: c.bg, borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{c.value}</div>
                <div style={{ fontSize: 12, color: c.color, opacity: 0.8 }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Tabela de resultado */}
          <div style={{ maxHeight: 400, overflowY: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Código', tipo === 'produtos' ? 'Descrição' : 'Nome', 'Status', 'Observação'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultado.resultados.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: r.status === 'erro' ? '#FFF5F5' : 'transparent' }}>
                    <td style={{ padding: '7px 12px', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{r.codigo}</td>
                    <td style={{ padding: '7px 12px', fontSize: 13 }}>{r.descricao || r.nome || '—'}</td>
                    <td style={{ padding: '7px 12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500,
                        background: r.status === 'inserido' ? '#F0FFF4' : r.status === 'atualizado' ? '#EBF8FF' : '#FFF5F5',
                        color: r.status === 'inserido' ? '#22543D' : r.status === 'atualizado' ? '#1A365D' : '#C53030',
                      }}>
                        {r.status === 'inserido' ? 'Inserido' : r.status === 'atualizado' ? 'Atualizado' : 'Erro'}
                      </span>
                    </td>
                    <td style={{ padding: '7px 12px', fontSize: 12, color: '#C53030' }}>{r.motivo || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
