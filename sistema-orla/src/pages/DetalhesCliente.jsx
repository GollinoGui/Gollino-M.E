import { useState } from 'react'
import {
  ArrowLeft,
  User,
  ShoppingCart,
  Wallet,
  TrendingUp,
  Edit2,
  Save,
  X,
} from 'lucide-react'
import { contasReceber } from '../data/mock'

const fmt = (v) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-'

const historicoVendas = [
  {
    id: '00001492',
    data: '2024-01-15',
    valor: 129.3,
    forma: 'Convênio',
    itens: 3,
    status: 'PAGO',
  },
  {
    id: '00001480',
    data: '2024-01-02',
    valor: 87.5,
    forma: 'Dinheiro',
    itens: 2,
    status: 'PAGO',
  },
  {
    id: '00001465',
    data: '2023-12-20',
    valor: 320.0,
    forma: 'Convênio',
    itens: 5,
    status: 'PAGO',
  },
  {
    id: '00001440',
    data: '2023-12-05',
    valor: 56.8,
    forma: 'Dinheiro',
    itens: 1,
    status: 'PAGO',
  },
]

export default function DetalhesCliente({ cliente, onVoltar }) {
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ ...cliente })
  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const contasCliente = contasReceber.filter((c) => c.cliente_id === cliente.id)
  const totalEmAberto = contasCliente
    .filter((c) => c.situacao === 'ABERTO')
    .reduce((s, c) => s + c.em_aberto, 0)
  const totalComprado = historicoVendas.reduce((s, v) => s + v.valor, 0)
  const haver = 35.6

  const abas = ['Dados', 'Histórico de compras', 'Contas a receber', 'Haver']
  const [abaAtiva, setAbaAtiva] = useState('Dados')

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid var(--border)',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          height: 52,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onVoltar}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--text-secondary)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-md)',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'var(--gray-50)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = 'transparent')
          }
        >
          <ArrowLeft size={14} /> Voltar
        </button>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--blue-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={16} style={{ color: 'var(--blue-600)' }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{cliente.nome}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Código: {cliente.codigo}{' '}
              {cliente.cpf_cnpj && `· ${cliente.cpf_cnpj}`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editando ? (
            <>
              <button
                onClick={() => setEditando(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 34,
                  padding: '0 14px',
                  border: '1px solid var(--border-md)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                }}
              >
                <X size={14} /> Cancelar
              </button>
              <button
                onClick={() => setEditando(false)}
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
                <Save size={14} /> Salvar
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditando(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 34,
                padding: '0 14px',
                border: '1px solid var(--border-md)',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'var(--gray-50)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              <Edit2 size={14} /> Editar
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          padding: '16px 20px',
          background: '#fff',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {[
          {
            label: 'Total comprado',
            value: fmt(totalComprado),
            icon: ShoppingCart,
            color: 'var(--blue-700)',
            bg: 'var(--blue-50)',
          },
          {
            label: 'Em aberto',
            value: fmt(totalEmAberto),
            icon: Wallet,
            color: 'var(--amber-500)',
            bg: 'var(--amber-50)',
          },
          {
            label: 'Haver disponível',
            value: fmt(haver),
            icon: TrendingUp,
            color: 'var(--green-500)',
            bg: 'var(--green-50)',
          },
          {
            label: 'Compras',
            value: historicoVendas.length,
            icon: ShoppingCart,
            color: 'var(--gray-600)',
            bg: 'var(--gray-100)',
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: card.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <card.icon size={16} style={{ color: card.color }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginBottom: 2,
                }}
              >
                {card.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: card.color }}>
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid var(--border)',
          padding: '0 20px',
          display: 'flex',
          flexShrink: 0,
        }}
      >
        {abas.map((aba) => (
          <button
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: abaAtiva === aba ? 500 : 400,
              color:
                abaAtiva === aba ? 'var(--blue-700)' : 'var(--text-secondary)',
              borderBottom:
                abaAtiva === aba
                  ? '2px solid var(--blue-700)'
                  : '2px solid transparent',
              marginBottom: -1,
              transition: 'all 0.12s',
              whiteSpace: 'nowrap',
            }}
          >
            {aba}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {abaAtiva === 'Dados' && (
          <div
            style={{
              maxWidth: 800,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {[
              {
                titulo: 'INFORMAÇÕES PESSOAIS',
                campos: [
                  { key: 'nome', label: 'Nome / Razão social', col: 2 },
                  { key: 'cpf_cnpj', label: 'CPF / CNPJ', col: 1 },
                  { key: 'telefone', label: 'Telefone', col: 1 },
                  { key: 'email', label: 'E-mail', col: 2 },
                ],
              },
              {
                titulo: 'ENDEREÇO',
                campos: [
                  { key: 'cep', label: 'CEP', col: 1 },
                  { key: 'endereco', label: 'Logradouro', col: 1 },
                  { key: 'numero', label: 'Número', col: 1 },
                  { key: 'complemento', label: 'Complemento', col: 1 },
                  { key: 'bairro', label: 'Bairro', col: 1 },
                  { key: 'cidade', label: 'Cidade', col: 1 },
                ],
              },
              {
                titulo: 'DADOS FISCAIS',
                campos: [
                  { key: 'ie', label: 'Inscrição Estadual', col: 1 },
                  { key: 'contribuinte', label: 'Contribuinte ICMS', col: 1 },
                ],
              },
              {
                titulo: 'OBSERVAÇÕES',
                campos: [
                  {
                    key: 'obs',
                    label: 'Observações internas',
                    col: 2,
                    textarea: true,
                  },
                ],
              },
            ].map((secao) => (
              <div
                key={secao.titulo}
                style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    marginBottom: 14,
                  }}
                >
                  {secao.titulo}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}
                >
                  {secao.campos.map((campo) => (
                    <div
                      key={campo.key}
                      style={{
                        gridColumn: campo.col === 2 ? '1 / -1' : undefined,
                      }}
                    >
                      <label
                        style={{
                          fontSize: 11,
                          color: 'var(--text-secondary)',
                          display: 'block',
                          marginBottom: 4,
                        }}
                      >
                        {campo.label}
                      </label>
                      {editando ? (
                        campo.textarea ? (
                          <textarea
                            value={form[campo.key] || ''}
                            onChange={f(campo.key)}
                            style={{
                              width: '100%',
                              height: 80,
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-md)',
                              fontFamily: 'inherit',
                              fontSize: 13,
                              resize: 'vertical',
                            }}
                          />
                        ) : (
                          <input
                            value={form[campo.key] || ''}
                            onChange={f(campo.key)}
                            style={{
                              width: '100%',
                              height: 34,
                              padding: '0 10px',
                            }}
                          />
                        )
                      ) : (
                        <div
                          style={{
                            fontSize: 13,
                            color: form[campo.key]
                              ? 'var(--text-primary)'
                              : 'var(--text-muted)',
                            padding: '8px 0',
                            borderBottom: '1px solid var(--border)',
                            minHeight: 34,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {form[campo.key] || '—'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {abaAtiva === 'Histórico de compras' && (
          <div style={{ maxWidth: 800 }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: '#fff',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--border)',
              }}
            >
              <thead>
                <tr>
                  {[
                    'Nº Venda',
                    'Data',
                    'Itens',
                    'Forma',
                    'Valor',
                    'Status',
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        textAlign: 'left',
                        background: 'var(--gray-50)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historicoVendas.map((v) => (
                  <tr
                    key={v.id}
                    style={{ transition: 'background 0.08s' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--gray-50)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <td
                      style={{
                        padding: '10px 16px',
                        fontSize: 12,
                        fontFamily: 'monospace',
                        color: 'var(--text-muted)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {v.id}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        fontSize: 13,
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {fmtDate(v.data)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border)',
                        textAlign: 'center',
                      }}
                    >
                      {v.itens}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <span
                        style={{
                          background: 'var(--gray-100)',
                          color: 'var(--gray-600)',
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontSize: 11,
                        }}
                      >
                        {v.forma}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--blue-700)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {fmt(v.valor)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <span
                        style={{
                          background: 'var(--green-50)',
                          color: 'var(--green-700)',
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Pago
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '10px 16px',
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      background: 'var(--gray-50)',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    Total comprado
                  </td>
                  <td
                    style={{
                      padding: '10px 16px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--blue-700)',
                      background: 'var(--gray-50)',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    {fmt(totalComprado)}
                  </td>
                  <td
                    style={{
                      background: 'var(--gray-50)',
                      borderTop: '1px solid var(--border)',
                    }}
                  ></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {abaAtiva === 'Contas a receber' && (
          <div style={{ maxWidth: 800 }}>
            {contasCliente.length === 0 ? (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 40,
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                }}
              >
                Nenhuma conta a receber para este cliente
              </div>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  background: '#fff',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                }}
              >
                <thead>
                  <tr>
                    {[
                      'Documento',
                      'Seq',
                      'Vencimento',
                      'Valor',
                      'Em aberto',
                      'Situação',
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 16px',
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'var(--text-secondary)',
                          textAlign: 'left',
                          background: 'var(--gray-50)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contasCliente.map((c) => {
                    const vencido =
                      c.situacao === 'ABERTO' &&
                      new Date(c.vencimento) < new Date()
                    return (
                      <tr
                        key={c.id}
                        style={{
                          background: vencido ? 'var(--red-50)' : 'transparent',
                          transition: 'background 0.08s',
                        }}
                      >
                        <td
                          style={{
                            padding: '10px 16px',
                            fontSize: 12,
                            fontFamily: 'monospace',
                            color: 'var(--text-muted)',
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          {c.documento}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          {c.seq}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            fontSize: 12,
                            borderBottom: '1px solid var(--border)',
                            color: vencido ? 'var(--red-500)' : undefined,
                            fontWeight: vencido ? 500 : 400,
                          }}
                        >
                          {fmtDate(c.vencimento)}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            fontSize: 13,
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          {fmt(c.valor_docto)}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            fontSize: 13,
                            fontWeight: 600,
                            color:
                              c.em_aberto > 0
                                ? 'var(--blue-700)'
                                : 'var(--text-muted)',
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          {fmt(c.em_aberto)}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          <span
                            style={{
                              background:
                                c.situacao === 'BAIXADO'
                                  ? 'var(--green-50)'
                                  : vencido
                                    ? 'var(--red-50)'
                                    : 'var(--blue-50)',
                              color:
                                c.situacao === 'BAIXADO'
                                  ? 'var(--green-700)'
                                  : vencido
                                    ? 'var(--red-500)'
                                    : 'var(--blue-800)',
                              padding: '2px 9px',
                              borderRadius: 10,
                              fontSize: 11,
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {c.situacao === 'BAIXADO'
                              ? 'Baixado'
                              : vencido
                                ? 'Vencido'
                                : 'Aberto'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {abaAtiva === 'Haver' && (
          <div
            style={{
              maxWidth: 800,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div
              style={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginBottom: 4,
                    }}
                  >
                    SALDO DE HAVER DISPONÍVEL
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: 'var(--green-500)',
                    }}
                  >
                    {fmt(haver)}
                  </div>
                </div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'var(--green-50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp size={24} style={{ color: 'var(--green-500)' }} />
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                }}
              >
                O haver é gerado automaticamente quando o cliente realiza uma
                devolução. Pode ser usado como desconto em uma nova venda ou
                para abater parcelas em aberto.
              </div>
            </div>

            <div
              style={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Histórico de haver
              </div>
              {[
                {
                  data: '2024-01-15',
                  descricao: 'Devolução — Bermuda (Venda #00001492)',
                  valor: +35.6,
                  tipo: 'CREDITO',
                },
                {
                  data: '2024-01-20',
                  descricao: 'Uso em venda #00001495',
                  valor: -35.6,
                  tipo: 'DEBITO',
                },
                {
                  data: '2024-01-28',
                  descricao: 'Devolução — Camiseta (Venda #00001500)',
                  valor: +35.6,
                  tipo: 'CREDITO',
                },
              ].map((h, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {h.descricao}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                      }}
                    >
                      {fmtDate(h.data)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color:
                        h.tipo === 'CREDITO'
                          ? 'var(--green-500)'
                          : 'var(--red-500)',
                    }}
                  >
                    {h.tipo === 'CREDITO' ? '+' : ''}
                    {fmt(h.valor)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
