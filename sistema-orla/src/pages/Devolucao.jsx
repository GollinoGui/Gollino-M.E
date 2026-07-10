import { useState } from 'react'
import { Search, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react'

const fmt = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-'

export default function Devolucao({ usuario }) {
  const [busca, setBusca] = useState('')
  const [venda, setVenda] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [qtds, setQtds] = useState({})       // { codigo_produto: qtd_devolver }
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')

  async function buscarVenda() {
    if (!busca.trim()) return
    setLoading(true)
    setErro('')
    setVenda(null)
    setQtds({})
    try {
      const v = await window.api.vendas.buscar(busca.trim())
      if (!v) { setErro('Venda não encontrada.'); return }
      if (v.situacao === 'C') { setErro('Esta venda está cancelada.'); return }
      if (v.situacao === 'D') { setErro('Esta venda já foi devolvida.'); return }
      setVenda(v)
      // inicia qtds com 0
      const inicial = {}
      for (const item of v.itens || []) inicial[item.codigo_produto] = 0
      setQtds(inicial)
    } catch (e) {
      setErro('Erro ao buscar venda.')
    } finally {
      setLoading(false)
    }
  }

  function disponivelDevolucao(item) {
    return Math.max(0, (item?.quantidade || 0) - (item?.quantidade_devolvida || 0))
  }

  function setQtd(cod, val) {
    const item = venda?.itens?.find(i => i.codigo_produto === cod)
    const max = disponivelDevolucao(item)
    const v = Math.min(Math.max(0, parseFloat(val) || 0), max)
    setQtds(prev => ({ ...prev, [cod]: v }))
  }

  const itensDevolver = Object.entries(qtds)
    .filter(([, q]) => q > 0)
    .map(([cod, q]) => ({ codigo_produto: cod, quantidade: q }))

  const totalDevolver = itensDevolver.reduce((s, i) => {
    const orig = venda?.itens?.find(it => it.codigo_produto === i.codigo_produto)
    return s + (orig?.preco_unitario || 0) * i.quantidade
  }, 0)

  async function confirmarDevolucao() {
    if (itensDevolver.length === 0) { setErro('Selecione pelo menos um item para devolver.'); return }
    setSalvando(true)
    setErro('')
    try {
      const resultado = await window.api.vendas.devolver({
        orcamento: venda.orcamento,
        itens: itensDevolver,
        usuario: usuario?.usuario || 'sistema',
        motivo: motivo || 'Devolução',
      })
      if (!resultado.sucesso) {
        setErro(resultado.erro)
        return
      }
      setSucesso(`Devolução registrada! ${fmt(resultado.totalDevolvido)} creditados no haver do cliente.`)
      setVenda(null)
      setBusca('')
      setMotivo('')
      setTimeout(() => setSucesso(''), 5000)
    } catch (e) {
      setErro('Erro ao registrar devolução.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24, background: 'var(--bg)' }}>
      {sucesso && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#22543D', fontSize: 14 }}>
          <CheckCircle size={18} style={{ color: '#38A169', flexShrink: 0 }} />
          {sucesso}
        </div>
      )}

      {/* Busca da venda */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Buscar venda para devolução</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscarVenda()}
              placeholder='Número da venda (ex: 00000001)...'
              style={{ width: '100%', height: 38, paddingLeft: 32, borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 14 }}
            />
          </div>
          <button onClick={buscarVenda} disabled={loading}
            style={{ height: 38, padding: '0 20px', background: 'var(--blue-700)', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {erro && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, color: '#C53030', fontSize: 13 }}>
            <AlertTriangle size={14} /> {erro}
          </div>
        )}
      </div>

      {/* Dados da venda encontrada */}
      {venda && (
        <>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>VENDA #{venda.orcamento}</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{venda.nome_cliente || 'Consumidor'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {fmtDate(venda.data)} · {venda.codigo_forma_pagamento1 || '—'} · Total: <strong>{fmt(venda.valor_total)}</strong>
                </div>
              </div>
              <button onClick={() => { setVenda(null); setBusca('') }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid var(--border-md)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', background: 'var(--surface)' }}>
                <ArrowLeft size={13} /> Limpar
              </button>
            </div>

            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 10 }}>SELECIONE OS ITENS A DEVOLVER</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Código', 'Descrição', 'Qtd vendida', 'Já devolvida', 'Preço unit.', 'Qtd a devolver', 'Valor'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(venda.itens || []).map(item => {
                  const qtdDev = qtds[item.codigo_produto] || 0
                  const valorItem = qtdDev * (item.preco_unitario || 0)
                  const disponivel = disponivelDevolucao(item)
                  return (
                    <tr key={item.codigo_produto}
                      style={{ background: qtdDev > 0 ? 'var(--amber-50)' : 'transparent' }}
                      onMouseEnter={e => { if (qtdDev === 0) e.currentTarget.style.background = 'var(--gray-50)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = qtdDev > 0 ? 'var(--amber-50)' : 'transparent' }}>
                      <td style={{ padding: '8px 10px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', borderBottom: '1px solid var(--border)' }}>{item.codigo_produto}</td>
                      <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{item.descricao}</td>
                      <td style={{ padding: '8px 10px', fontSize: 13, borderBottom: '1px solid var(--border)', textAlign: 'center' }}>{item.quantidade}</td>
                      <td style={{ padding: '8px 10px', fontSize: 13, borderBottom: '1px solid var(--border)', textAlign: 'center', color: item.quantidade_devolvida > 0 ? 'var(--amber-600)' : 'var(--text-muted)' }}>{item.quantidade_devolvida || 0}</td>
                      <td style={{ padding: '8px 10px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{fmt(item.preco_unitario)}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                        <input
                          type='number' min='0' max={disponivel} step='1'
                          value={qtdDev || ''}
                          onChange={e => setQtd(item.codigo_produto, e.target.value)}
                          placeholder='0'
                          disabled={disponivel === 0}
                          style={{ width: 70, height: 30, padding: '0 8px', borderRadius: 6, border: '1px solid var(--border-md)', fontSize: 13, textAlign: 'center', background: disponivel === 0 ? 'var(--gray-50)' : 'var(--surface)' }}
                        />
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600, color: qtdDev > 0 ? 'var(--amber-600)' : 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                        {qtdDev > 0 ? fmt(valorItem) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} style={{ padding: '10px', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--gray-50)', borderTop: '1px solid var(--border)' }}>
                    Total a devolver
                  </td>
                  <td style={{ padding: '10px', fontSize: 14, fontWeight: 700, color: 'var(--amber-600)', background: 'var(--gray-50)', borderTop: '1px solid var(--border)' }}>
                    {fmt(totalDevolver)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Motivo e confirmação */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Motivo da devolução</label>
              <input
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder='Ex: produto com defeito, troca de tamanho...'
                style={{ width: '100%', height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13 }}
              />
            </div>

            <div style={{ background: 'var(--amber-50)', border: '1px solid var(--amber-200)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#92400E' }}>
              <strong>Atenção:</strong> O valor <strong>{fmt(totalDevolver)}</strong> será creditado no haver do cliente. O estoque dos itens selecionados será reposto.
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setVenda(null); setBusca('') }}
                style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border-md)', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', background: 'var(--surface)' }}>
                Cancelar
              </button>
              <button onClick={confirmarDevolucao} disabled={salvando || itensDevolver.length === 0}
                style={{ padding: '9px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: salvando || itensDevolver.length === 0 ? 'not-allowed' : 'pointer',
                  background: salvando || itensDevolver.length === 0 ? 'var(--gray-200)' : 'var(--amber-500)',
                  color: salvando || itensDevolver.length === 0 ? 'var(--text-muted)' : '#fff' }}>
                {salvando ? 'Registrando...' : `Confirmar devolução — ${fmt(totalDevolver)}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
