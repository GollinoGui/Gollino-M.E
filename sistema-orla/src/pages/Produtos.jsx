import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Package,
  Loader2,
  AlertCircle,
  Trash2,
  Eye,
  X,
} from 'lucide-react'

const fmt = (v) =>
  (parseFloat(v) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

function maskMoney(v) {
  // Permite digitação livre com vírgula decimal (até 4 casas)
  return v.replace(/[^0-9,]/g, '')
}
function parseMoney(v) {
  return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0
}
function maskDecimal(v) {
  return v.replace(/[^0-9,\.]/g, '')
}

function EstoqueBadge({ qtd, minimo }) {
  const q = parseFloat(qtd) || 0
  const m = parseFloat(minimo) || 0
  const style = {
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    display: 'inline-block',
  }
  if (q === 0)
    return (
      <span style={{ ...style, background: '#fef2f2', color: '#dc2626' }}>
        Sem estoque
      </span>
    )
  if (q <= m)
    return (
      <span style={{ ...style, background: '#fffbeb', color: '#d97706' }}>
        Baixo: {q}
      </span>
    )
  return (
    <span style={{ ...style, background: '#f0fdf4', color: '#16a34a' }}>
      {q} un.
    </span>
  )
}

export default function Produtos({ usuario }) {
  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [busca, setBusca] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [editando, setEditando] = useState(null)
  const [novo, setNovo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [produtoDetalhes, setProdutoDetalhes] = useState(null)
  const [modalExcluir, setModalExcluir] = useState(null)
  const [senhaExcluir, setSenhaExcluir] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  const [excluindo, setExcluindo] = useState(false)

  const formVazio = {
    codigo: '',
    descricao: '',
    descricao_menor: '',
    codigo_grupo: '',
    codigo_linha: '',
    unidade: 'PC',
    ean: '',
    ncm: '',
    codigo_cest: '',
    preco_venda_vista: '',
    preco_venda_prazo: '',
    preco_custo_atual: '',
    estoque_atual: '',
    estoque_minimo: '',
    cfop_cfe: '5405',
    aliquota_icms: '',
    aliquota_pis: '',
    aliquota_cofins: '',
    situacao_produto: 'A',
    controla_estoque: 'S',
    observacao: '',
  }
  const [form, setForm] = useState(formVazio)

  const carregar = useCallback(async () => {
    try {
      setCarregando(true)
      setErro(null)
      const dados = await window.api.produtos.listar({
        busca,
        grupo: filtroGrupo,
        situacao: 'A',
      })
      setProdutos(dados || [])
    } catch (e) {
      setErro('Erro ao carregar produtos: ' + e.message)
    } finally {
      setCarregando(false)
    }
  }, [busca, filtroGrupo])

  useEffect(() => {
    const timer = setTimeout(carregar, 300)
    return () => clearTimeout(timer)
  }, [carregar])

  async function proximoCodigo() {
    const todos = await window.api.produtos.listar({})
    const maxCod = todos.reduce((max, p) => {
      const n = parseInt(p.codigo) || 0
      return n > max ? n : max
    }, 0)
    return String(maxCod + 1).padStart(8, '0')
  }

  function formParaExibir(p) {
    return {
      ...formVazio,
      ...p,
      preco_venda_vista: p.preco_venda_vista
        ? String(parseFloat(p.preco_venda_vista) || 0).replace('.', ',')
        : '',
      preco_venda_prazo: p.preco_venda_prazo
        ? String(parseFloat(p.preco_venda_prazo) || 0).replace('.', ',')
        : '',
      preco_custo_atual: p.preco_custo_atual
        ? String(parseFloat(p.preco_custo_atual) || 0).replace('.', ',')
        : '',
      estoque_atual:
        p.estoque_atual !== undefined ? String(p.estoque_atual) : '',
      estoque_minimo:
        p.estoque_minimo !== undefined ? String(p.estoque_minimo) : '',
      aliquota_icms:
        p.aliquota_icms !== undefined ? String(p.aliquota_icms) : '',
      aliquota_pis: p.aliquota_pis !== undefined ? String(p.aliquota_pis) : '',
      aliquota_cofins:
        p.aliquota_cofins !== undefined ? String(p.aliquota_cofins) : '',
    }
  }

  function abrirEditar(p) {
    setForm(formParaExibir(p))
    setEditando(p.codigo)
    setNovo(false)
    setProdutoDetalhes(null)
  }

  async function abrirNovo() {
    const codigo = await proximoCodigo()
    setForm({ ...formVazio, codigo })
    setNovo(true)
    setEditando(null)
    setProdutoDetalhes(null)
  }

  function fechar() {
    setEditando(null)
    setNovo(false)
    setForm(formVazio)
  }

  async function salvar() {
    if (!form.descricao.trim()) {
      alert('Descrição é obrigatória!')
      return
    }
    try {
      setSalvando(true)
      await window.api.produtos.salvar({
        ...form,
        preco_venda_vista: parseMoney(form.preco_venda_vista),
        preco_venda_prazo: parseMoney(form.preco_venda_prazo),
        preco_custo_atual: parseMoney(form.preco_custo_atual),
        estoque_atual: parseFloat(form.estoque_atual) || 0,
        estoque_minimo: parseFloat(form.estoque_minimo) || 0,
        aliquota_icms: parseFloat(form.aliquota_icms) || 0,
        aliquota_pis: parseFloat(form.aliquota_pis) || 0,
        aliquota_cofins: parseFloat(form.aliquota_cofins) || 0,
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
      let ok = false
      for (const usr of ['admin', 'elter', 'rosangela']) {
        const res = await window.api.auth.login({
          usuario: usr,
          senha: senhaExcluir,
        })
        if (res?.sucesso) {
          ok = true
          break
        }
      }
      if (!ok) {
        setErroSenha('Senha incorreta!')
        setExcluindo(false)
        return
      }
      await window.api.produtos.excluir(modalExcluir.codigo)
      setModalExcluir(null)
      setSenhaExcluir('')
      if (produtoDetalhes?.codigo === modalExcluir.codigo)
        setProdutoDetalhes(null)
      if (editando === modalExcluir.codigo) fechar()
      await carregar()
    } catch (e) {
      setErroSenha('Erro ao excluir: ' + e.message)
    } finally {
      setExcluindo(false)
    }
  }

  function campo(key, val) {
    setForm((p) => ({ ...p, [key]: val }))
  }

  const showForm = editando || novo

  // ── Vista com detalhes ─────────────────────────────────────
  if (produtoDetalhes) {
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
              padding: 10,
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
            {produtos.map((p) => (
              <div
                key={p.codigo}
                onClick={() => setProdutoDetalhes(p)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  background:
                    produtoDetalhes?.codigo === p.codigo
                      ? 'var(--blue-50)'
                      : 'transparent',
                  borderLeft:
                    produtoDetalhes?.codigo === p.codigo
                      ? '3px solid var(--blue-600)'
                      : '3px solid transparent',
                  transition: 'background 0.08s',
                }}
                onMouseEnter={(e) => {
                  if (produtoDetalhes?.codigo !== p.codigo)
                    e.currentTarget.style.background = 'var(--gray-50)'
                }}
                onMouseLeave={(e) => {
                  if (produtoDetalhes?.codigo !== p.codigo)
                    e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {p.descricao}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginTop: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontFamily: 'monospace' }}>#{p.codigo}</span>
                  <span>{fmt(p.preco_venda_vista)}</span>
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
            {produtos.length} produto(s)
          </div>
        </div>

        {/* Detalhes */}
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
              onClick={() => setProdutoDetalhes(null)}
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
                {produtoDetalhes.descricao}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontFamily: 'monospace',
                }}
              >
                #{produtoDetalhes.codigo} · {produtoDetalhes.unidade}
              </div>
            </div>
            <button
              onClick={() => abrirEditar(produtoDetalhes)}
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
                setModalExcluir(produtoDetalhes)
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
              {/* Cards resumo */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4,1fr)',
                  gap: 12,
                }}
              >
                {[
                  {
                    label: 'Preço Vista',
                    value: fmt(produtoDetalhes.preco_venda_vista),
                  },
                  {
                    label: 'Preço Prazo',
                    value: fmt(produtoDetalhes.preco_venda_prazo),
                  },
                  {
                    label: 'Custo',
                    value: fmt(produtoDetalhes.preco_custo_atual),
                  },
                  {
                    label: 'Estoque',
                    value: `${parseFloat(produtoDetalhes.estoque_atual) || 0} ${produtoDetalhes.unidade || 'un'}`,
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

              <Secao titulo='Dados do Produto'>
                <Grade>
                  <DadoItem label='Código' value={produtoDetalhes.codigo} />
                  <DadoItem label='Unidade' value={produtoDetalhes.unidade} />
                  <DadoItem
                    label='Descrição'
                    value={produtoDetalhes.descricao}
                    col={2}
                  />
                  <DadoItem
                    label='Descrição Reduzida'
                    value={produtoDetalhes.descricao_menor}
                    col={2}
                  />
                  <DadoItem
                    label='Grupo'
                    value={produtoDetalhes.codigo_grupo}
                  />
                  <DadoItem
                    label='Linha'
                    value={produtoDetalhes.codigo_linha}
                  />
                  <DadoItem
                    label='EAN / Cód. Barras'
                    value={produtoDetalhes.ean}
                  />
                  <DadoItem
                    label='Situação'
                    value={
                      produtoDetalhes.situacao_produto === 'A'
                        ? 'Ativo'
                        : 'Inativo'
                    }
                  />
                </Grade>
              </Secao>

              <Secao titulo='Estoque'>
                <Grade>
                  <DadoItem
                    label='Estoque Atual'
                    value={`${parseFloat(produtoDetalhes.estoque_atual) || 0} ${produtoDetalhes.unidade || 'un'}`}
                  />
                  <DadoItem
                    label='Estoque Mínimo'
                    value={`${parseFloat(produtoDetalhes.estoque_minimo) || 0} ${produtoDetalhes.unidade || 'un'}`}
                  />
                  <DadoItem
                    label='Controla Estoque'
                    value={
                      produtoDetalhes.controla_estoque === 'S' ? 'Sim' : 'Não'
                    }
                  />
                </Grade>
              </Secao>

              <Secao titulo='Dados Fiscais'>
                <Grade>
                  <DadoItem label='NCM' value={produtoDetalhes.ncm} />
                  <DadoItem label='CEST' value={produtoDetalhes.codigo_cest} />
                  <DadoItem label='CFOP' value={produtoDetalhes.cfop_cfe} />
                  <DadoItem
                    label='ICMS %'
                    value={produtoDetalhes.aliquota_icms}
                  />
                  <DadoItem
                    label='PIS %'
                    value={produtoDetalhes.aliquota_pis}
                  />
                  <DadoItem
                    label='COFINS %'
                    value={produtoDetalhes.aliquota_cofins}
                  />
                </Grade>
              </Secao>

              {produtoDetalhes.observacao && (
                <Secao titulo='Observação'>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                    {produtoDetalhes.observacao}
                  </p>
                </Secao>
              )}
            </div>
          </div>
        </div>

        {showForm && (
          <FormularioProduto
            form={form}
            campo={campo}
            novo={novo}
            salvando={salvando}
            onSalvar={salvar}
            onFechar={fechar}
          />
        )}
        {modalExcluir && (
          <ModalExcluir
            item={modalExcluir}
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

  // ── Vista lista ────────────────────────────────────────────
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
              placeholder='Buscar por descrição, código ou EAN...'
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

        <div style={{ flex: 1, overflowY: 'auto' }}>
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
              />{' '}
              Carregando produtos...
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
                <col style={{ width: 100 }} />
                <col />
                <col style={{ width: 90 }} />
                <col style={{ width: 90 }} />
                <col style={{ width: 44 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 130 }} />
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
                        zIndex: 1,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {produtos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: 40,
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: 13,
                      }}
                    >
                      {busca
                        ? 'Nenhum produto encontrado.'
                        : 'Nenhum produto cadastrado ainda.'}
                    </td>
                  </tr>
                ) : (
                  produtos.map((p) => (
                    <tr
                      key={p.codigo}
                      style={{
                        cursor: 'pointer',
                        background:
                          editando === p.codigo
                            ? 'var(--blue-50)'
                            : 'transparent',
                        transition: 'background 0.08s',
                      }}
                      onMouseEnter={(e) => {
                        if (editando !== p.codigo)
                          e.currentTarget.style.background = 'var(--gray-50)'
                      }}
                      onMouseLeave={(e) => {
                        if (editando !== p.codigo)
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
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
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
                        {fmt(p.preco_venda_vista)}
                      </td>
                      <td
                        style={{
                          padding: '9px 10px',
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {fmt(p.preco_venda_prazo)}
                      </td>
                      <td
                        style={{
                          padding: '9px 10px',
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {p.unidade}
                      </td>
                      <td
                        style={{
                          padding: '9px 10px',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <EstoqueBadge
                          qtd={p.estoque_atual}
                          minimo={p.estoque_minimo}
                        />
                      </td>
                      <td
                        style={{
                          padding: '9px 10px',
                          borderBottom: '1px solid var(--border)',
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
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
                            (e.currentTarget.style.background =
                              'var(--blue-50)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = 'transparent')
                          }
                        >
                          <Eye size={11} /> Ver
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
                            setModalExcluir(p)
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
            {produtos.length} produto(s)
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
        <FormularioProduto
          form={form}
          campo={campo}
          novo={novo}
          salvando={salvando}
          onSalvar={salvar}
          onFechar={fechar}
        />
      )}
      {modalExcluir && (
        <ModalExcluir
          item={modalExcluir}
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

// ── Formulário ─────────────────────────────────────────────────
function FormularioProduto({
  form,
  campo,
  novo,
  salvando,
  onSalvar,
  onFechar,
}) {
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
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: 'monospace',
          }}
        >
          #{form.codigo}
        </div>
      </div>
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
        >
          <C label='Código' col={1}>
            <input
              value={form.codigo}
              readOnly={!usuario?.super_usuario}
              onChange={(e) => campo('codigo', e.target.value)}
              style={{
                width: '100%',
                height: 34,
                padding: '0 10px',
                background: usuario?.super_usuario ? 'var(--bg)' : 'var(--gray-50)',
              }}
            />
          </C>
          <C label='Unidade' col={1}>
            <select
              value={form.unidade}
              onChange={(e) => campo('unidade', e.target.value)}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            >
              {['PC', 'UN', 'KG', 'MT', 'M2', 'CX', 'FD', 'RO', 'LT', 'GL'].map(
                (u) => (
                  <option key={u}>{u}</option>
                ),
              )}
            </select>
          </C>
          <C label='Descrição *' col={2}>
            <input
              value={form.descricao}
              onChange={(e) => campo('descricao', e.target.value.toUpperCase())}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </C>
          <C label='Descrição Reduzida' col={2}>
            <input
              value={form.descricao_menor || ''}
              onChange={(e) =>
                campo('descricao_menor', e.target.value.toUpperCase())
              }
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </C>
          <C label='EAN / Cód. Barras' col={1}>
            <input
              value={form.ean || ''}
              onChange={(e) => campo('ean', e.target.value.replace(/\D/g, ''))}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </C>
          <C label='Situação' col={1}>
            <select
              value={form.situacao_produto}
              onChange={(e) => campo('situacao_produto', e.target.value)}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            >
              <option value='A'>Ativo</option>
              <option value='I'>Inativo</option>
            </select>
          </C>

          <div
            style={{
              gridColumn: '1 / -1',
              borderTop: '1px solid var(--border)',
              paddingTop: 10,
              marginTop: 2,
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
              PREÇOS
            </div>
          </div>
          <C label='Preço Vista (R$)' col={1}>
            <input
              value={form.preco_venda_vista || ''}
              placeholder='0,00'
              onChange={(e) =>
                campo('preco_venda_vista', maskMoney(e.target.value))
              }
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </C>
          <C label='Preço Prazo (R$)' col={1}>
            <input
              value={form.preco_venda_prazo || ''}
              placeholder='0,00'
              onChange={(e) =>
                campo('preco_venda_prazo', maskMoney(e.target.value))
              }
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </C>
          <C label='Preço Custo (R$)' col={1}>
            <input
              value={form.preco_custo_atual || ''}
              placeholder='0,00'
              onChange={(e) =>
                campo('preco_custo_atual', maskMoney(e.target.value))
              }
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </C>

          <div
            style={{
              gridColumn: '1 / -1',
              borderTop: '1px solid var(--border)',
              paddingTop: 10,
              marginTop: 2,
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
              ESTOQUE
            </div>
          </div>
          <C label='Estoque Atual' col={1}>
            <input
              value={form.estoque_atual || ''}
              placeholder='0'
              onChange={(e) =>
                campo('estoque_atual', maskDecimal(e.target.value))
              }
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </C>
          <C label='Estoque Mínimo' col={1}>
            <input
              value={form.estoque_minimo || ''}
              placeholder='0'
              onChange={(e) =>
                campo('estoque_minimo', maskDecimal(e.target.value))
              }
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </C>
          <C label='Controla Estoque' col={1}>
            <select
              value={form.controla_estoque}
              onChange={(e) => campo('controla_estoque', e.target.value)}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            >
              <option value='S'>Sim</option>
              <option value='N'>Não</option>
            </select>
          </C>

          <div
            style={{
              gridColumn: '1 / -1',
              borderTop: '1px solid var(--border)',
              paddingTop: 10,
              marginTop: 2,
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
          <C label='NCM' col={1}>
            <input
              value={form.ncm || ''}
              onChange={(e) =>
                campo('ncm', e.target.value.replace(/\D/g, '').slice(0, 8))
              }
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </C>
          <C label='CEST' col={1}>
            <input
              value={form.codigo_cest || ''}
              onChange={(e) => campo('codigo_cest', e.target.value)}
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </C>
          <C label='CFOP' col={1}>
            <input
              value={form.cfop_cfe || ''}
              onChange={(e) =>
                campo('cfop_cfe', e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </C>
          <C label='ICMS %' col={1}>
            <input
              value={form.aliquota_icms || ''}
              placeholder='0'
              onChange={(e) =>
                campo('aliquota_icms', maskDecimal(e.target.value))
              }
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </C>
          <C label='PIS %' col={1}>
            <input
              value={form.aliquota_pis || ''}
              placeholder='0'
              onChange={(e) =>
                campo('aliquota_pis', maskDecimal(e.target.value))
              }
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </C>
          <C label='COFINS %' col={1}>
            <input
              value={form.aliquota_cofins || ''}
              placeholder='0'
              onChange={(e) =>
                campo('aliquota_cofins', maskDecimal(e.target.value))
              }
              style={{ width: '100%', height: 34, padding: '0 10px' }}
            />
          </C>

          <C label='Observação' col={2}>
            <textarea
              value={form.observacao || ''}
              onChange={(e) => campo('observacao', e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '8px 10px', resize: 'vertical' }}
            />
          </C>
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
  item,
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
            }}
          >
            <Trash2 size={20} style={{ color: '#dc2626' }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Excluir produto</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
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
          <div style={{ fontSize: 13, fontWeight: 600 }}>{item.descricao}</div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
            }}
          >
            #{item.codigo}
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
            Digite sua senha para confirmar:
          </label>
          <input
            type='password'
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onConfirmar()}
            placeholder='Sua senha'
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
function C({ label, col, children }) {
  return (
    <div style={{ gridColumn: col === 2 ? '1 / -1' : undefined }}>
      <label
        style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          display: 'block',
          marginBottom: 3,
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
