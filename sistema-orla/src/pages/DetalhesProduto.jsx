import { useState } from 'react'
import { ArrowLeft, Package, Edit2, Save, X, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR') : '-'

const historicoPrecos = [
  { data: '2024-01-01', preco_vista: 28.50, preco_prazo: 31.00, usuario: 'Admin' },
  { data: '2023-10-01', preco_vista: 25.00, preco_prazo: 27.50, usuario: 'Admin' },
  { data: '2023-07-01', preco_vista: 22.00, preco_prazo: 24.00, usuario: 'Admin' },
]

const historicoMovimentos = [
  { data: '2024-01-22', tipo: 'ENTRADA', quantidade: 50, obs: 'NF 00456 — Aço Total', saldo: 92 },
  { data: '2024-01-20', tipo: 'SAIDA',   quantidade: 2,  obs: 'Venda #00001492',       saldo: 42 },
  { data: '2024-01-15', tipo: 'SAIDA',   quantidade: 5,  obs: 'Venda #00001488',       saldo: 44 },
  { data: '2024-01-10', tipo: 'ENTRADA', quantidade: 20, obs: 'NF 00123 — Calhas Brasil', saldo: 49 },
  { data: '2023-12-20', tipo: 'SAIDA',   quantidade: 8,  obs: 'Venda #00001470',       saldo: 29 },
]

export default function DetalhesProduto({ produto, onVoltar }) {
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ ...produto })
  const [abaAtiva, setAbaAtiva] = useState('Dados')
  const f = key => e => setForm(p => ({ ...p, [key]: e.target.value }))

  const abas = ['Dados', 'Estoque', 'Histórico de preços', 'Movimentos']

  const variacaoPreco = historicoPrecos.length > 1
    ? ((historicoPrecos[0].preco_vista - historicoPrecos[1].preco_vista) / historicoPrecos[1].preco_vista * 100).toFixed(1)
    : 0

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 16, height: 52, flexShrink: 0 }}>
        <button onClick={onVoltar} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', padding: '6px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-md)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <ArrowLeft size={14} /> Voltar
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={16} style={{ color: 'var(--blue-600)' }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{produto.descricao}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Código: {produto.codigo} · {produto.un}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {editando ? (
            <>
              <button onClick={() => setEditando(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-secondary)' }}>
                <X size={14} /> Cancelar
              </button>
              <button onClick={() => setEditando(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: 'var(--blue-700)', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500 }}>
                <Save size={14} /> Salvar
              </button>
            </>
          ) : (
            <button onClick={() => setEditando(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Edit2 size={14} /> Editar
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '16px 20px', background: '#fff', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {[
          { label: 'Preço vista',     value: fmt(produto.preco_vista),  color: 'var(--blue-700)',  bg: 'var(--blue-50)',  icon: TrendingUp },
          { label: 'Preço prazo',     value: fmt(produto.preco_prazo),  color: 'var(--gray-600)',  bg: 'var(--gray-100)', icon: TrendingUp },
          { label: 'Estoque atual',   value: `${produto.estoque} ${produto.un}`, color: produto.estoque === 0 ? 'var(--red-500)' : produto.estoque <= 5 ? 'var(--amber-500)' : 'var(--green-500)', bg: produto.estoque === 0 ? 'var(--red-50)' : produto.estoque <= 5 ? 'var(--amber-50)' : 'var(--green-50)', icon: Package },
          { label: 'Valor em estoque',value: fmt(produto.estoque * produto.preco_vista), color: 'var(--blue-700)', bg: 'var(--blue-50)', icon: TrendingUp },
        ].map(card => (
          <div key={card.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <card.icon size={16} style={{ color: card.color }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{card.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: card.color, whiteSpace: 'nowrap' }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '0 20px', display: 'flex', flexShrink: 0 }}>
        {abas.map(aba => (
          <button key={aba} onClick={() => setAbaAtiva(aba)} style={{
            padding: '12px 16px', fontSize: 13,
            fontWeight: abaAtiva === aba ? 500 : 400,
            color: abaAtiva === aba ? 'var(--blue-700)' : 'var(--text-secondary)',
            borderBottom: abaAtiva === aba ? '2px solid var(--blue-700)' : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.12s', whiteSpace: 'nowrap',
          }}>{aba}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

        {abaAtiva === 'Dados' && (
          <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 14 }}>INFORMAÇÕES GERAIS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { key: 'codigo',    label: 'Código',      readOnly: true, col: 1 },
                  { key: 'un',        label: 'Unidade',     col: 1 },
                  { key: 'descricao', label: 'Descrição *', col: 2 },
                  { key: 'preco_vista',  label: 'Preço vista (R$)',  col: 1, type: 'number' },
                  { key: 'preco_prazo',  label: 'Preço prazo (R$)', col: 1, type: 'number' },
                  { key: 'estoque',      label: 'Estoque atual',    col: 1, type: 'number' },
                  { key: 'estoque_minimo', label: 'Estoque mínimo', col: 1, type: 'number' },
                ].map(campo => (
                  <div key={campo.key} style={{ gridColumn: campo.col === 2 ? '1 / -1' : undefined }}>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{campo.label}</label>
                    {editando ? (
                      <input value={form[campo.key] || ''} onChange={f(campo.key)} type={campo.type || 'text'} readOnly={campo.readOnly}
                        style={{ width: '100%', height: 34, padding: '0 10px', background: campo.readOnly ? 'var(--gray-50)' : undefined }} />
                    ) : (
                      <div style={{ fontSize: 13, color: form[campo.key] ? 'var(--text-primary)' : 'var(--text-muted)', padding: '8px 0', borderBottom: '1px solid var(--border)', minHeight: 34, display: 'flex', alignItems: 'center' }}>
                        {form[campo.key] || '—'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 14 }}>DADOS FISCAIS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { key: 'ncm',    label: 'NCM' },
                  { key: 'cfop',   label: 'CFOP' },
                  { key: 'icms',   label: 'ICMS %',   type: 'number' },
                  { key: 'pis',    label: 'PIS %',    type: 'number' },
                  { key: 'cofins', label: 'COFINS %', type: 'number' },
                  { key: 'cest',   label: 'CEST' },
                ].map(campo => (
                  <div key={campo.key}>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{campo.label}</label>
                    {editando ? (
                      <input value={form[campo.key] || ''} onChange={f(campo.key)} type={campo.type || 'text'}
                        style={{ width: '100%', height: 34, padding: '0 10px' }} />
                    ) : (
                      <div style={{ fontSize: 13, color: form[campo.key] ? 'var(--text-primary)' : 'var(--text-muted)', padding: '8px 0', borderBottom: '1px solid var(--border)', minHeight: 34, display: 'flex', alignItems: 'center' }}>
                        {form[campo.key] || '—'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'Estoque' && (
          <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Estoque atual',   value: `${produto.estoque} ${produto.un}`, color: produto.estoque === 0 ? 'var(--red-500)' : produto.estoque <= 5 ? 'var(--amber-500)' : 'var(--green-500)' },
                { label: 'Estoque mínimo',  value: `${produto.estoque_minimo ?? 0} ${produto.un}`, color: 'var(--text-secondary)' },
                { label: 'Em condicional',  value: `${produto.condicional} ${produto.un}`, color: 'var(--blue-700)' },
              ].map(c => (
                <div key={c.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 14 }}>SITUAÇÃO DO ESTOQUE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {produto.estoque === 0 && (
                  <div style={{ background: 'var(--red-50)', border: '1px solid var(--red-100)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13, color: 'var(--red-500)', fontWeight: 500 }}>
                    Produto sem estoque — necessário repor
                  </div>
                )}
                {produto.estoque > 0 && produto.estoque <= 5 && (
                  <div style={{ background: 'var(--amber-50)', border: '1px solid var(--amber-100)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13, color: 'var(--amber-500)', fontWeight: 500 }}>
                    Estoque baixo — considere fazer uma nova entrada
                  </div>
                )}
                {produto.estoque > 5 && (
                  <div style={{ background: 'var(--green-50)', border: '1px solid var(--green-100)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13, color: 'var(--green-500)', fontWeight: 500 }}>
                    Estoque em nível normal
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Valor total em estoque</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue-700)' }}>{fmt(produto.estoque * produto.preco_vista)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Custo médio estimado</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)' }}>{fmt(produto.preco_vista * 0.65)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'Histórico de preços' && (
          <div style={{ maxWidth: 800 }}>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Variação de preço</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: parseFloat(variacaoPreco) >= 0 ? 'var(--green-500)' : 'var(--red-500)' }}>
                  {parseFloat(variacaoPreco) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {variacaoPreco}% desde a última atualização
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Data', 'Preço vista', 'Preço prazo', 'Alterado por', 'Variação'].map(h => (
                    <th key={h} style={{ padding: '8px 16px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {historicoPrecos.map((h, i) => {
                    const variacao = i < historicoPrecos.length - 1
                      ? ((h.preco_vista - historicoPrecos[i + 1].preco_vista) / historicoPrecos[i + 1].preco_vista * 100).toFixed(1)
                      : null
                    return (
                      <tr key={i} style={{ transition: 'background 0.08s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 16px', fontSize: 13, borderBottom: '1px solid var(--border)', fontWeight: i === 0 ? 500 : 400 }}>
                          {fmtDate(h.data)} {i === 0 && <span style={{ background: 'var(--blue-50)', color: 'var(--blue-700)', padding: '1px 6px', borderRadius: 10, fontSize: 10, marginLeft: 6 }}>atual</span>}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--blue-700)', borderBottom: '1px solid var(--border)' }}>{fmt(h.preco_vista)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{fmt(h.preco_prazo)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{h.usuario}</td>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                          {variacao !== null ? (
                            <span style={{ fontSize: 12, fontWeight: 500, color: parseFloat(variacao) >= 0 ? 'var(--green-500)' : 'var(--red-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              {parseFloat(variacao) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {variacao}%
                            </span>
                          ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {abaAtiva === 'Movimentos' && (
          <div style={{ maxWidth: 800 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <thead>
                <tr>{['Data', 'Tipo', 'Quantidade', 'Saldo após', 'Observação'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left', background: 'var(--gray-50)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {historicoMovimentos.map((m, i) => (
                  <tr key={i} style={{ transition: 'background 0.08s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 16px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{fmtDate(m.data)}</td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: m.tipo === 'ENTRADA' ? 'var(--green-50)' : 'var(--red-50)',
                        color: m.tipo === 'ENTRADA' ? 'var(--green-700)' : 'var(--red-500)',
                        padding: '2px 9px', borderRadius: 10, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
                      }}>
                        {m.tipo === 'ENTRADA' ? <ArrowDownCircle size={11} /> : <ArrowUpCircle size={11} />}
                        {m.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid var(--border)', color: m.tipo === 'ENTRADA' ? 'var(--green-500)' : 'var(--red-500)' }}>
                      {m.tipo === 'ENTRADA' ? '+' : '-'}{m.quantidade} {produto.un}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      {m.saldo} {produto.un}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{m.obs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}