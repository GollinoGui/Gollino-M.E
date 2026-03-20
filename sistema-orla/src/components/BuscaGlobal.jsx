import { useState, useEffect, useRef } from 'react'
import {
  Search,
  ShoppingCart,
  Users,
  Package,
  Wallet,
  X,
  ArrowRight,
  Command,
} from 'lucide-react'
import { clientes, produtos, contasReceber } from '../data/mock'

const fmt = (v) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const paginas = [
  {
    id: 'vendas',
    label: 'Vendas',
    desc: 'Abrir tela de vendas',
    icon: ShoppingCart,
    categoria: 'Páginas',
  },
  {
    id: 'pre-vendas',
    label: 'Pré-Vendas',
    desc: 'Abrir pré-vendas / condicional',
    icon: ShoppingCart,
    categoria: 'Páginas',
  },
  {
    id: 'contas-receber',
    label: 'Contas a receber',
    desc: 'Ver parcelas em aberto',
    icon: Wallet,
    categoria: 'Páginas',
  },
  {
    id: 'contas-pagar',
    label: 'Contas a pagar',
    desc: 'Ver contas a pagar',
    icon: Wallet,
    categoria: 'Páginas',
  },
  {
    id: 'clientes',
    label: 'Clientes',
    desc: 'Gerenciar clientes',
    icon: Users,
    categoria: 'Páginas',
  },
  {
    id: 'produtos',
    label: 'Produtos',
    desc: 'Gerenciar produtos e estoque',
    icon: Package,
    categoria: 'Páginas',
  },
  {
    id: 'abrir-caixa',
    label: 'Abrir caixa',
    desc: 'Abrir o caixa do dia',
    icon: ShoppingCart,
    categoria: 'Páginas',
  },
  {
    id: 'fechar-caixa',
    label: 'Fechar caixa',
    desc: 'Fechar o caixa do dia',
    icon: ShoppingCart,
    categoria: 'Páginas',
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    desc: 'Ver relatórios',
    icon: ShoppingCart,
    categoria: 'Páginas',
  },
  {
    id: 'config-empresa',
    label: 'Configurações',
    desc: 'Configurar a empresa',
    icon: ShoppingCart,
    categoria: 'Páginas',
  },
]

export default function BuscaGlobal({ onNavigate, onClose }) {
  const [query, setQuery] = useState('')
  const [selecionado, setSelecionado] = useState(0)
  const inputRef = useRef(null)
  const listaRef = useRef(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const resultados =
    query.trim().length < 1
      ? []
      : (() => {
          const q = query.toLowerCase()
          const res = []

          paginas
            .filter(
              (p) =>
                p.label.toLowerCase().includes(q) ||
                p.desc.toLowerCase().includes(q),
            )
            .forEach((p) => res.push({ tipo: 'pagina', ...p }))

          clientes
            .filter(
              (c) =>
                c.nome.toLowerCase().includes(q) ||
                c.cpf_cnpj?.includes(q) ||
                c.codigo.includes(q),
            )
            .slice(0, 4)
            .forEach((c) =>
              res.push({
                tipo: 'cliente',
                id: 'clientes',
                label: c.nome,
                desc: c.cpf_cnpj || c.codigo,
                icon: Users,
                categoria: 'Clientes',
                dados: c,
              }),
            )

          produtos
            .filter(
              (p) =>
                p.descricao.toLowerCase().includes(q) || p.codigo.includes(q),
            )
            .slice(0, 4)
            .forEach((p) =>
              res.push({
                tipo: 'produto',
                id: 'produtos',
                label: p.descricao,
                desc: `${fmt(p.preco_vista)} · Estoque: ${p.estoque}`,
                icon: Package,
                categoria: 'Produtos',
                dados: p,
              }),
            )

          contasReceber
            .filter(
              (c) =>
                c.cliente_nome.toLowerCase().includes(q) ||
                c.documento.includes(q),
            )
            .filter((c) => c.situacao === 'ABERTO')
            .slice(0, 3)
            .forEach((c) =>
              res.push({
                tipo: 'conta',
                id: 'contas-receber',
                label: c.cliente_nome,
                desc: `Doc. ${c.documento} · ${fmt(c.em_aberto)} em aberto`,
                icon: Wallet,
                categoria: 'Contas a receber',
                dados: c,
              }),
            )

          return res
        })()

  const sugestoesRapidas = [
    { id: 'vendas', label: 'Nova venda', icon: ShoppingCart },
    { id: 'contas-receber', label: 'Contas a receber', icon: Wallet },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'clientes', label: 'Clientes', icon: Users },
  ]

  useEffect(() => {
    setSelecionado(0)
  }, [query])

  useEffect(() => {
    function handler(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelecionado((prev) =>
          Math.min(
            prev + 1,
            (resultados.length || sugestoesRapidas.length) - 1,
          ),
        )
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelecionado((prev) => Math.max(prev - 1, 0))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (resultados.length > 0) {
          onNavigate(resultados[selecionado].id)
          onClose()
        } else if (!query) {
          onNavigate(sugestoesRapidas[selecionado].id)
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selecionado, resultados, query])

  function selecionar(id) {
    onNavigate(id)
    onClose()
  }

  const categorias = [...new Set(resultados.map((r) => r.categoria))]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(12,63,122,0.35)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 80,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @keyframes buscaEntrada {
          from { opacity: 0; transform: translateY(-16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .busca-item { transition: background 0.1s; cursor: pointer; }
        .busca-item:hover, .busca-item.ativo { background: #EBF3FC !important; }
      `}</style>

      <div
        style={{
          width: 580,
          background: '#fff',
          borderRadius: 18,
          border: '1px solid #E2EAF4',
          boxShadow: '0 24px 60px rgba(12,63,122,0.2)',
          overflow: 'hidden',
          animation: 'buscaEntrada 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid #EEF3F9',
          }}
        >
          <Search size={18} style={{ color: '#185FA5', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Buscar páginas, clientes, produtos, contas...'
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: '#1A202C',
              background: 'transparent',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ color: '#9AA3B2', flexShrink: 0 }}
            >
              <X size={16} />
            </button>
          )}
          <kbd
            style={{
              padding: '2px 7px',
              background: '#F0F4FA',
              border: '1px solid #DDE1E9',
              borderRadius: 6,
              fontSize: 11,
              color: '#4A5568',
              fontFamily: 'monospace',
            }}
          >
            ESC
          </kbd>
        </div>

        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {!query && (
            <div style={{ padding: '14px 18px' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#9AA3B2',
                  marginBottom: 8,
                  letterSpacing: '0.05em',
                }}
              >
                ACESSO RÁPIDO
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}
              >
                {sugestoesRapidas.map((s, i) => (
                  <button
                    key={s.id}
                    className={`busca-item ${selecionado === i ? 'ativo' : ''}`}
                    onClick={() => selecionar(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: '#F8FAFD',
                      border: '1px solid #EEF3F9',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #EBF3FC, #C5DEFA)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <s.icon size={15} style={{ color: '#185FA5' }} />
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#1A202C',
                      }}
                    >
                      {s.label}
                    </span>
                    <ArrowRight
                      size={12}
                      style={{ color: '#9AA3B2', marginLeft: 'auto' }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && resultados.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#9AA3B2' }}>
              <Search size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                Nenhum resultado para "{query}"
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                Tente buscar por nome, código ou documento
              </div>
            </div>
          )}

          {query &&
            resultados.length > 0 &&
            categorias.map((cat) => (
              <div key={cat}>
                <div
                  style={{
                    padding: '10px 18px 4px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#9AA3B2',
                    letterSpacing: '0.05em',
                  }}
                >
                  {cat.toUpperCase()}
                </div>
                {resultados
                  .filter((r) => r.categoria === cat)
                  .map((r, i) => {
                    const idx = resultados.indexOf(r)
                    return (
                      <button
                        key={i}
                        className={`busca-item ${selecionado === idx ? 'ativo' : ''}`}
                        onClick={() => selecionar(r.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 18px',
                          background: 'transparent',
                          border: 'none',
                          textAlign: 'left',
                        }}
                        onMouseEnter={() => setSelecionado(idx)}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: '#F0F4FA',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <r.icon size={15} style={{ color: '#185FA5' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: '#1A202C',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {r.label}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: '#9AA3B2',
                              marginTop: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {r.desc}
                          </div>
                        </div>
                        <ArrowRight
                          size={13}
                          style={{ color: '#C8CDD8', flexShrink: 0 }}
                        />
                      </button>
                    )
                  })}
              </div>
            ))}
        </div>

        <div
          style={{
            padding: '10px 18px',
            borderTop: '1px solid #EEF3F9',
            background: '#F8FAFD',
            display: 'flex',
            gap: 16,
            alignItems: 'center',
          }}
        >
          {[
            { tecla: '↑↓', desc: 'navegar' },
            { tecla: 'Enter', desc: 'selecionar' },
            { tecla: 'Esc', desc: 'fechar' },
          ].map((t) => (
            <div
              key={t.tecla}
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <kbd
                style={{
                  padding: '2px 7px',
                  background: '#fff',
                  border: '1px solid #DDE1E9',
                  borderRadius: 5,
                  fontSize: 11,
                  color: '#4A5568',
                  fontFamily: 'monospace',
                }}
              >
                {t.tecla}
              </kbd>
              <span style={{ fontSize: 11, color: '#9AA3B2' }}>{t.desc}</span>
            </div>
          ))}
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Command size={11} style={{ color: '#9AA3B2' }} />
            <span style={{ fontSize: 11, color: '#9AA3B2' }}>
              Ctrl+K para abrir
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
