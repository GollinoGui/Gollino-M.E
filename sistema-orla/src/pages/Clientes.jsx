import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Edit2,
  User,
  Loader2,
  AlertCircle,
  Trash2,
  X,
  Eye,
} from 'lucide-react'

// ── Máscaras ──────────────────────────────────────────────────
function maskCPF(v) {
  return v
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}
function maskCNPJ(v) {
  return v
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}
function maskCEP(v) {
  return v
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, '$1-$2')
}
function maskFone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10)
    return d
      .replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
      .trim()
      .replace(/-$/, '')
  return d
    .replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
    .trim()
    .replace(/-$/, '')
}
function maskMoney(v) {
  const n = v.replace(/\D/g, '')
  if (!n) return ''
  return (parseInt(n) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
  })
}
function parseMoney(v) {
  return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0
}

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState(null)
  const [novo, setNovo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [clienteDetalhes, setClienteDetalhes] = useState(null)
  const [modalExcluir, setModalExcluir] = useState(null)
  const [senhaExcluir, setSenhaExcluir] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  const [excluindo, setExcluindo] = useState(false)

  const formVazio = {
    codigo: '',
    nome: '',
    nome_fantasia: '',
    cgc: '',
    cpf: '',
    ie: '',
    telefone: '',
    celular: '',
    email: '',
    endereco: '',
    numero: '',
    bairro: '',
    cep: '',
    observacao: '',
    codigo_situacao_cliente: 'A',
    haver: '',
    limite_credito: '',
  }
  const [form, setForm] = useState(formVazio)

  const carregar = useCallback(async () => {
    try {
      setCarregando(true)
      setErro(null)
      const dados = await window.api.clientes.listar({ busca })
      setClientes(dados || [])
    } catch (e) {
      setErro('Erro ao carregar clientes: ' + e.message)
    } finally {
      setCarregando(false)
    }
  }, [busca])

  useEffect(() => {
    const timer = setTimeout(carregar, 300)
    return () => clearTimeout(timer)
  }, [carregar])

  async function proximoCodigo() {
    const todos = await window.api.clientes.listar({})
    const maxCod = todos.reduce((max, c) => {
      const n = parseInt(c.codigo) || 0
      return n > max ? n : max
    }, 0)
    return String(maxCod + 1).padStart(6, '0')
  }

  function abrirEditar(c) {
    setForm({
      ...formVazio,
      ...c,
      haver: c.haver
        ? (parseFloat(c.haver) || 0).toFixed(2).replace('.', ',')
        : '',
      limite_credito: c.limite_credito
        ? (parseFloat(c.limite_credito) || 0).toFixed(2).replace('.', ',')
        : '',
    })
    setEditando(c.codigo)
    setNovo(false)
    setClienteDetalhes(null)
  }

  async function abrirNovo() {
    const codigo = await proximoCodigo()
    setForm({ ...formVazio, codigo })
    setNovo(true)
    setEditando(null)
    setClienteDetalhes(null)
  }

  function fechar() {
    setEditando(null)
    setNovo(false)
    setForm(formVazio)
  }

  async function salvar() {
    if (!form.nome.trim()) {
      alert('Nome é obrigatório!')
      return
    }
    try {
      setSalvando(true)
      await window.api.clientes.salvar({
        ...form,
        haver: parseMoney(form.haver),
        limite_credito: parseMoney(form.limite_credito),
      })
      await carregar()
      fechar()
    } catch (e) {
      alert('Erro ao salvar: ' + e.message)
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarExcluir() {
    setErroSenha('')
    if (!senhaExcluir) {
      setErroSenha('Digite a senha para confirmar.')
      return
    }
    try {
      setExcluindo(true)
      // Exclusão exige senha de um administrador/gerente — não aceita a
      // própria senha do operador logado (nível 1), só admin/elter (nível 2+).
      let ok = false
      for (const usr of ['ELTER', 'admin']) {
        const res = await window.api.auth.login({
          usuario: usr,
          senha: senhaExcluir,
        })
        if (res.sucesso) {
          ok = true
          break
        }
      }
      if (!ok) {
        setErroSenha('Senha incorreta ou sem permissão de administrador!')
        setExcluindo(false)
        return
      }
      await window.api.clientes.excluir(modalExcluir.codigo)
      setModalExcluir(null)
      setSenhaExcluir('')
      if (clienteDetalhes?.codigo === modalExcluir.codigo)
        setClienteDetalhes(null)
      if (editando === modalExcluir.codigo) fechar()
      await carregar()
    } catch (e) {
      setErroSenha('Erro ao excluir: ' + e.message)
    } finally {
      setExcluindo(false)
    }
  }

  function documento(c) {
    return c.cgc || c.cpf || '-'
  }

  function badgeSituacao(sit) {
    const ativo = sit === 'A'
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 99,
          fontSize: 11,
          fontWeight: 500,
          background: ativo ? '#f0fdf4' : 'var(--gray-100)',
          color: ativo ? '#15803d' : 'var(--text-muted)',
        }}
      >
        {ativo ? 'Ativo' : 'Inativo'}
      </span>
    )
  }

  const showForm = editando || novo

  // ── Vista com detalhes ─────────────────────────────────────
  if (clienteDetalhes) {
    return (
      <div style={{ height: '100%', display: 'flex', background: 'var(--surface)' }}>
        {/* Lista lateral */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              padding: '10px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              gap: 6,
            }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={12}
                style={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder='Buscar...'
                style={{
                  width: '100%',
                  height: 30,
                  paddingLeft: 26,
                  fontSize: 12,
                }}
              />
            </div>
            <button
              onClick={abrirNovo}
              style={{
                height: 30,
                width: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--blue-700)',
                color: 'var(--surface)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <Plus size={13} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {clientes.map((c) => (
              <div
                key={c.codigo}
                onClick={() => setClienteDetalhes(c)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  background:
                    clienteDetalhes?.codigo === c.codigo
                      ? 'var(--blue-50)'
                      : 'transparent',
                  borderLeft:
                    clienteDetalhes?.codigo === c.codigo
                      ? '3px solid var(--blue-600)'
                      : '3px solid transparent',
                  transition: 'background 0.08s',
                }}
                onMouseEnter={(e) => {
                  if (clienteDetalhes?.codigo !== c.codigo)
                    e.currentTarget.style.background = 'var(--gray-50)'
                }}
                onMouseLeave={(e) => {
                  if (clienteDetalhes?.codigo !== c.codigo)
                    e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600 }}>{c.nome}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginTop: 1,
                    fontFamily: 'monospace',
                  }}
                >
                  #{c.codigo}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              padding: '6px 10px',
              background: 'var(--gray-50)',
              borderTop: '1px solid var(--border)',
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            {clientes.length} cliente(s)
          </div>
        </div>

        {/* Detalhes centralizados */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: '12px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--gray-50)',
            }}
          >
            <button
              onClick={() => setClienteDetalhes(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-md)',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 10px',
              }}
            >
              <X size={12} /> Fechar
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {clienteDetalhes.nome}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontFamily: 'monospace',
                }}
              >
                #{clienteDetalhes.codigo} · {documento(clienteDetalhes)}
              </div>
            </div>
            <button
              onClick={() => abrirEditar(clienteDetalhes)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-md)',
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}
            >
              <Edit2 size={12} /> Editar
            </button>
            <button
              onClick={() => {
                setModalExcluir(clienteDetalhes)
                setSenhaExcluir('')
                setErroSenha('')
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #fecaca',
                fontSize: 12,
                color: '#dc2626',
                background: '#fef2f2',
              }}
            >
              <Trash2 size={12} /> Excluir
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div
              style={{
                maxWidth: 680,
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3,1fr)',
                  gap: 12,
                }}
              >
                {[
                  {
                    label: 'Situação',
                    value:
                      clienteDetalhes.codigo_situacao_cliente === 'A'
                        ? 'Ativo'
                        : 'Inativo',
                  },
                  {
                    label: 'Haver disponível',
                    value: `R$ ${(parseFloat(clienteDetalhes.haver) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  },
                  {
                    label: 'Limite de crédito',
                    value: `R$ ${(parseFloat(clienteDetalhes.limite_credito) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    style={{
                      padding: '12px 14px',
                      background: 'var(--gray-50)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginBottom: 3,
                      }}
                    >
                      {card.label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>

              <Secao titulo='Dados Pessoais'>
                <Grade>
                  <DadoItem
                    label='Nome / Razão Social'
                    value={clienteDetalhes.nome}
                    col={2}
                  />
                  <DadoItem
                    label='Nome Fantasia'
                    value={clienteDetalhes.nome_fantasia}
                    col={2}
                  />
                  <DadoItem label='CPF' value={clienteDetalhes.cpf} />
                  <DadoItem label='CNPJ' value={clienteDetalhes.cgc} />
                  <DadoItem
                    label='Inscrição Estadual'
                    value={clienteDetalhes.ie}
                  />
                  <DadoItem label='E-mail' value={clienteDetalhes.email} />
                  <DadoItem label='Telefone' value={clienteDetalhes.telefone} />
                  <DadoItem label='Celular' value={clienteDetalhes.celular} />
                </Grade>
              </Secao>

              <Secao titulo='Endereço'>
                <Grade>
                  <DadoItem label='CEP' value={clienteDetalhes.cep} />
                  <DadoItem
                    label='Endereço'
                    value={clienteDetalhes.endereco}
                    col={2}
                  />
                  <DadoItem label='Número' value={clienteDetalhes.numero} />
                  <DadoItem label='Bairro' value={clienteDetalhes.bairro} />
                </Grade>
              </Secao>

              {clienteDetalhes.observacao && (
                <Secao titulo='Observação'>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                    {clienteDetalhes.observacao}
                  </p>
                </Secao>
              )}
            </div>
          </div>
        </div>

        {showForm && (
          <FormularioCliente
            form={form}
            setForm={setForm}
            novo={novo}
            salvando={salvando}
            onSalvar={salvar}
            onFechar={fechar}
          />
        )}

        {modalExcluir && (
          <ModalExcluir
            cliente={modalExcluir}
            senha={senhaExcluir}
            setSenha={setSenhaExcluir}
            erro={erroSenha}
            excluindo={excluindo}
            onConfirmar={confirmarExcluir}
            onFechar={() => {
              setModalExcluir(null)
              setSenhaExcluir('')
              setErroSenha('')
            }}
          />
        )}

        <style>{estilos}</style>
      </div>
    )
  }

  // ── Vista lista normal ─────────────────────────────────────
  return (
    <div style={{ height: '100%', display: 'flex', background: 'var(--surface)' }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: showForm ? '1px solid var(--border)' : 'none',
          minWidth: 0,
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
              color: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <Plus size={14} /> Novo (Ctrl+N)
          </button>
        </div>

        {erro && (
          <div
            style={{
              margin: 12,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: '#dc2626',
            }}
          >
            <AlertCircle size={15} /> {erro}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          {carregando ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 200,
                gap: 10,
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              <Loader2
                size={18}
                style={{ animation: 'spin 1s linear infinite' }}
              />
              Carregando clientes...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    'Código',
                    'Nome',
                    'CPF / CNPJ',
                    'Telefone',
                    'Situação',
                    '',
                  ].map((h) => (
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
                        zIndex: 1,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: 40,
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: 13,
                      }}
                    >
                      {busca
                        ? 'Nenhum cliente encontrado.'
                        : 'Nenhum cliente cadastrado ainda.'}
                    </td>
                  </tr>
                ) : (
                  clientes.map((c) => (
                    <tr
                      key={c.codigo}
                      style={{
                        cursor: 'pointer',
                        background:
                          editando === c.codigo
                            ? 'var(--blue-50)'
                            : 'transparent',
                        transition: 'background 0.08s',
                      }}
                      onMouseEnter={(e) => {
                        if (editando !== c.codigo)
                          e.currentTarget.style.background = 'var(--gray-50)'
                      }}
                      onMouseLeave={(e) => {
                        if (editando !== c.codigo)
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
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
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
                            <User
                              size={13}
                              style={{ color: 'var(--blue-600)' }}
                            />
                          </div>
                          <div>
                            <div>{c.nome}</div>
                            {c.nome_fantasia && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: 'var(--text-muted)',
                                  fontWeight: 400,
                                }}
                              >
                                {c.nome_fantasia}
                              </div>
                            )}
                          </div>
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
                        {documento(c)}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {c.celular || c.telefone || '-'}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {badgeSituacao(c.codigo_situacao_cliente)}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid var(--border)',
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
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
                            (e.currentTarget.style.background =
                              'var(--blue-50)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = 'transparent')
                          }
                        >
                          <Eye size={11} /> Ver detalhes
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
                            marginRight: 6,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              'var(--blue-50)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = 'transparent')
                          }
                        >
                          <Edit2 size={11} /> Editar
                        </button>
                        <button
                          onClick={() => {
                            setModalExcluir(c)
                            setSenhaExcluir('')
                            setErroSenha('')
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid #fecaca',
                            fontSize: 12,
                            color: '#dc2626',
                            background: '#fef2f2',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = '#fee2e2')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = '#fef2f2')
                          }
                        >
                          <Trash2 size={11} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div
          style={{
            padding: '8px 14px',
            background: 'var(--gray-50)',
            borderTop: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>
            {clientes.length} cliente(s)
            {busca ? ` — filtrando por "${busca}"` : ''}
          </span>
          {busca && (
            <button
              onClick={() => setBusca('')}
              style={{
                fontSize: 12,
                color: 'var(--blue-600)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Limpar filtro
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <FormularioCliente
          form={form}
          setForm={setForm}
          novo={novo}
          salvando={salvando}
          onSalvar={salvar}
          onFechar={fechar}
        />
      )}

      {modalExcluir && (
        <ModalExcluir
          cliente={modalExcluir}
          senha={senhaExcluir}
          setSenha={setSenhaExcluir}
          erro={erroSenha}
          excluindo={excluindo}
          onConfirmar={confirmarExcluir}
          onFechar={() => {
            setModalExcluir(null)
            setSenhaExcluir('')
            setErroSenha('')
          }}
        />
      )}

      <style>{estilos}</style>
    </div>
  )
}

// ── Formulário lateral ─────────────────────────────────────────
function FormularioCliente({
  form,
  setForm,
  novo,
  salvando,
  onSalvar,
  onFechar,
}) {
  function campo(key, val) {
    setForm((p) => ({ ...p, [key]: val }))
  }
  return (
    <div
      style={{
        width: 400,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.15s ease',
        borderLeft: '1px solid var(--border)',
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
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginTop: 2,
            fontFamily: 'monospace',
          }}
        >
          #{form.codigo}
        </div>
      </div>
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
        >
          <Campo label='Código' col={1}>
            <input
              value={form.codigo}
              readOnly
              style={{
                width: '100%',
                height: 34,
                padding: '0 10px',
                background: 'var(--gray-50)',
              }}
            />
          </Campo>
          <Campo label='Situação' col={1}>
            <select
              value={form.codigo_situacao_cliente}
              onChange={(e) => campo('codigo_situacao_cliente', e.target.value)}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            >
              <option value='A'>Ativo</option>
              <option value='I'>Inativo</option>
            </select>
          </Campo>
          <Campo label='Nome / Razão Social *' col={2}>
            <input
              value={form.nome}
              onChange={(e) => campo('nome', e.target.value.toUpperCase())}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </Campo>
          <Campo label='Nome Fantasia' col={2}>
            <input
              value={form.nome_fantasia || ''}
              onChange={(e) =>
                campo('nome_fantasia', e.target.value.toUpperCase())
              }
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </Campo>
          <Campo label='CPF' col={1}>
            <input
              value={form.cpf || ''}
              placeholder='000.000.000-00'
              onChange={(e) => campo('cpf', maskCPF(e.target.value))}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </Campo>
          <Campo label='CNPJ' col={1}>
            <input
              value={form.cgc || ''}
              placeholder='00.000.000/0000-00'
              onChange={(e) => campo('cgc', maskCNPJ(e.target.value))}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </Campo>
          <Campo label='Inscrição Estadual' col={1}>
            <input
              value={form.ie || ''}
              placeholder='Isento'
              onChange={(e) => campo('ie', e.target.value)}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </Campo>
          <Campo label='CEP' col={1}>
            <input
              value={form.cep || ''}
              placeholder='00000-000'
              onChange={(e) => campo('cep', maskCEP(e.target.value))}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </Campo>
          <Campo label='Endereço' col={2}>
            <input
              value={form.endereco || ''}
              onChange={(e) => campo('endereco', e.target.value.toUpperCase())}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </Campo>
          <Campo label='Número' col={1}>
            <input
              value={form.numero || ''}
              onChange={(e) => campo('numero', e.target.value)}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </Campo>
          <Campo label='Bairro' col={1}>
            <input
              value={form.bairro || ''}
              onChange={(e) => campo('bairro', e.target.value.toUpperCase())}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </Campo>
          <Campo label='Telefone' col={1}>
            <input
              value={form.telefone || ''}
              placeholder='(16) 00000-0000'
              onChange={(e) => campo('telefone', maskFone(e.target.value))}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </Campo>
          <Campo label='Celular' col={1}>
            <input
              value={form.celular || ''}
              placeholder='(16) 00000-0000'
              onChange={(e) => campo('celular', maskFone(e.target.value))}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </Campo>
          <Campo label='E-mail' col={2}>
            <input
              value={form.email || ''}
              type='email'
              onChange={(e) => campo('email', e.target.value)}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </Campo>
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
              FINANCEIRO
            </div>
          </div>
          <Campo label='Haver (R$)' col={1}>
            <input
              value={form.haver || ''}
              placeholder='0,00'
              onChange={(e) => campo('haver', maskMoney(e.target.value))}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </Campo>
          <Campo label='Limite de Crédito (R$)' col={1}>
            <input
              value={form.limite_credito || ''}
              placeholder='0,00'
              onChange={(e) =>
                campo('limite_credito', maskMoney(e.target.value))
              }
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </Campo>
          <Campo label='Observação' col={2}>
            <textarea
              value={form.observacao || ''}
              onChange={(e) => campo('observacao', e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px 10px', resize: 'vertical' }}
            />
          </Campo>
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
          onClick={onFechar}
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
          onClick={onSalvar}
          disabled={salvando}
          style={{
            flex: 2,
            height: 36,
            background: salvando ? 'var(--gray-400)' : 'var(--blue-700)',
            color: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {salvando ? (
            <>
              <Loader2
                size={14}
                style={{ animation: 'spin 1s linear infinite' }}
              />{' '}
              Salvando...
            </>
          ) : (
            'Salvar (Ctrl+S)'
          )}
        </button>
      </div>
    </div>
  )
}

// ── Modal Excluir ──────────────────────────────────────────────
function ModalExcluir({
  cliente,
  senha,
  setSenha,
  erro,
  excluindo,
  onConfirmar,
  onFechar,
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: 28,
          width: 400,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          animation: 'fadeIn 0.15s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Trash2 size={20} style={{ color: '#dc2626' }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Excluir cliente</div>
            <div
              style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}
            >
              Esta ação não pode ser desfeita.
            </div>
          </div>
        </div>
        <div
          style={{
            padding: '12px 14px',
            background: '#fef2f2',
            borderRadius: 8,
            border: '1px solid #fecaca',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600 }}>{cliente.nome}</div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
            }}
          >
            #{cliente.codigo}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Digite a senha de um administrador para confirmar:
          </label>
          <input
            type='password'
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onConfirmar()}
            placeholder='Senha do administrador'
            autoFocus
            style={{
              width: '100%',
              height: 38,
              padding: '0 12px',
              border: erro ? '1px solid #dc2626' : '1px solid var(--border-md)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
            }}
          />
          {erro && (
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
              {erro}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onFechar}
            style={{
              flex: 1,
              height: 38,
              border: '1px solid var(--border-md)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={excluindo}
            style={{
              flex: 1,
              height: 38,
              background: excluindo ? '#fca5a5' : '#dc2626',
              color: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {excluindo ? (
              <>
                <Loader2
                  size={13}
                  style={{ animation: 'spin 1s linear infinite' }}
                />{' '}
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 size={13} /> Excluir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────
function Secao({ titulo, children }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '8px 14px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--gray-50)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          letterSpacing: '0.05em',
        }}
      >
        {titulo.toUpperCase()}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  )
}
function Grade({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {children}
    </div>
  )
}
function DadoItem({ label, value, col }) {
  return (
    <div style={{ gridColumn: col === 2 ? '1 / -1' : undefined }}>
      <div
        style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          fontWeight: value ? 500 : 400,
        }}
      >
        {value || '—'}
      </div>
    </div>
  )
}
function Campo({ label, col, children }) {
  return (
    <div style={{ gridColumn: col === 2 ? '1 / -1' : undefined }}>
      <label
        style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          display: 'block',
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

const estilos = `
  @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
  @keyframes fadeIn { from { opacity: 0; transform: translateX(10px) } to { opacity: 1; transform: translateX(0) } }
`
