import { useState, useEffect } from 'react'
import { Search, Filter, DollarSign, RefreshCw } from 'lucide-react'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDate = (d) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-'

// Calcula situação real com base na data de vencimento
function getSituacao(c) {
  if (c.situacao_docto === 'P') return 'BAIXADO'
  if (c.situacao_docto === 'C') return 'CANCELADO'
  const hoje = new Date().toISOString().slice(0, 10)
  if (c.data_vencimento && c.data_vencimento < hoje) return 'VENCIDO'
  return 'ABERTO'
}

function StatusBadge({ status }) {
  const cfg = {
    ABERTO: { bg: '#EBF3FC', color: '#185FA5', label: 'Aberto' },
    BAIXADO: { bg: '#EAF6EE', color: '#22863A', label: 'Baixado' },
    VENCIDO: { bg: '#FFF0F0', color: '#C53030', label: 'Vencido' },
    CANCELADO: { bg: '#F7F7F7', color: 'var(--text-muted)', label: 'Cancelado' },
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

function ModalReceber({ conta, onClose, onConfirm, erro }) {
  const emAberto = conta.valor_docto - (conta.valor_pagamento || 0)
  const [forma, setForma] = useState(null)
  const [valor, setValor] = useState(emAberto.toFixed(2))
  const [salvando, setSalvando] = useState(false)

  async function handleConfirm() {
    if (!forma) return
    setSalvando(true)
    await onConfirm(conta.id, forma, parseFloat(valor))
    setSalvando(false)
  }

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
          background: 'var(--surface)',
          borderRadius: 14,
          border: '1px solid var(--border-md)',
          width: 400,
          boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
          overflow: 'hidden',
        }}
      >
        <div style={{ background: '#185FA5', padding: '16px 20px' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
            {conta.nome_cliente || conta.codigo_cliente}
            {conta.telefone_cliente ? ` · ${conta.telefone_cliente}` : ''}
          </div>
          <div
            style={{
              color: 'var(--surface)',
              fontSize: 22,
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            {fmt(emAberto)}
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 11,
              marginTop: 2,
            }}
          >
            Vencimento: {fmtDate(conta.data_vencimento)} · Doc:{' '}
            {conta.nro_docto}
          </div>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              FORMA DE PAGAMENTO
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {['Dinheiro', 'Cartão', 'Cheque', 'Haver', 'PIX'].map((f) => (
                <button
                  key={f}
                  onClick={() => setForma(f)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    border:
                      forma === f ? '2px solid #185FA5' : '1px solid var(--border-md)',
                    background: forma === f ? '#EBF3FC' : 'var(--surface)',
                    color: forma === f ? '#185FA5' : 'var(--text-secondary)',
                    fontWeight: forma === f ? 600 : 400,
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
                  color: 'var(--text-muted)',
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
                step='0.01'
                style={{
                  width: '100%',
                  height: 38,
                  padding: '0 12px',
                  fontSize: 15,
                  fontWeight: 500,
                  borderRadius: 8,
                  border: '1px solid var(--border-md)',
                }}
                autoFocus
              />
            </div>
          )}
          {erro && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 14,
                padding: '8px 10px',
                borderRadius: 8,
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                fontSize: 12,
              }}
            >
              {erro}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: '1px solid var(--border-md)',
                fontSize: 13,
                color: 'var(--text-muted)',
              }}
            >
              Cancelar
            </button>
            <button
              disabled={!forma || salvando}
              onClick={handleConfirm}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                background: forma ? '#185FA5' : 'var(--border-md)',
                color: forma ? 'var(--surface)' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: 600,
                cursor: forma ? 'pointer' : 'not-allowed',
              }}
            >
              {salvando ? 'Salvando...' : 'Confirmar (F5)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContasReceber({ usuario }) {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [selecionadas, setSelecionadas] = useState([])
  const [contaRecebendo, setContaRecebendo] = useState(null)
  const [sucesso, setSucesso] = useState(false)
  const [erroRecebimento, setErroRecebimento] = useState('')

  // ── Carrega do banco ─────────────────────────────────────────
  async function carregar() {
    setLoading(true)
    try {
      const filtros = {}
      if (filtroStatus === 'aberto') filtros.situacao = 'A'
      if (filtroStatus === 'baixado') filtros.situacao = 'P'
      if (busca) filtros.cliente = busca

      const result = await window.api.contasReceber.listar(filtros)
      setDados(result)
    } catch (err) {
      console.error('Erro ao carregar contas a receber:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [filtroStatus])

  // Busca local (já filtra pelo banco quando muda status)
  const filtrados = dados.filter((c) => {
    if (!busca) return true
    const b = busca.toLowerCase()
    return (
      (c.nome_cliente || '').toLowerCase().includes(b) ||
      (c.nro_docto || '').includes(busca) ||
      (c.codigo_cliente || '').includes(busca)
    )
  })

  // Totalizadores
  const totalEmAberto = filtrados
    .filter((c) => c.situacao_docto === 'A')
    .reduce((s, c) => s + (c.valor_docto - (c.valor_pagamento || 0)), 0)

  const totalPago = filtrados
    .filter((c) => c.situacao_docto === 'P')
    .reduce((s, c) => s + (c.valor_pagamento || 0), 0)

  const totalDocto = filtrados.reduce((s, c) => s + (c.valor_docto || 0), 0)

  function toggleSel(id) {
    setSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  async function confirmarRecebimento(id, forma, valor) {
    setErroRecebimento('')
    try {
      const resultado = await window.api.contasReceber.receber({
        id,
        valor_pagamento: valor,
        forma,
        data_pagamento: new Date().toISOString().slice(0, 10),
        usuario: usuario?.usuario || 'sistema',
      })
      if (!resultado.sucesso) {
        setErroRecebimento(resultado.erro || 'Erro ao receber conta.')
        return
      }
      setContaRecebendo(null)
      setSelecionadas([])
      setSucesso(true)
      setTimeout(() => setSucesso(false), 2500)
      await carregar()
    } catch (err) {
      console.error('Erro ao receber conta:', err)
      setErroRecebimento('Erro ao receber conta.')
    }
  }

  const contaSelecionada = dados.find((c) => c.id === selecionadas[0])
  const podeReceber =
    selecionadas.length === 1 && contaSelecionada?.situacao_docto === 'A'

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        position: 'relative',
      }}
    >
      {/* Toast de sucesso */}
      {sucesso && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#22863A',
            color: 'var(--surface)',
            padding: '9px 22px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 300,
          }}
        >
          ✅ Parcela recebida com sucesso!
        </div>
      )}

      {contaRecebendo && (
        <ModalReceber
          conta={contaRecebendo}
          onClose={() => { setContaRecebendo(null); setErroRecebimento('') }}
          onConfirm={confirmarRecebimento}
          erro={erroRecebimento}
        />
      )}

      {/* ── TOPO: busca + filtros + totais ── */}
      <div
        style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border-md)' }}
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
              onKeyDown={(e) => e.key === 'Enter' && carregar()}
              placeholder='Buscar por cliente ou documento...'
              style={{
                width: '100%',
                height: 34,
                paddingLeft: 32,
                borderRadius: 8,
                border: '1px solid var(--border-md)',
                fontSize: 13,
              }}
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            style={{
              height: 34,
              padding: '0 10px',
              borderRadius: 8,
              border: '1px solid var(--border-md)',
              fontSize: 13,
            }}
          >
            <option value='todos'>Todos</option>
            <option value='aberto'>Aberto</option>
            <option value='baixado'>Baixado</option>
          </select>
          <button
            onClick={carregar}
            style={{
              height: 34,
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid var(--border-md)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
            title='Atualizar'
          >
            <RefreshCw size={13} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 10,
          }}
        >
          {[
            { label: 'Em aberto', value: fmt(totalEmAberto), color: '#185FA5' },
            { label: 'Recebido', value: fmt(totalPago), color: '#22863A' },
            { label: 'Total faturado', value: fmt(totalDocto), color: 'var(--text-primary)' },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                background: 'var(--gray-50)',
                borderRadius: 8,
                padding: '10px 14px',
                border: '1px solid var(--border-md)',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                {c.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: c.color }}>
                {c.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABELA ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            Carregando...
          </div>
        ) : filtrados.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            Nenhum registro encontrado.
          </div>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 36 }} />
              <col />
              <col style={{ width: 90 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 95 }} />
              <col style={{ width: 95 }} />
              <col style={{ width: 85 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thStyle}></th>
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
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => {
                const sel = selecionadas.includes(c.id)
                const sit = getSituacao(c)
                const vencido = sit === 'VENCIDO'
                const emAberto = c.valor_docto - (c.valor_pagamento || 0)
                return (
                  <tr
                    key={c.id}
                    onClick={() => toggleSel(c.id)}
                    onDoubleClick={() => c.situacao_docto === 'A' && setContaRecebendo(c)}
                    style={{
                      background: sel
                        ? '#EBF3FC'
                        : vencido
                          ? '#FFF5F5'
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
                          ? '#FFF5F5'
                          : 'transparent'
                    }}
                  >
                    <td style={tdStyle}>
                      <input
                        type='checkbox'
                        checked={sel}
                        onChange={() => toggleSel(c.id)}
                        style={{ width: 14, height: 14 }}
                      />
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                    >
                      {c.nro_docto}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: 'center',
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      {c.seq_docto || '-'}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>
                        {c.nome_cliente || c.codigo_cliente}
                      </div>
                      {c.telefone_cliente && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {c.telefone_cliente}
                        </div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12 }}>
                      {fmtDate(c.data_docto)}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontSize: 12,
                        color: vencido ? '#C53030' : undefined,
                        fontWeight: vencido ? 500 : 400,
                      }}
                    >
                      {fmtDate(c.data_vencimento)}
                    </td>
                    <td style={tdStyle}>{fmt(c.valor_docto)}</td>
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 500,
                        color: emAberto > 0 ? '#185FA5' : 'var(--text-muted)',
                      }}
                    >
                      {fmt(emAberto)}
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={sit} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── RODAPÉ ── */}
      <div
        style={{
          background: 'var(--gray-50)',
          borderTop: '1px solid var(--border-md)',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {filtrados.length} registro(s) · Selecionadas: {selecionadas.length}
        </span>
        <div style={{ flex: 1 }} />
        <button
          disabled={!podeReceber}
          onClick={() => setContaRecebendo(contaSelecionada)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 34,
            padding: '0 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: podeReceber ? '#185FA5' : 'var(--border-md)',
            color: podeReceber ? 'var(--surface)' : 'var(--text-muted)',
            cursor: podeReceber ? 'pointer' : 'not-allowed',
          }}
        >
          <DollarSign size={14} /> Receber
        </button>
      </div>
    </div>
  )
}

const thStyle = {
  padding: '8px 10px',
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--text-muted)',
  textAlign: 'left',
  background: 'var(--gray-50)',
  borderBottom: '1px solid var(--border-md)',
  position: 'sticky',
  top: 0,
}

const tdStyle = {
  padding: '9px 10px',
  fontSize: 13,
  borderBottom: '1px solid #F0F4FA',
}
