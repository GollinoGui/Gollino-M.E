import { useState, useRef, useEffect } from 'react'
import logoGollino from '../../assets/gollino-logo.png'
import {
  ShoppingCart,
  FileText,
  Undo2,
  Wallet,
  Users,
  Package,
  BarChart2,
  Settings,
  Wrench,
  ChevronDown,
  X,
  FolderOpen,
  TrendingUp,
  FileBarChart,
  Cog,
  Database,
  DollarSign,
  BookOpen,
  ClipboardList,
  RotateCcw,
  Banknote,
  Receipt,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  AlertCircle,
  ScrollText,
  LogOut,
} from 'lucide-react'
import { Sun, Moon } from 'lucide-react'
const menus = [
  {
    id: 'operacional',
    label: 'Operacional',
    items: [
      { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
      { id: 'pre-vendas', label: 'Pré-Vendas', icon: FileText },
      { id: 'devolucao', label: 'Devolução', icon: Undo2 },
      { id: 'contas-receber', label: 'Contas a receber', icon: Wallet },
      { id: 'boletos', label: 'Boletos', icon: Receipt },
      { id: 'despesas', label: 'Despesas', icon: ArrowDownCircle },
      { id: 'sangrias', label: 'Sangrias', icon: ArrowDownCircle },
      { id: 'reforcos-caixa', label: 'Reforços caixa', icon: ArrowUpCircle },
      { id: 'vales', label: 'Vales', icon: Banknote },
      { id: 'abrir-caixa', label: 'Abrir caixa', icon: FolderOpen },
      { id: 'fechar-caixa', label: 'Fechar caixa', icon: X },
      {
        id: 'contador-dinheiro',
        label: 'Contador de dinheiro',
        icon: DollarSign,
      },
      { id: 'clientes', label: 'Clientes', icon: Users },
      { id: 'produtos', label: 'Produtos', icon: Package },
    ],
  },
  {
    id: 'estoque',
    label: 'Estoque',
    items: [
      {
        id: 'entrada-mercadoria',
        label: 'Entrada de mercadoria',
        icon: ArrowDownCircle,
      },
      { id: 'pedido-compra', label: 'Pedido de compra', icon: ClipboardList },
      {
        id: 'saida-mercadoria',
        label: 'Saída de mercadoria',
        icon: ArrowUpCircle,
      },
      { id: 'acerto-estoque', label: 'Acerto de estoque', icon: Settings },
      {
        id: 'contagem-estoque',
        label: 'Contagem de estoque',
        icon: ClipboardList,
      },
      {
        id: 'movimento-produto',
        label: 'Movimento de produto',
        icon: TrendingUp,
      },
      {
        id: 'consulta-reajustes',
        label: 'Consulta de reajustes',
        icon: Search,
      },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    items: [
      { id: 'caixas-fechados', label: 'Caixas fechados', icon: FolderOpen },
      { id: 'haver', label: 'Haver', icon: Wallet },
      { id: 'cheques-receber', label: 'Cheques a receber', icon: CreditCard },
      { id: 'cheques-pagar', label: 'Cheques a pagar', icon: CreditCard },
      { id: 'contas-pagar', label: 'Contas a pagar', icon: DollarSign },
      { id: 'outras-receitas', label: 'Outras receitas', icon: ArrowUpCircle },
      {
        id: 'consulta-recebimentos',
        label: 'Consulta de recebimentos',
        icon: Search,
      },
      {
        id: 'consulta-pagamentos',
        label: 'Consulta de pagamentos',
        icon: Search,
      },
    ],
  },
  {
    id: 'fiscal',
    label: 'Fiscal',
    items: [
      { id: 'nfe', label: 'NF-e', icon: FileText },
      { id: 'arquivo-contador', label: 'Arquivo contador', icon: Database },
      { id: 'documentos-fiscais', label: 'Documentos fiscais', icon: FileText },
      {
        id: 'manifestacao',
        label: 'Manifestação destinatário',
        icon: AlertCircle,
      },
      { id: 'acerto-fiscal', label: 'Acerto fiscal', icon: Settings },
      { id: 'movimento-fiscal', label: 'Movimento fiscal', icon: TrendingUp },
    ],
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    items: [
      { id: 'rel-vendas', label: 'Relatórios de vendas', icon: BarChart2 },
      { id: 'rel-pre-venda', label: 'Itens pré-venda', icon: FileBarChart },
      {
        id: 'rel-entradas',
        label: 'Relatórios entradas',
        icon: ArrowDownCircle,
      },
      { id: 'rel-produtos', label: 'Relatórios produtos', icon: Package },
      {
        id: 'rel-contas-pagar',
        label: 'Relatórios contas a pagar',
        icon: DollarSign,
      },
      {
        id: 'rel-contas-receber',
        label: 'Relatórios contas a receber',
        icon: Wallet,
      },
      { id: 'rel-financeiro', label: 'Relatórios financeiros', icon: BookOpen },
    ],
  },
  {
    id: 'cadastros',
    label: 'Cadastros',
    items: [
      { id: 'cad-clientes', label: 'Clientes', icon: Users },
      { id: 'cad-produtos', label: 'Produtos', icon: Package },
      { id: 'cad-fornecedores', label: 'Fornecedores', icon: Users },
    ],
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    items: [
      { id: 'config-empresa', label: 'Dados da empresa', icon: Database },
      { id: 'config-sistema', label: 'Configurações', icon: Cog },
      { id: 'importacao', label: 'Importar CSV', icon: ArrowDownCircle },
      { id: 'manutencao', label: 'Manutenção', icon: Wrench },
      { id: 'log-sistema', label: 'Log do sistema', icon: ScrollText },
    ],
  },
]

export default function TopBar({
  activePage,
  onNavigate,
  caixaAberto,
  temaEscuro,
  setTemaEscuro,
  usuario,
  onLogout,
}) {
  const [openMenu, setOpenMenu] = useState(null)
  const [dropdownLeft, setDropdownLeft] = useState(0)
  const menuRef = useRef(null)

  function toggleTema() {
    document.body.classList.toggle('dark')
    setTemaEscuro((prev) => !prev)
  }
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setOpenMenu(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleItem(id) {
    setOpenMenu(null)
    onNavigate(id)
  }

  return (
    <div
      style={{
        height: 46,
        background: 'var(--blue-700)',
        display: 'flex',
        alignItems: 'stretch',
        position: 'relative',
        zIndex: 1000,
        flexShrink: 0,
      }}
      ref={menuRef}
    >
      <div
        onClick={() => onNavigate('dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 16px',
          borderRight: '1px solid rgba(255,255,255,0.12)',
          flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        <img
          src={logoGollino}
          alt='Gollino M.E'
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            flexShrink: 0,
            objectFit: 'cover',
          }}
        />
        <span
          className='topbar-logo-text'
          style={{
            color: 'var(--surface)',
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: '-0.2px',
            whiteSpace: 'nowrap',
          }}
        >
          Gollino M.E
        </span>
      </div>

      <div
        className='topbar-nav'
        style={{
          display: 'flex',
          alignItems: 'stretch',
          flex: 1,
          overflowX: 'auto',
          overflowY: 'visible',
          scrollbarWidth: 'none',
        }}
      >
        {menus.map((menu) => {
          const isOpen = openMenu === menu.id
          const hasActive = menu.items.some((i) => i.id === activePage)
          return (
            <div key={menu.id} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setDropdownLeft(rect.left)
                  setOpenMenu((prev) => (prev === menu.id ? null : menu.id))
                }}
                style={{
                  height: '100%',
                  padding: '0 11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color:
                    isOpen || hasActive ? 'var(--surface)' : 'rgba(255,255,255,0.72)',
                  background: isOpen
                    ? 'rgba(255,255,255,0.15)'
                    : hasActive
                      ? 'rgba(255,255,255,0.1)'
                      : 'transparent',
                  borderRight: '1px solid rgba(255,255,255,0.07)',
                  fontSize: 13,
                  fontWeight: isOpen || hasActive ? 500 : 400,
                  transition: 'all 0.12s',
                  whiteSpace: 'nowrap',
                }}
              >
                {menu.label}
                <ChevronDown
                  size={12}
                  style={{
                    opacity: 0.7,
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s',
                  }}
                />
              </button>

              {isOpen && (
                <div
                  style={{
                    position: 'fixed',
                    top: 46,
                    left: dropdownLeft,
                    minWidth: 230,
                    background: 'var(--surface)',
                    border: '1px solid var(--border-md)',
                    borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    overflow: 'hidden',
                    zIndex: 2000,
                    animation: 'fadeIn 0.12s ease both',
                  }}
                >
                  {menu.items.map((item, idx) => {
                    const Icon = item.icon
                    const isActive = activePage === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItem(item.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 14px',
                          fontSize: 13,
                          color: isActive
                            ? 'var(--blue-700)'
                            : 'var(--text-primary)',
                          background: isActive
                            ? 'var(--blue-50)'
                            : 'transparent',
                          borderBottom:
                            idx < menu.items.length - 1
                              ? '1px solid var(--border)'
                              : 'none',
                          textAlign: 'left',
                          transition: 'background 0.1s',
                          fontWeight: isActive ? 500 : 400,
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive)
                            e.currentTarget.style.background = 'var(--gray-50)'
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive)
                            e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <Icon
                          size={14}
                          style={{
                            color: isActive
                              ? 'var(--blue-600)'
                              : 'var(--text-muted)',
                            flexShrink: 0,
                          }}
                        />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div
        className='topbar-right'
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          flexShrink: 0,
          borderLeft: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <button
          onClick={toggleTema}
          title={temaEscuro ? 'Tema claro' : 'Tema escuro'}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')
          }
        >
          {temaEscuro ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button
          className='topbar-search-btn'
          onClickCapture={() =>
            window.dispatchEvent(
              new KeyboardEvent('keydown', {
                ctrlKey: true,
                key: 'k',
                bubbles: true,
              }),
            )
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 12px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 99,
            fontSize: 12,
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')
          }
        >
          <Search size={12} />
          <span className='topbar-search-text'>Buscar</span>
          <kbd
            className='topbar-search-kbd'
            style={{
              padding: '1px 5px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 4,
              fontSize: 10,
              fontFamily: 'monospace',
            }}
          >
            Ctrl+K
          </kbd>
        </button>

        <div
          className='topbar-caixa-status'
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 20,
            padding: '4px 10px',
            fontSize: 12,
            color: 'var(--surface)',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: caixaAberto ? '#4ade80' : '#f87171',
              flexShrink: 0,
            }}
          />
          <span className='topbar-caixa-text'>
            {caixaAberto ? 'Caixa aberto' : 'Caixa fechado'}
          </span>
        </div>
        <span className='topbar-user' style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
          {usuario?.nome || usuario?.usuario || ''}
        </span>
        <button
          onClick={() => {
            if (window.confirm('Sair do sistema?')) onLogout?.()
          }}
          title='Sair'
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(220,38,38,0.35)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
          }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  )
}
