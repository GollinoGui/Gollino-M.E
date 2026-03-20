import { useState } from 'react'
import { Search, Plus, Edit2, User } from 'lucide-react'
import { clientes as dadosIniciais } from '../data/mock'
import DetalhesCliente from './DetalhesCliente'

export default function Clientes() {
  const [clientes, setClientes] = useState(dadosIniciais)
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState(null)
  const [novo, setNovo] = useState(false)
  const [clienteDetalhes, setClienteDetalhes] = useState(null)

  const formVazio = {
    codigo: '',
    nome: '',
    cpf_cnpj: '',
    telefone: '',
    email: '',
    cidade: '',
  }
  const [form, setForm] = useState(formVazio)

  const filtrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (c.cpf_cnpj && c.cpf_cnpj.includes(busca)) ||
      c.codigo.includes(busca),
  )

  function abrirEditar(c) {
    setForm({ ...c })
    setEditando(c.id)
    setNovo(false)
  }
  function abrirNovo() {
    setForm({
      ...formVazio,
      codigo: String(clientes.length + 1).padStart(6, '0'),
    })
    setNovo(true)
    setEditando(null)
  }
  function fechar() {
    setEditando(null)
    setNovo(false)
  }
  function salvar() {
    if (novo) setClientes((prev) => [...prev, { ...form, id: form.codigo }])
    else
      setClientes((prev) =>
        prev.map((c) => (c.id === editando ? { ...form, id: editando } : c)),
      )
    fechar()
  }

  const showForm = editando || novo

  if (clienteDetalhes) {
    return (
      <DetalhesCliente
        cliente={clienteDetalhes}
        onVoltar={() => setClienteDetalhes(null)}
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
              placeholder='Buscar por nome, CPF/CNPJ ou código...'
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
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Código', 'Nome', 'CPF / CNPJ', 'Telefone', 'Cidade', ''].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 12px',
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
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr
                  key={c.id}
                  style={{
                    cursor: 'pointer',
                    background:
                      editando === c.id ? 'var(--blue-50)' : 'transparent',
                    transition: 'background 0.08s',
                  }}
                  onMouseEnter={(e) => {
                    if (editando !== c.id)
                      e.currentTarget.style.background = 'var(--gray-50)'
                  }}
                  onMouseLeave={(e) => {
                    if (editando !== c.id)
                      e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <td
                    style={{
                      padding: '10px 12px',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {c.codigo}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      fontSize: 13,
                      fontWeight: 500,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'var(--blue-50)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <User size={13} style={{ color: 'var(--blue-600)' }} />
                      </div>
                      {c.nome}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {c.cpf_cnpj || '-'}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {c.telefone || '-'}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {c.cidade || '-'}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'right',
                    }}
                  >
                    <button
                      onClick={() => setClienteDetalhes(c)}
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
                      onClick={() => abrirEditar(c)}
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
          {filtrados.length} cliente(s)
        </div>
      </div>

      {showForm && (
        <div
          style={{
            width: 380,
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
              {novo ? 'NOVO CLIENTE' : 'EDITAR CLIENTE'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, marginTop: 2 }}>
              {form.nome || 'Sem nome'}
            </div>
          </div>
          <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              {[
                { key: 'codigo', label: 'Código', readOnly: true, col: 1 },
                { key: 'nome', label: 'Nome / Razão social *', col: 2 },
                { key: 'cpf_cnpj', label: 'CPF / CNPJ', col: 1 },
                { key: 'telefone', label: 'Telefone', col: 1 },
                { key: 'email', label: 'E-mail', col: 2 },
                { key: 'cidade', label: 'Cidade / Estado', col: 2 },
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
                      marginBottom: 4,
                    }}
                  >
                    {c.label}
                  </label>
                  <input
                    value={form[c.key] || ''}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [c.key]: e.target.value }))
                    }
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
                  paddingTop: 12,
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
              <div style={{ gridColumn: '1 / -1' }}>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Inscrição Estadual
                </label>
                <input
                  style={{ width: '100%', height: 34, padding: '0 10px' }}
                  placeholder='Isento'
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Endereço completo
                </label>
                <input
                  style={{ width: '100%', height: 34, padding: '0 10px' }}
                />
              </div>
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
