import { useState, useEffect } from 'react'
import { Search, Plus, DollarSign, RefreshCw } from 'lucide-react'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-'

function getSituacao(c) {
  if (c.situacao_docto === 'P') return 'PAGO'
  if (c.situacao_docto === 'C') return 'CANCELADO'
  const hoje = new Date().toISOString().slice(0, 10)
  if (c.data_vencimento && c.data_vencimento < hoje) return 'VENCIDO'
  return 'ABERTO'
}

function StatusBadge({ status }) {
  const cfg = {
    ABERTO: { bg: '#EBF3FC', color: '#185FA5', label: 'Aberto' },
    VENCIDO: { bg: '#FFF0F0', color: '#C53030', label: 'Vencido' },
    PAGO: { bg: '#EAF6EE', color: '#22863A', label: 'Pago' },
    CANCELADO: { bg: '#F7F7F7', color: '#9AA3B2', label: 'Cancelado' },
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
      }}
    >
      {s.label}
    </span>
  )
}

function ModalPagar({ conta, onClose, onConfirm }) {
  const valorDocto = conta.valor_docto || 0
  const [forma, setForma] = useState('')
  const [valor, setValor] = useState(valorDocto.toFixed(2))
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [salvando, setSalvando] = useState(false)

  async function handleConfirm() {
    if (!forma) return
    setSalvando(true)
    await onConfirm(conta.id, forma, parseFloat(valor), data)
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
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #E2EAF4',
          width: 420,
          boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
          overflow: 'hidden',
        }}
      >
        <div style={{ background: '#185FA5', padding: '16px 20px' }}>
          <div
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 12,
              marginBottom: 2,
            }}
          >
            {conta.nome_fornecedor || conta.codigo_fornecedor}
          </div>
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 600 }}>
            {fmt(valorDocto)}
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 11,
              marginTop: 2,
            }}
          >
            Vencimento: {fmtDate(conta.data_vencimento)}
            {conta.nro_docto ? ` · Doc: ${conta.nro_docto}` : ''}
          </div>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  fontSize: 11,
                  color: '#9AA3B2',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Forma de pagamento
              </label>
              <select
                value={forma}
                onChange={(e) => setForma(e.target.value)}
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: '1px solid #E2EAF4',
                }}
                autoFocus
              >
                <option value=''>Selecione...</option>
                <option>Dinheiro</option>
                <option>Transferência</option>
                <option>PIX</option>
                <option>Cheque</option>
                <option>Cartão</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: '#9AA3B2',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Valor pago
              </label>
              <input
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                type='number'
                step='0.01'
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: '1px solid #E2EAF4',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: '#9AA3B2',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Data do pagamento
              </label>
              <input
                value={data}
                onChange={(e) => setData(e.target.value)}
                type='date'
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: '1px solid #E2EAF4',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: '1px solid #E2EAF4',
                fontSize: 13,
                color: '#9AA3B2',
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
                background: forma ? '#185FA5' : '#E2EAF4',
                color: forma ? '#fff' : '#9AA3B2',
                fontSize: 13,
                fontWeight: 600,
                cursor: forma ? 'pointer' : 'not-allowed',
              }}
            >
              {salvando ? 'Salvando...' : 'Confirmar pagamento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalNova({ onClose, onSalvar }) {
  const [form, setForm] = useState({
    codigo_fornecedor: '',
    observacao: '',
    nro_docto: '',
    valor_docto: '',
    data_vencimento: '',
    codigo_forma_pagamento: '',
  })
  const [salvando, setSalvando] = useState(false)
  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))
  const valido =
    form.codigo_fornecedor && form.valor_docto && form.data_vencimento

  async function handleSalvar() {
    setSalvando(true)
    await onSalvar(form)
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
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #E2EAF4',
          width: 440,
          padding: 24,
          boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 18,
            color: '#1A202C',
          }}
        >
          Nova conta a pagar
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              style={{
                fontSize: 11,
                color: '#9AA3B2',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Fornecedor / Descrição *
            </label>
            <input
              value={form.codigo_fornecedor}
              onChange={f('codigo_fornecedor')}
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid #E2EAF4',
              }}
              autoFocus
              placeholder='Nome do fornecedor ou descrição'
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              style={{
                fontSize: 11,
                color: '#9AA3B2',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Observação / Histórico
            </label>
            <input
              value={form.observacao}
              onChange={f('observacao')}
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid #E2EAF4',
              }}
              placeholder='Ex: Ref. fatura 001/2026'
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: '#9AA3B2',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Nº Documento
            </label>
            <input
              value={form.nro_docto}
              onChange={f('nro_docto')}
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid #E2EAF4',
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: '#9AA3B2',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Valor (R$) *
            </label>
            <input
              value={form.valor_docto}
              onChange={f('valor_docto')}
              type='number'
              step='0.01'
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid #E2EAF4',
              }}
              placeholder='0,00'
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: '#9AA3B2',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Vencimento *
            </label>
            <input
              value={form.data_vencimento}
              onChange={f('data_vencimento')}
              type='date'
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid #E2EAF4',
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: '#9AA3B2',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Forma de pagamento
            </label>
            <select
              value={form.codigo_forma_pagamento}
              onChange={f('codigo_forma_pagamento')}
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid #E2EAF4',
              }}
            >
              <option value=''>A definir</option>
              <option>Dinheiro</option>
              <option>Transferência</option>
              <option>PIX</option>
              <option>Cheque</option>
              <option>Cartão</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid #E2EAF4',
              fontSize: 13,
              color: '#9AA3B2',
            }}
          >
            Cancelar
          </button>
          <button
            disabled={!valido || salvando}
            onClick={handleSalvar}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              background: valido ? '#185FA5' : '#E2EAF4',
              color: valido ? '#fff' : '#9AA3B2',
              fontSize: 13,
              fontWeight: 600,
              cursor: valido ? 'pointer' : 'not-allowed',
            }}
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContasPagar() {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [selecionadas, setSelecionadas] = useState([])
  const [contaPagando, setContaPagando] = useState(null)
  const [modalNova, setModalNova] = useState(false)
  const [sucesso, setSucesso] = useState('')

  async function carregar() {
    setLoading(true)
    try {
      const filtros = {}
      if (filtroStatus === 'aberto') filtros.situacao = 'A'
      if (filtroStatus === 'pago') filtros.situacao = 'P'

      const result = await window.api.invoke('contasPagar:listar', filtros)
      setDados(result)
    } catch (err) {
      console.error('Erro ao carregar contas a pagar:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [filtroStatus])

  // Filtro local por busca
  const filtrados = dados
    .filter((c) => {
      if (!busca) return true
      const b = busca.toLowerCase()
      return (
        (c.nome_fornecedor || '').toLowerCase().includes(b) ||
        (c.codigo_fornecedor || '').toLowerCase().includes(b) ||
        (c.observacao || '').toLowerCase().includes(b) ||
        (c.nro_docto || '').includes(busca)
      )
    })
    .filter((c) => {
      if (filtroStatus === 'vencido') return getSituacao(c) === 'VENCIDO'
      return true
    })

  // Totalizadores
  const totalAberto = filtrados
    .filter((c) => getSituacao(c) !== 'PAGO')
    .reduce((s, c) => s + (c.valor_docto || 0), 0)
  const totalPago = filtrados
    .filter((c) => getSituacao(c) === 'PAGO')
    .reduce((s, c) => s + (c.valor_pagamento || 0), 0)
  const totalVencido = filtrados
    .filter((c) => getSituacao(c) === 'VENCIDO')
    .reduce((s, c) => s + (c.valor_docto || 0), 0)

  function toggleSel(id) {
    setSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  async function confirmarPagamento(id, forma, valor, data) {
    try {
      await window.api.invoke('contasPagar:pagar', {
        id,
        valor_pagamento: valor,
        data_pagamento: data,
        usuario: 'rosangela',
      })
      setContaPagando(null)
      setSelecionadas([])
      setSucesso('✅ Pagamento registrado!')
      setTimeout(() => setSucesso(''), 2500)
      await carregar()
    } catch (err) {
      console.error('Erro ao registrar pagamento:', err)
    }
  }

  async function salvarNova(form) {
    try {
      await window.api.invoke('contasPagar:salvar', {
        codigo_fornecedor: form.codigo_fornecedor,
        observacao: form.observacao,
        nro_docto: form.nro_docto,
        valor_docto: parseFloat(form.valor_docto),
        data_vencimento: form.data_vencimento,
        data_docto: new Date().toISOString().slice(0, 10),
        codigo_forma_pagamento: form.codigo_forma_pagamento,
        situacao_docto: 'A',
        usuario: 'rosangela',
      })
      setModalNova(false)
      setSucesso('✅ Conta adicionada!')
      setTimeout(() => setSucesso(''), 2500)
      await carregar()
    } catch (err) {
      console.error('Erro ao salvar conta:', err)
    }
  }

  const contaSel =
    selecionadas.length === 1
      ? dados.find((c) => c.id === selecionadas[0])
      : null
  const podePagar = contaSel && getSituacao(contaSel) !== 'PAGO'

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
            background: '#22863A',
            color: '#fff',
            padding: '9px 22px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 300,
          }}
        >
          {sucesso}
        </div>
      )}

      {contaPagando && (
        <ModalPagar
          conta={contaPagando}
          onClose={() => setContaPagando(null)}
          onConfirm={confirmarPagamento}
        />
      )}
      {modalNova && (
        <ModalNova onClose={() => setModalNova(false)} onSalvar={salvarNova} />
      )}

      {/* ── TOPO ── */}
      <div
        style={{ padding: '14px 16px 10px', borderBottom: '1px solid #E2EAF4' }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9AA3B2',
              }}
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder='Buscar por fornecedor ou documento...'
              style={{
                width: '100%',
                height: 34,
                paddingLeft: 32,
                borderRadius: 8,
                border: '1px solid #E2EAF4',
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
              border: '1px solid #E2EAF4',
              fontSize: 13,
            }}
          >
            <option value='todos'>Todos</option>
            <option value='aberto'>Aberto</option>
            <option value='vencido'>Vencido</option>
            <option value='pago'>Pago</option>
          </select>
          <button
            onClick={carregar}
            style={{
              height: 34,
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid #E2EAF4',
              borderRadius: 8,
              fontSize: 12,
              color: '#9AA3B2',
            }}
            title='Atualizar'
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={() => setModalNova(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 34,
              padding: '0 14px',
              background: '#185FA5',
              color: '#fff',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
            }}
          >
            <Plus size={14} /> Nova conta
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
            { label: 'Em aberto', value: fmt(totalAberto), color: '#185FA5' },
            { label: 'Vencido', value: fmt(totalVencido), color: '#C53030' },
            { label: 'Pago', value: fmt(totalPago), color: '#22863A' },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                background: '#F7FAFF',
                borderRadius: 8,
                padding: '10px 14px',
                border: '1px solid #E2EAF4',
              }}
            >
              <div style={{ fontSize: 11, color: '#9AA3B2', marginBottom: 3 }}>
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
              color: '#9AA3B2',
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
              color: '#9AA3B2',
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
              <col />
              <col style={{ width: 90 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 95 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 85 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thStyle}></th>
                {[
                  'Fornecedor',
                  'Documento',
                  'Vencimento',
                  'Valor',
                  'Dt. Pagamento',
                  'Forma',
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
                return (
                  <tr
                    key={c.id}
                    onClick={() => toggleSel(c.id)}
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
                          : '#F7FAFF'
                    }}
                    onMouseLeave={(e) => {
                      if (!sel)
                        e.currentTarget.style.background = vencido
                          ? '#FFF5F5'
                          : 'transparent'
                    }}
                  >
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
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
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {c.nome_fornecedor || c.codigo_fornecedor}
                      {c.observacao && (
                        <span
                          style={{
                            fontSize: 11,
                            color: '#9AA3B2',
                            marginLeft: 6,
                          }}
                        >
                          {c.observacao}
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontSize: 12,
                        fontFamily: 'monospace',
                      }}
                    >
                      {c.nro_docto || '-'}
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
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 600,
                        color: sit === 'PAGO' ? '#9AA3B2' : '#1A202C',
                      }}
                    >
                      {fmt(c.valor_docto)}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: '#9AA3B2' }}>
                      {fmtDate(c.data_pagamento)}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: '#9AA3B2' }}>
                      {c.codigo_forma_pagamento || '-'}
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
          background: '#F7FAFF',
          borderTop: '1px solid #E2EAF4',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 12, color: '#9AA3B2' }}>
          {filtrados.length} registro(s) · Selecionadas: {selecionadas.length}
        </span>
        <div style={{ flex: 1 }} />
        <button
          disabled={!podePagar}
          onClick={() => contaSel && setContaPagando(contaSel)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 34,
            padding: '0 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: podePagar ? '#185FA5' : '#E2EAF4',
            color: podePagar ? '#fff' : '#9AA3B2',
            cursor: podePagar ? 'pointer' : 'not-allowed',
            border: 'none',
          }}
        >
          <DollarSign size={14} /> Registrar pagamento
        </button>
      </div>
    </div>
  )
}

const thStyle = {
  padding: '8px 10px',
  fontSize: 11,
  fontWeight: 500,
  color: '#9AA3B2',
  textAlign: 'left',
  background: '#F7FAFF',
  borderBottom: '1px solid #E2EAF4',
  position: 'sticky',
  top: 0,
}

const tdStyle = {
  padding: '9px 10px',
  fontSize: 13,
  borderBottom: '1px solid #F0F4FA',
}
