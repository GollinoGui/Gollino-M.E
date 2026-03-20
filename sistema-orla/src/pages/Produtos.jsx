import { useState } from 'react'
import { Search, Plus, Edit2, Package } from 'lucide-react'
import { produtos as dadosIniciais } from '../data/mock'
import DetalhesProduto from './DetalhesProduto'

const fmt = (v) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function EstoqueBadge({ qtd }) {
  const style = {
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    display: 'inline-block',
  }
  if (qtd === 0)
    return (
      <span
        style={{
          ...style,
          background: 'var(--red-50)',
          color: 'var(--red-500)',
        }}
      >
        Sem estoque
      </span>
    )
  if (qtd <= 5)
    return (
      <span
        style={{
          ...style,
          background: 'var(--amber-50)',
          color: 'var(--amber-500)',
        }}
      >
        Baixo: {qtd}
      </span>
    )
  return (
    <span
      style={{
        ...style,
        background: 'var(--green-50)',
        color: 'var(--green-500)',
      }}
    >
      {qtd} un.
    </span>
  )
}

export default function Produtos() {
  const [produtos, setProdutos] = useState(dadosIniciais)
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState(null)
  const [novo, setNovo] = useState(false)
  const [produtoDetalhes, setProdutoDetalhes] = useState(null)
  const formVazio = {
    codigo: '',
    descricao: '',
    preco_vista: '',
    preco_prazo: '',
    un: 'pc',
    estoque: '',
    estoque_minimo: '0',
    ncm: '',
    cfop: '5102',
    icms: '12',
    pis: '0.65',
    cofins: '3',
    cest: '',
  }
  const [form, setForm] = useState(formVazio)
  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const filtrados = produtos.filter(
    (p) =>
      p.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigo.includes(busca),
  )

  function abrirEditar(p) {
    setForm({
      ...p,
      preco_vista: p.preco_vista.toFixed(2),
      preco_prazo: p.preco_prazo.toFixed(2),
    })
    setEditando(p.id)
    setNovo(false)
  }
  function abrirNovo() {
    setForm({
      ...formVazio,
      codigo: String(produtos.length + 1).padStart(8, '0'),
    })
    setNovo(true)
    setEditando(null)
  }
  function fechar() {
    setEditando(null)
    setNovo(false)
  }

  function salvar() {
    const prod = {
      ...form,
      id: form.codigo,
      preco_vista: parseFloat(form.preco_vista) || 0,
      preco_prazo: parseFloat(form.preco_prazo) || 0,
      estoque: parseFloat(form.estoque) || 0,
      estoque_minimo: parseFloat(form.estoque_minimo) || 0,
      condicional: 0,
    }
    if (novo) setProdutos((prev) => [...prev, prod])
    else
      setProdutos((prev) =>
        prev.map((p) => (p.id === editando ? { ...prod, id: editando } : p)),
      )
    fechar()
  }

  const showForm = editando || novo
  if (produtoDetalhes) {
    return (
      <DetalhesProduto
        produto={produtoDetalhes}
        onVoltar={() => setProdutoDetalhes(null)}
      />
    )
  }
  return (
    <div style={{ height: '100%', display: 'flex', background: '#fff' }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: showForm ? '1px solid var(--border)' : 'none',
        }}
      >
        <div
          style={{
            padding: '14px 14px 10px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: 8,
          }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder='Buscar por descrição ou código...'
              style={{ width: '100%', height: 34, paddingLeft: 32 }}
            />
          </div>
          <button
            onClick={abrirNovo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 34,
              padding: '0 14px',
              background: 'var(--blue-700)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <Plus size={14} /> Novo (Ctrl+N)
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              <col style={{ width: 92 }} />
              <col />
              <col style={{ width: 86 }} />
              <col style={{ width: 86 }} />
              <col style={{ width: 44 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 70 }} />
            </colgroup>
            <thead>
              <tr>
                {[
                  'Código',
                  'Descrição',
                  'Preço vista',
                  'Preço prazo',
                  'UN',
                  'Estoque',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 10px',
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                      background: 'var(--gray-50)',
                      borderBottom: '1px solid var(--border)',
                      position: 'sticky',
                      top: 0,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr
                  key={p.id}
                  onDoubleClick={() => abrirEditar(p)}
                  style={{
                    cursor: 'pointer',
                    background:
                      editando === p.id ? 'var(--blue-50)' : 'transparent',
                    transition: 'background 0.08s',
                  }}
                  onMouseEnter={(e) => {
                    if (editando !== p.id)
                      e.currentTarget.style.background = 'var(--gray-50)'
                  }}
                  onMouseLeave={(e) => {
                    if (editando !== p.id)
                      e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {p.codigo}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 13,
                      fontWeight: 500,
                      borderBottom: '1px solid var(--border)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          background: 'var(--blue-50)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Package
                          size={12}
                          style={{ color: 'var(--blue-600)' }}
                        />
                      </div>
                      {p.descricao}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 13,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {fmt(p.preco_vista)}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {fmt(p.preco_prazo)}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {p.un}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <EstoqueBadge qtd={p.estoque} />
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'right',
                    }}
                  >
                    <button
                      onClick={() => setProdutoDetalhes(p)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--blue-200)',
                        fontSize: 12,
                        color: 'var(--blue-700)',
                        marginRight: 6,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'var(--blue-50)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      Ver detalhes
                    </button>
                    <button
                      onClick={() => abrirEditar(p)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-md)',
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'var(--blue-50)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      <Edit2 size={11} /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          style={{
            padding: '8px 14px',
            background: 'var(--gray-50)',
            borderTop: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          {filtrados.length} produto(s)
        </div>
      </div>

      {showForm && (
        <div
          style={{
            width: 400,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            style={{
              padding: '14px 16px 12px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--gray-50)',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--text-secondary)',
              }}
            >
              {novo ? 'NOVO PRODUTO' : 'EDITAR PRODUTO'}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {form.descricao || 'Sem descrição'}
            </div>
          </div>
          <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              {[
                { key: 'codigo', label: 'Código', readOnly: true, col: 1 },
                { key: 'un', label: 'UN', col: 1 },
                { key: 'descricao', label: 'Descrição *', col: 2 },
                {
                  key: 'preco_vista',
                  label: 'Preço vista (R$)',
                  col: 1,
                  type: 'number',
                },
                {
                  key: 'preco_prazo',
                  label: 'Preço prazo (R$)',
                  col: 1,
                  type: 'number',
                },
                {
                  key: 'estoque',
                  label: 'Estoque atual',
                  col: 1,
                  type: 'number',
                },
                {
                  key: 'estoque_minimo',
                  label: 'Estoque mínimo',
                  col: 1,
                  type: 'number',
                },
              ].map((c) => (
                <div
                  key={c.key}
                  style={{ gridColumn: c.col === 2 ? '1 / -1' : undefined }}
                >
                  <label
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      display: 'block',
                      marginBottom: 3,
                    }}
                  >
                    {c.label}
                  </label>
                  <input
                    value={form[c.key] || ''}
                    onChange={f(c.key)}
                    type={c.type || 'text'}
                    readOnly={c.readOnly}
                    style={{
                      width: '100%',
                      height: 34,
                      padding: '0 10px',
                      background: c.readOnly ? 'var(--gray-50)' : undefined,
                    }}
                  />
                </div>
              ))}
              <div
                style={{
                  gridColumn: '1 / -1',
                  borderTop: '1px solid var(--border)',
                  paddingTop: 10,
                  marginTop: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    marginBottom: 8,
                  }}
                >
                  DADOS FISCAIS
                </div>
              </div>
              {[
                { key: 'ncm', label: 'NCM' },
                { key: 'cfop', label: 'CFOP' },
                { key: 'icms', label: 'ICMS %', type: 'number' },
                { key: 'pis', label: 'PIS %', type: 'number' },
                { key: 'cofins', label: 'COFINS %', type: 'number' },
                { key: 'cest', label: 'CEST' },
              ].map((c) => (
                <div key={c.key}>
                  <label
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      display: 'block',
                      marginBottom: 3,
                    }}
                  >
                    {c.label}
                  </label>
                  <input
                    value={form[c.key] || ''}
                    onChange={f(c.key)}
                    type={c.type || 'text'}
                    style={{ width: '100%', height: 34, padding: '0 10px' }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: 8,
            }}
          >
            <button
              onClick={fechar}
              style={{
                flex: 1,
                height: 36,
                border: '1px solid var(--border-md)',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={salvar}
              style={{
                flex: 2,
                height: 36,
                background: 'var(--blue-700)',
                color: '#fff',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Salvar (Ctrl+S)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
