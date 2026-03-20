import { useState } from 'react'
import { Search, Filter, DollarSign } from 'lucide-react'
import { contasReceber, clientes } from '../data/mock'

const fmt = (v) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-'

function StatusBadge({ status }) {
  const cfg = {
    ABERTO: { bg: 'var(--blue-50)', color: 'var(--blue-800)', label: 'Aberto' },
    BAIXADO: {
      bg: 'var(--green-50)',
      color: 'var(--green-700)',
      label: 'Baixado',
    },
    VENCIDO: { bg: 'var(--red-50)', color: 'var(--red-500)', label: 'Vencido' },
  }
  const s = cfg[status] || cfg.ABERTO
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

function ModalReceber({ conta, onClose, onConfirm }) {
  const [forma, setForma] = useState(null)
  const [valor, setValor] = useState(conta.em_aberto.toFixed(2))

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-md)',
          width: 400,
          boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
          animation: 'fadeIn 0.15s ease both',
          overflow: 'hidden',
        }}
      >
        <div style={{ background: 'var(--blue-700)', padding: '16px 20px' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
            {conta.cliente_nome}
          </div>
          <div
            style={{
              color: '#fff',
              fontSize: 22,
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            {fmt(conta.em_aberto)}
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 11,
              marginTop: 2,
            }}
          >
            Vencimento: {fmtDate(conta.vencimento)}
          </div>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              FORMA DE PAGAMENTO
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {['Dinheiro', 'Cartão', 'Cheque', 'Haver', 'Conta'].map((f) => (
                <button
                  key={f}
                  onClick={() => setForma(f)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    border:
                      forma === f
                        ? '2px solid var(--blue-600)'
                        : '1px solid var(--border-md)',
                    background: forma === f ? 'var(--blue-50)' : '#fff',
                    color:
                      forma === f ? 'var(--blue-800)' : 'var(--text-primary)',
                    fontWeight: forma === f ? 500 : 400,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {forma && (
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Valor recebido
              </label>
              <input
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                type='number'
                style={{
                  width: '100%',
                  height: 38,
                  padding: '0 12px',
                  fontSize: 15,
                  fontWeight: 500,
                }}
                autoFocus
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-md)',
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              Cancelar
            </button>
            <button
              disabled={!forma}
              onClick={() => onConfirm(conta.id, forma, parseFloat(valor))}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-md)',
                background: forma ? 'var(--blue-700)' : 'var(--gray-200)',
                color: forma ? '#fff' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: 500,
                cursor: forma ? 'pointer' : 'not-allowed',
              }}
            >
              Finalizar (F5)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContasReceber() {
  const [dados, setDados] = useState(contasReceber)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [selecionadas, setSelecionadas] = useState([])
  const [contaRecebendo, setContaRecebendo] = useState(null)
  const [sucesso, setSucesso] = useState(false)

  const filtrados = dados.filter((c) => {
    const matchBusca =
      c.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.documento.includes(busca)
    const matchStatus =
      filtroStatus === 'todos' || c.situacao === filtroStatus.toUpperCase()
    return matchBusca && matchStatus
  })

  const totalEmAberto = filtrados
    .filter((c) => c.situacao === 'ABERTO')
    .reduce((s, c) => s + c.em_aberto, 0)
  const totalPago = filtrados
    .filter((c) => c.situacao === 'BAIXADO')
    .reduce((s, c) => s + c.valor_pago, 0)
  const totalDocto = filtrados.reduce((s, c) => s + c.valor_docto, 0)

  function toggleSel(id) {
    setSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  function confirmarRecebimento(id, forma, valor) {
    setDados((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, situacao: 'BAIXADO', valor_pago: valor, em_aberto: 0 }
          : c,
      ),
    )
    setContaRecebendo(null)
    setSucesso(true)
    setTimeout(() => setSucesso(false), 2000)
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        position: 'relative',
      }}
    >
      {sucesso && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--green-500)',
            color: '#fff',
            padding: '9px 22px',
            borderRadius: 'var(--radius-lg)',
            fontSize: 13,
            fontWeight: 500,
            zIndex: 300,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          Parcela recebida com sucesso!
        </div>
      )}

      {contaRecebendo && (
        <ModalReceber
          conta={contaRecebendo}
          onClose={() => setContaRecebendo(null)}
          onConfirm={confirmarRecebimento}
        />
      )}

      <div
        style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
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
              placeholder='Buscar por cliente ou documento...'
              style={{ width: '100%', height: 34, paddingLeft: 32 }}
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            style={{
              height: 34,
              padding: '0 10px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <option value='todos'>Todos</option>
            <option value='aberto'>Aberto</option>
            <option value='baixado'>Baixado</option>
          </select>
          <button
            style={{
              height: 34,
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid var(--border-md)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}
          >
            <Filter size={13} /> Filtrar (F3)
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
          }}
        >
          {[
            {
              label: 'Em aberto',
              value: fmt(totalEmAberto),
              color: 'var(--blue-700)',
            },
            {
              label: 'Recebido',
              value: fmt(totalPago),
              color: 'var(--green-500)',
            },
            {
              label: 'Total documentos',
              value: fmt(totalDocto),
              color: 'var(--text-primary)',
            },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
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
                {c.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: c.color }}>
                {c.value}
              </div>
            </div>
          ))}
        </div>
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
            <col style={{ width: 36 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 36 }} />
            <col />
            <col style={{ width: 90 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 80 }} />
          </colgroup>
          <thead>
            <tr>
              <th
                style={{
                  padding: '8px 10px',
                  background: 'var(--gray-50)',
                  borderBottom: '1px solid var(--border)',
                  position: 'sticky',
                  top: 0,
                }}
              ></th>
              {[
                'Documento',
                'Seq',
                'Cliente',
                'Data',
                'Vencimento',
                'Valor doc.',
                'Em aberto',
                'Situação',
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
            {filtrados.map((c) => {
              const sel = selecionadas.includes(c.id)
              const vencido =
                c.situacao === 'ABERTO' && new Date(c.vencimento) < new Date()
              return (
                <tr
                  key={c.id}
                  onClick={() => toggleSel(c.id)}
                  style={{
                    background: sel
                      ? 'var(--blue-50)'
                      : vencido
                        ? 'var(--red-50)'
                        : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.08s',
                  }}
                  onMouseEnter={(e) => {
                    if (!sel)
                      e.currentTarget.style.background = vencido
                        ? '#FEE2E2'
                        : 'var(--gray-50)'
                  }}
                  onMouseLeave={(e) => {
                    if (!sel)
                      e.currentTarget.style.background = vencido
                        ? 'var(--red-50)'
                        : 'transparent'
                  }}
                >
                  <td
                    style={{
                      padding: '9px 10px',
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'center',
                    }}
                  >
                    <input
                      type='checkbox'
                      checked={sel}
                      onChange={() => toggleSel(c.id)}
                      style={{ width: 14, height: 14 }}
                    />
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 12,
                      fontFamily: 'monospace',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {c.documento}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    {c.seq}
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
                    {c.cliente_nome}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 12,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {fmtDate(c.data_docto)}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
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
                      padding: '9px 10px',
                      fontSize: 13,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {fmt(c.valor_docto)}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 13,
                      fontWeight: 500,
                      borderBottom: '1px solid var(--border)',
                      color:
                        c.em_aberto > 0
                          ? 'var(--blue-700)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {fmt(c.em_aberto)}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <StatusBadge
                      status={
                        vencido && c.situacao === 'ABERTO'
                          ? 'VENCIDO'
                          : c.situacao
                      }
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          background: 'var(--gray-50)',
          borderTop: '1px solid var(--border)',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Selecionadas: {selecionadas.length}
        </span>
        <div style={{ flex: 1 }} />
        <button
          disabled={
            selecionadas.length !== 1 ||
            dados.find((c) => c.id === selecionadas[0])?.situacao === 'BAIXADO'
          }
          onClick={() =>
            setContaRecebendo(dados.find((c) => c.id === selecionadas[0]))
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 34,
            padding: '0 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            fontWeight: 500,
            background:
              selecionadas.length === 1 &&
              dados.find((c) => c.id === selecionadas[0])?.situacao !==
                'BAIXADO'
                ? 'var(--blue-700)'
                : 'var(--gray-200)',
            color:
              selecionadas.length === 1 &&
              dados.find((c) => c.id === selecionadas[0])?.situacao !==
                'BAIXADO'
                ? '#fff'
                : 'var(--text-muted)',
            cursor: selecionadas.length === 1 ? 'pointer' : 'not-allowed',
          }}
        >
          <DollarSign size={14} /> Receber
        </button>
      </div>
    </div>
  )
}
