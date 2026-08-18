import { useState, useEffect, useRef } from 'react'
import { Search, Plus, DollarSign, RefreshCw } from 'lucide-react'
import ThOrdenavel from '../components/ThOrdenavel'
import { BotoesRelatorio } from '../components/BotoesRelatorio'
import { useOrdenacao } from '../utils/ordenacao'
import { corGastoFixo } from '../utils/coresGastoFixo'
import {
  exportarCSV,
  agruparPorPessoa,
  buscarEmpresa,
  gerarHtmlAgrupadoPorPessoa,
  gerarHtmlSecoes,
  gerarPdfRelatorio,
  fmtMoedaBR,
} from '../utils/relatorios'
import { hojeLocal } from '../utils/data'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-'

function getSituacao(c) {
  if (c.situacao_docto === 'P') return 'PAGO'
  if (c.situacao_docto === 'C') return 'CANCELADO'
  const hoje = hojeLocal()
  if (c.data_vencimento && c.data_vencimento < hoje) return 'VENCIDO'
  return 'ABERTO'
}

const STATUS_CFG = {
  ABERTO: { bg: '#EBF3FC', color: '#185FA5', label: 'Aberto' },
  VENCIDO: { bg: '#FFF0F0', color: '#C53030', label: 'Vencido' },
  PAGO: { bg: '#EAF6EE', color: '#22863A', label: 'Pago' },
  CANCELADO: { bg: '#F7F7F7', color: 'var(--text-muted)', label: 'Cancelado' },
}

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.ABERTO
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

// Confirmação de pagamento — cobre tanto uma conta única (onde ainda dá pra
// ajustar o valor pago, ex: desconto por pagar em dia) quanto um lote de
// várias contas selecionadas (cada uma quitada pelo próprio valor do
// documento). É a etapa de "conferir antes de pagar": lista as contas
// resumidas e só efetiva ao clicar em Pagar de novo, aqui dentro.
function ModalConfirmarPagamento({ contas, onClose, onConfirm, fornecedorFixoMap }) {
  const unico = contas.length === 1
  const totalDocumentos = contas.reduce((s, c) => s + (c.valor_docto || 0), 0)
  const [forma, setForma] = useState('')
  const [valorUnico, setValorUnico] = useState(
    unico ? (contas[0].valor_docto || 0).toFixed(2) : '',
  )
  const [data, setData] = useState(hojeLocal())
  const [salvando, setSalvando] = useState(false)

  const valorFinal = unico ? parseFloat(valorUnico) || 0 : totalDocumentos
  const valorMaximo = unico ? contas[0].valor_docto || 0 : Infinity
  const valorExcedeConta = unico && parseFloat(valorUnico) > valorMaximo
  const valorValido = unico ? parseFloat(valorUnico) > 0 && !valorExcedeConta : true
  const podeConfirmar = !!forma && valorValido
  const gastoFixo = unico ? fornecedorFixoMap?.get(contas[0].codigo_fornecedor) : null
  const restante = unico ? Math.max(0, (contas[0].valor_docto || 0) - valorFinal) : 0
  const ehPagamentoParcialDeFixo = !!gastoFixo && restante > 0.01

  async function handleConfirm() {
    if (!podeConfirmar) return
    setSalvando(true)
    let descontoOutraParte = 0
    if (ehPagamentoParcialDeFixo) {
      const outroPagou = await window.api.dialog.confirm(
        `Você está pagando ${fmt(valorFinal)} de uma conta de ${fmt(contas[0].valor_docto)} (${gastoFixo.descricao}).\n\n` +
        `A outra parte (${fmt(restante)}) já foi paga por fora, direto ao fornecedor?\n\n` +
        `Clique OK pra marcar essa conta como totalmente paga, sem esse restante sair do caixa da loja. Clique Cancelar se a outra parte ainda não pagou — a conta fica em aberto com o saldo restante.`,
      )
      if (outroPagou) descontoOutraParte = restante
    }
    const pagamentos = contas.map((c) => ({
      id: c.id,
      valor_pagamento: unico ? valorFinal : c.valor_docto || 0,
      valor_desconto: unico ? descontoOutraParte : 0,
    }))
    await onConfirm(pagamentos, forma, data)
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
          width: 460,
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
            {unico
              ? `${contas[0].nome_fornecedor || '—'} (#${contas[0].codigo_fornecedor})`
              : `${contas.length} conta(s) selecionada(s)`}
          </div>
          <div style={{ color: 'var(--surface)', fontSize: 22, fontWeight: 600 }}>
            {fmt(valorFinal)}
          </div>
          {unico && (
            <div
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 11,
                marginTop: 2,
              }}
            >
              Vencimento: {fmtDate(contas[0].data_vencimento)}
              {contas[0].nro_docto ? ` · Doc: ${contas[0].nro_docto}` : ''}
            </div>
          )}
        </div>
        <div style={{ padding: '18px 20px' }}>
          {/* Conferência — lista resumida do que está prestes a virar "pago" */}
          <div
            style={{
              border: '1px solid var(--border-md)',
              borderRadius: 8,
              maxHeight: 160,
              overflowY: 'auto',
              marginBottom: 16,
            }}
          >
            {contas.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '8px 12px',
                  borderBottom: i < contas.length - 1 ? '1px solid var(--border)' : 'none',
                  fontSize: 12.5,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.nome_fornecedor || '—'} (#{c.codigo_fornecedor})
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    Venc. {fmtDate(c.data_vencimento)}
                    {c.nro_docto ? ` · Doc: ${c.nro_docto}` : ''}
                  </div>
                  {c.valor_fatura_cheia && (
                    <div style={{ color: '#B7791F', fontSize: 11, fontWeight: 500, marginTop: 2 }}>
                      ⚠ Fatura total é {fmt(c.valor_fatura_cheia)} — isto aqui é só a parte da loja
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {fmt(c.valor_docto)}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: unico ? '1fr 1fr' : '1fr 1fr',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
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
                  border: '1px solid var(--border-md)',
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
            {unico ? (
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Valor pago
                </label>
                <input
                  value={valorUnico}
                  onChange={(e) => setValorUnico(e.target.value)}
                  type='number'
                  step='0.01'
                  max={valorMaximo}
                  style={{
                    width: '100%',
                    height: 36,
                    padding: '0 10px',
                    borderRadius: 8,
                    border: `1px solid ${valorExcedeConta ? '#C53030' : ehPagamentoParcialDeFixo ? corGastoFixo(gastoFixo.id) : 'var(--border-md)'}`,
                  }}
                />
                {valorExcedeConta && (
                  <div style={{ fontSize: 11, color: '#C53030', marginTop: 6 }}>
                    Valor não pode passar de {fmt(valorMaximo)} — o total da conta.
                  </div>
                )}
                {!valorExcedeConta && gastoFixo && (
                  <div style={{ fontSize: 11, color: ehPagamentoParcialDeFixo ? corGastoFixo(gastoFixo.id) : '#B7791F', marginTop: 6 }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: corGastoFixo(gastoFixo.id), marginRight: 6 }} />
                    {ehPagamentoParcialDeFixo
                      ? `Pagando só a parte da loja — falta ${fmt(restante)}. Ao clicar em Pagar, vou perguntar se essa outra parte já foi paga por fora.`
                      : `Essa conta é o gasto fixo "${gastoFixo.descricao}" e é dividida com outra pessoa. Pra pagar só a parte da loja, apague o valor acima e digite a parte dela.`}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Total a pagar
                </label>
                <div
                  style={{
                    height: 36,
                    padding: '0 10px',
                    display: 'flex',
                    alignItems: 'center',
                    background: '#F7F7F7',
                    border: '1px solid var(--border-md)',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {fmt(totalDocumentos)}
                </div>
              </div>
            )}
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
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
                  border: '1px solid var(--border-md)',
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
                border: '1px solid var(--border-md)',
                fontSize: 13,
                color: 'var(--text-muted)',
              }}
            >
              Cancelar
            </button>
            <button
              disabled={!podeConfirmar || salvando}
              onClick={handleConfirm}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                background: podeConfirmar ? '#185FA5' : 'var(--border-md)',
                color: podeConfirmar ? 'var(--surface)' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: 600,
                cursor: podeConfirmar ? 'pointer' : 'not-allowed',
              }}
            >
              {salvando ? 'Salvando...' : 'Pagar'}
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
    codigo_plano_conta: null,
    observacao: '',
    nro_docto: '',
    valor_docto: '',
    valor_fatura_cheia: '',
    data_vencimento: '',
    codigo_forma_pagamento: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [planoContas, setPlanoContas] = useState([])
  const [contaAberta, setContaAberta] = useState(false)
  const contaRef = useRef(null)
  const [fornecedoresLista, setFornecedoresLista] = useState([])
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null)
  const [fornecedorAberta, setFornecedorAberta] = useState(false)
  const fornecedorRef = useRef(null)
  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))
  const valido =
    form.codigo_fornecedor && parseFloat(form.valor_docto) > 0 && form.data_vencimento

  useEffect(() => {
    window.api.planoContas.listar({ situacao: 'A' }).then(setPlanoContas).catch(console.error)
  }, [])

  useEffect(() => {
    window.api.fornecedores.listar({ situacao: 'A' }).then(setFornecedoresLista).catch(console.error)
  }, [])

  useEffect(() => {
    if (!contaAberta) return
    function handleClickFora(e) {
      if (contaRef.current && !contaRef.current.contains(e.target)) setContaAberta(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [contaAberta])

  useEffect(() => {
    if (!fornecedorAberta) return
    function handleClickFora(e) {
      if (fornecedorRef.current && !fornecedorRef.current.contains(e.target)) setFornecedorAberta(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [fornecedorAberta])

  // Sem seleção confirmada, o campo continua texto livre (mesmo
  // comportamento de sempre — cobre pagamento avulso a quem não tem
  // fornecedor cadastrado). Só filtra a lista pelo que já foi digitado.
  const buscaFornecedor = form.codigo_fornecedor.trim().toLowerCase()
  const fornecedoresFiltrados = buscaFornecedor
    ? fornecedoresLista.filter((fo) => fo.nome.toLowerCase().includes(buscaFornecedor))
    : []

  // Só as contas-folha (nível 4) servem pra classificar um lançamento — os
  // níveis 2/3 são só agrupadores. O grupo (nível 3) vira o "breadcrumb" pra
  // dar contexto na lista, achado pelo prefixo do número da conta.
  const gruposPorNumero = Object.fromEntries(
    planoContas.filter((c) => c.nivel === 3).map((c) => [c.numero_conta, c.descricao]),
  )
  const contasFolha = planoContas
    .filter((c) => c.nivel === 4)
    .map((c) => ({ ...c, grupo: gruposPorNumero[c.numero_conta.split('.').slice(0, -1).join('.')] || '' }))

  const buscaConta = form.observacao.trim().toLowerCase()
  const contasFiltradas = buscaConta
    ? contasFolha.filter((c) => c.descricao.toLowerCase().includes(buscaConta))
    : contasFolha

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
          background: 'var(--surface)',
          borderRadius: 14,
          border: '1px solid var(--border-md)',
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
            color: 'var(--text-primary)',
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
          <div style={{ gridColumn: '1 / -1', position: 'relative' }} ref={fornecedorRef}>
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Fornecedor / Descrição *
            </label>
            <input
              value={fornecedorSelecionado ? fornecedorSelecionado.nome : form.codigo_fornecedor}
              onChange={(e) => {
                setFornecedorSelecionado(null)
                setForm((p) => ({ ...p, codigo_fornecedor: e.target.value }))
                setFornecedorAberta(true)
              }}
              onFocus={() => setFornecedorAberta(true)}
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid var(--border-md)',
              }}
              autoFocus
              placeholder='Nome do fornecedor ou descrição'
            />
            {fornecedorAberta && buscaFornecedor && fornecedoresFiltrados.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  marginTop: 2,
                  background: 'var(--surface)',
                  border: '1px solid var(--border-md)',
                  borderRadius: 8,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {fornecedoresFiltrados.map((fo) => (
                  <button
                    key={fo.codigo}
                    onClick={() => {
                      setFornecedorSelecionado(fo)
                      setForm((p) => ({ ...p, codigo_fornecedor: fo.codigo }))
                      setFornecedorAberta(false)
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '7px 12px',
                      fontSize: 12.5,
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      #{fo.codigo}
                    </span>{' '}
                    · {fo.nome}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ gridColumn: '1 / -1', position: 'relative' }} ref={contaRef}>
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Observação / Conta
            </label>
            <input
              value={form.observacao}
              onChange={(e) => {
                // Digitar por cima de uma sugestão já escolhida desfaz o
                // match — só fica gravado codigo_plano_conta quando a
                // pessoa realmente clica numa opção da lista.
                setForm((p) => ({ ...p, observacao: e.target.value, codigo_plano_conta: null }))
                setContaAberta(true)
              }}
              onFocus={() => setContaAberta(true)}
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid var(--border-md)',
              }}
              placeholder='Ex: Água e Esgoto — ou digite livre'
            />
            {contaAberta && contasFiltradas.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  marginTop: 2,
                  background: 'var(--surface)',
                  border: '1px solid var(--border-md)',
                  borderRadius: 8,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {contasFiltradas.map((c) => (
                  <button
                    key={c.codigo}
                    onClick={() => {
                      setForm((p) => ({ ...p, observacao: c.descricao, codigo_plano_conta: c.codigo }))
                      setContaAberta(false)
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '7px 12px',
                      fontSize: 12.5,
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {c.grupo && (
                      <span style={{ color: 'var(--text-muted)' }}>{c.grupo} › </span>
                    )}
                    {c.descricao}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
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
                border: '1px solid var(--border-md)',
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
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
                border: '1px solid var(--border-md)',
              }}
              placeholder='0,00'
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
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
                border: '1px solid var(--border-md)',
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
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
                border: '1px solid var(--border-md)',
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
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              display: 'block',
              marginBottom: 4,
            }}
          >
            Valor cheio da fatura (opcional)
          </label>
          <input
            value={form.valor_fatura_cheia}
            onChange={f('valor_fatura_cheia')}
            type='number'
            step='0.01'
            style={{
              width: '100%',
              height: 36,
              padding: '0 10px',
              borderRadius: 8,
              border: '1px solid var(--border-md)',
            }}
            placeholder='Só se a conta acima já for a metade/fatia da loja'
          />
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
            Não afeta o caixa — é só pra lembrar o valor total da fatura quando "Valor (R$)" já é a parte da loja numa conta dividida (ex: internet, celular).
          </div>
        </div>
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
            disabled={!valido || salvando}
            onClick={handleSalvar}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              background: valido ? '#185FA5' : 'var(--border-md)',
              color: valido ? 'var(--surface)' : 'var(--text-muted)',
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

export default function ContasPagar({ usuario }) {
  // Criar/excluir conta continua nível 2 (Elter/admin). Confirmar pagamento
  // de uma conta já lançada é liberado a partir do nível 1 (Rosângela) —
  // decisão deliberada e escopada: ver banco/migracao_contas_pagar_pagar_nivel1.sql.
  const podeCriarConta = (usuario?.nivel ?? 0) >= 2
  const podePagarConta = (usuario?.nivel ?? 0) >= 1
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  // Padrão mostra só vencidos+abertos (situacao_docto='A' no banco já cobre os
  // dois — a distinção é só a data de vencimento). Pagos/cancelados ficam de
  // fora até o usuário filtrar por eles explicitamente — não somem, só não
  // poluem a lista à primeira vista.
  const [filtroStatus, setFiltroStatus] = useState('aberto')
  const [selecionadas, setSelecionadas] = useState([])
  const [lotePagamento, setLotePagamento] = useState(null)
  const [modalNova, setModalNova] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [fornecedorFixoMap, setFornecedorFixoMap] = useState(new Map())

  useEffect(() => {
    window.api.gastosOperacionais.fornecedoresFixos()
      .then((lista) => setFornecedorFixoMap(new Map((lista || []).map((g) => [g.codigo_fornecedor, g]))))
      .catch((err) => console.error('Erro ao carregar gastos fixos:', err))
  }, [])

  async function carregar() {
    setLoading(true)
    try {
      const filtros = {}
      if (filtroStatus === 'aberto') filtros.situacao = 'A'
      if (filtroStatus === 'pago') filtros.situacao = 'P'

      const result = await window.api.contasPagar.listar(filtros)
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

  const { ordenados, coluna, direcao, alternar } = useOrdenacao(filtrados, {
    acessores: {
      nome_fornecedor: (c) => c.nome_fornecedor || c.codigo_fornecedor || '',
      situacao: (c) => getSituacao(c),
    },
  })

  // ── Relatório (Excel/PDF), agrupado por fornecedor e em ordem alfabética ──
  function exportarExcel() {
    const grupos = agruparPorPessoa(filtrados, { codigoKey: 'codigo_fornecedor', nomeKey: 'nome_fornecedor' })
    const linhas = []
    for (const g of grupos) {
      for (const c of g.itens) {
        linhas.push({
          Documento: c.nro_docto || '—',
          Fornecedor: g.codigo ? `${g.nome} (#${g.codigo})` : g.nome,
          Vencimento: fmtDate(c.data_vencimento),
          'Valor (R$)': (c.valor_docto || 0).toFixed(2).replace('.', ','),
          Situação: STATUS_CFG[getSituacao(c)].label,
        })
      }
      const subtotal = g.itens.reduce((s, c) => s + (c.valor_docto || 0), 0)
      linhas.push({
        Documento: '',
        Fornecedor: `SUBTOTAL — ${g.codigo ? `${g.nome} (#${g.codigo})` : g.nome}`,
        Vencimento: '',
        'Valor (R$)': subtotal.toFixed(2).replace('.', ','),
        Situação: '',
      })
    }
    const totalGeral = filtrados.reduce((s, c) => s + (c.valor_docto || 0), 0)
    linhas.push({
      Documento: '',
      Fornecedor: 'TOTAL GERAL',
      Vencimento: '',
      'Valor (R$)': totalGeral.toFixed(2).replace('.', ','),
      Situação: '',
    })
    exportarCSV(linhas, `contas_pagar_${new Date().toISOString().slice(0, 10)}`)
  }

  async function gerarRelatorioPDF() {
    const empresa = await buscarEmpresa()
    const grupos = agruparPorPessoa(filtrados, { codigoKey: 'codigo_fornecedor', nomeKey: 'nome_fornecedor' })
    const colunas = [
      { label: 'Documento' },
      { label: 'Vencimento' },
      { label: 'Valor', num: true },
      { label: 'Situação' },
    ]
    const totalGeral = filtrados.reduce((s, c) => s + (c.valor_docto || 0), 0)
    const html = gerarHtmlAgrupadoPorPessoa({
      empresa,
      titulo: 'Contas a Pagar',
      subtitulo: `${filtrados.length} conta(s) — gerado em ${fmtDate(new Date().toISOString().slice(0, 10))}`,
      colunas,
      grupos,
      montarLinha: (c) =>
        `<tr><td>${c.nro_docto || '—'}</td><td>${fmtDate(c.data_vencimento)}</td><td class="num">${fmtMoedaBR(c.valor_docto)}</td><td>${STATUS_CFG[getSituacao(c)].label}</td></tr>`,
      montarSubtotal: (g) => {
        const subtotal = g.itens.reduce((s, c) => s + (c.valor_docto || 0), 0)
        return `<td colspan="2">Subtotal</td><td class="num">${fmtMoedaBR(subtotal)}</td><td></td>`
      },
      montarTotalGeral: () => `<td colspan="2">TOTAL GERAL</td><td class="num">${fmtMoedaBR(totalGeral)}</td><td></td>`,
    })
    await gerarPdfRelatorio(html, `contas_pagar_${new Date().toISOString().slice(0, 10)}`)
  }

  // Só faz sentido marcar como "selecionada para pagar" uma conta que ainda
  // não foi paga/cancelada — por isso a seleção em si já filtra isso, em vez
  // de deixar marcar qualquer linha e só bloquear o botão depois.
  function toggleSel(id) {
    const conta = dados.find((c) => c.id === id)
    if (!conta) return
    const sit = getSituacao(conta)
    if (sit === 'PAGO' || sit === 'CANCELADO') return
    setSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  // Recebe a lista já conferida no modal (uma conta ou um lote) e quita cada
  // uma via a mesma RPC de sempre — não existe um "pagar em lote" no banco,
  // então repete a chamada já auditada por conta em vez de criar uma nova via
  // de escrita direta na tabela.
  async function confirmarPagamento(pagamentos, forma, data) {
    const contasAlvo = dados.filter((c) => pagamentos.some((p) => p.id === c.id))
    const pagas = []
    const falhas = []
    for (const p of pagamentos) {
      const conta = contasAlvo.find((c) => c.id === p.id)
      try {
        const resultado = await window.api.contasPagar.pagar({
          id: p.id,
          forma,
          valor_pagamento: p.valor_pagamento,
          valor_desconto: p.valor_desconto || 0,
          data_pagamento: data,
          usuario: usuario?.usuario || 'sistema',
        })
        if (resultado?.sucesso) pagas.push(conta)
        else falhas.push({ conta, erro: resultado?.erro || 'Erro desconhecido.' })
      } catch (err) {
        falhas.push({ conta, erro: err.message })
      }
    }

    setLotePagamento(null)
    setSelecionadas([])
    await carregar()

    if (falhas.length > 0) {
      await window.api.dialog.alert(
        `${pagas.length} conta(s) paga(s) com sucesso.\n${falhas.length} falharam:\n` +
          falhas
            .map((f) => `• ${f.conta?.nome_fornecedor || '—'} (#${f.conta?.codigo_fornecedor || '?'}): ${f.erro}`)
            .join('\n'),
      )
    }

    if (pagas.length > 0) {
      setSucesso(`✅ ${pagas.length} conta(s) paga(s)!`)
      setTimeout(() => setSucesso(''), 2500)
      try {
        await gerarRelatorioPagamento(pagas)
      } catch (err) {
        console.error('Erro ao gerar relatório de pagamento:', err)
      }
    }
  }

  // Relatório em duas seções: o que acabou de ser pago nesta operação e tudo
  // que ainda continua em aberto no sistema (não só o que está filtrado na
  // tela no momento) — é a conferência que a secretária leva pro Elter.
  async function gerarRelatorioPagamento(pagas) {
    const abertas = await window.api.contasPagar.listar({ situacao: 'A' })
    const empresa = await buscarEmpresa()
    const colunas = [
      { label: 'Fornecedor' },
      { label: 'Documento' },
      { label: 'Vencimento' },
      { label: 'Valor', num: true },
    ]
    const montarLinha = (c) =>
      `<tr><td>${c.nome_fornecedor || '—'} (#${c.codigo_fornecedor})</td><td>${c.nro_docto || '—'}</td><td>${fmtDate(c.data_vencimento)}</td><td class="num">${fmtMoedaBR(c.valor_docto)}</td></tr>`
    const totalPagas = pagas.reduce((s, c) => s + (c.valor_docto || 0), 0)
    const totalAbertas = abertas.reduce((s, c) => s + (c.valor_docto || 0), 0)
    const html = gerarHtmlSecoes({
      empresa,
      titulo: 'Pagamento de Contas',
      subtitulo: `Gerado em ${fmtDate(new Date().toISOString().slice(0, 10))}`,
      secoes: [
        {
          titulo: 'Pagas nesta operação',
          colunas,
          linhas: pagas,
          montarLinha,
          montarTotal: () => `<td colspan="3">Total pago</td><td class="num">${fmtMoedaBR(totalPagas)}</td>`,
        },
        {
          titulo: 'Ainda em aberto',
          colunas,
          linhas: abertas,
          montarLinha,
          montarTotal: () => `<td colspan="3">Total em aberto</td><td class="num">${fmtMoedaBR(totalAbertas)}</td>`,
        },
      ],
    })
    await gerarPdfRelatorio(html, `pagamento_contas_${new Date().toISOString().slice(0, 10)}`)
  }

  async function salvarNova(form) {
    try {
      await window.api.contasPagar.salvar({
        codigo_fornecedor: form.codigo_fornecedor,
        codigo_plano_conta: form.codigo_plano_conta || null,
        observacao: form.observacao,
        nro_docto: form.nro_docto,
        valor_docto: parseFloat(form.valor_docto),
        valor_fatura_cheia: form.valor_fatura_cheia ? parseFloat(form.valor_fatura_cheia) : null,
        data_vencimento: form.data_vencimento,
        data_docto: hojeLocal(),
        codigo_forma_pagamento: form.codigo_forma_pagamento,
        situacao_docto: 'A',
        usuario: usuario?.usuario || 'sistema',
      })
      setModalNova(false)
      setSucesso('✅ Conta adicionada!')
      setTimeout(() => setSucesso(''), 2500)
      await carregar()
    } catch (err) {
      console.error('Erro ao salvar conta:', err)
    }
  }

  // A seleção já só admite contas ABERTO/VENCIDO (ver toggleSel), então aqui
  // só falta checar permissão e se há algo selecionado.
  const podePagar = podePagarConta && selecionadas.length > 0
  const contasSelecionadas = dados.filter((c) => selecionadas.includes(c.id))

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
          {sucesso}
        </div>
      )}

      {lotePagamento && (
        <ModalConfirmarPagamento
          contas={lotePagamento}
          onClose={() => setLotePagamento(null)}
          onConfirm={confirmarPagamento}
          fornecedorFixoMap={fornecedorFixoMap}
        />
      )}
      {modalNova && (
        <ModalNova onClose={() => setModalNova(false)} onSalvar={salvarNova} />
      )}

      {/* ── TOPO ── */}
      <div
        style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border-md)' }}
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
                color: 'var(--text-muted)',
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
            <option value='aberto'>Em aberto</option>
            <option value='vencido'>Vencido</option>
            <option value='pago'>Pago</option>
            <option value='todos'>Todos</option>
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
          {podeCriarConta && (
            <button
              onClick={() => setModalNova(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 34,
                padding: '0 14px',
                background: '#185FA5',
                color: 'var(--surface)',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
              }}
            >
              <Plus size={14} /> Nova conta
            </button>
          )}
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
                  { label: 'Fornecedor', chave: 'nome_fornecedor' },
                  { label: 'Documento', chave: 'nro_docto' },
                  { label: 'Vencimento', chave: 'data_vencimento' },
                  { label: 'Valor', chave: 'valor_docto' },
                  { label: 'Dt. Pagamento', chave: 'data_pagamento' },
                  { label: 'Forma', chave: 'codigo_forma_pagamento' },
                  { label: 'Situação', chave: 'situacao' },
                ].map((h) => (
                  <ThOrdenavel
                    key={h.chave}
                    label={h.label}
                    chave={h.chave}
                    colunaAtual={coluna}
                    direcao={direcao}
                    onOrdenar={alternar}
                    style={thStyle}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {ordenados.map((c) => {
                const sel = selecionadas.includes(c.id)
                const sit = getSituacao(c)
                const vencido = sit === 'VENCIDO'
                const selecionavel = sit === 'ABERTO' || sit === 'VENCIDO'
                const gastoFixo = fornecedorFixoMap.get(c.codigo_fornecedor)
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
                      borderLeft: gastoFixo ? `3px solid ${corGastoFixo(gastoFixo.id)}` : '3px solid transparent',
                      cursor: selecionavel ? 'pointer' : 'default',
                      opacity: selecionavel ? 1 : 0.7,
                      transition: 'background 0.08s',
                    }}
                    title={gastoFixo ? `Gasto fixo do Ponto de Equilíbrio: ${gastoFixo.descricao}` : undefined}
                    onMouseEnter={(e) => {
                      if (!sel && selecionavel)
                        e.currentTarget.style.background = vencido
                          ? '#FEE2E2'
                          : 'var(--gray-50)'
                    }}
                    onMouseLeave={(e) => {
                      if (!sel && selecionavel)
                        e.currentTarget.style.background = vencido
                          ? '#FFF5F5'
                          : 'transparent'
                    }}
                  >
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <input
                        type='checkbox'
                        checked={sel}
                        disabled={!selecionavel}
                        onChange={() => toggleSel(c.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: 14, height: 14, cursor: selecionavel ? 'pointer' : 'not-allowed' }}
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
                      {c.nome_fornecedor || '—'} (#{c.codigo_fornecedor})
                      {c.observacao && (
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
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
                        color: sit === 'PAGO' ? 'var(--text-muted)' : 'var(--text-primary)',
                      }}
                    >
                      {fmt(c.valor_docto)}
                      {c.valor_fatura_cheia && (
                        <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)' }}>
                          fatura cheia: {fmt(c.valor_fatura_cheia)}
                        </div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: 'var(--text-muted)' }}>
                      {fmtDate(c.data_pagamento)}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: 'var(--text-muted)' }}>
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
        <BotoesRelatorio onExportarExcel={exportarExcel} onGerarPDF={gerarRelatorioPDF} abrirParaCima />
        <div style={{ flex: 1 }} />
        {podePagarConta && (
          <button
            disabled={!podePagar}
            onClick={() => podePagar && setLotePagamento(contasSelecionadas)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 34,
              padding: '0 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: podePagar ? '#185FA5' : 'var(--border-md)',
              color: podePagar ? 'var(--surface)' : 'var(--text-muted)',
              cursor: podePagar ? 'pointer' : 'not-allowed',
              border: 'none',
            }}
          >
            <DollarSign size={14} />
            {selecionadas.length > 1 ? `Pagar (${selecionadas.length})` : 'Pagar'}
          </button>
        )}
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
