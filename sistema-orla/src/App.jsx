import { useState, useEffect } from 'react'
import TopBar from './components/layout/TopBar'
import Dashboard from './pages/Dashboard'
import Vendas from './pages/Vendas'
import ContasReceber from './pages/ContasReceber'
import Clientes from './pages/Clientes'
import Produtos from './pages/Produtos'
import Caixa from './pages/Caixa'
import PreVendas from './pages/PreVendas'
import ContasPagar from './pages/ContasPagar'
import Estoque from './pages/Estoque'
import Relatorios from './pages/Relatorios'
import Devolucao from './pages/Devolucao'
import Haver from './pages/Haver'
import Importacao from './pages/Importacao'
import EmBreve from './pages/EmBreve'
import Configuracoes from './pages/Configuracoes'
import Manutencao from './pages/Manutencao'
import LogSistema from './pages/LogSistema'
import NotaFiscal from './pages/NotaFiscal'
import Cheques from './pages/Cheques'
import LancamentosExtras from './pages/LancamentosExtras'
import ContadorDinheiro from './pages/ContadorDinheiro'
import Assistente from './components/Assistente'
import BuscaGlobal from './components/BuscaGlobal'
import Login from './pages/Login'
import AtalhosTecla from './components/AtalhosTecla'
import AvisoCaixaAtrasado from './components/AvisoCaixaAtrasado'

const CHAVE_SESSAO = 'gollino_sessao'

function hojeStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const titulos = {
  dashboard: 'Início',
  vendas: 'Vendas',
  'pre-vendas': 'Pré-Vendas',
  devolucao: 'Devolução',
  'contas-receber': 'Contas a receber',
  boletos: 'Boletos',
  despesas: 'Despesas',
  sangrias: 'Sangrias',
  'reforcos-caixa': 'Reforços de caixa',
  vales: 'Vales',
  'abrir-caixa': 'Caixa',
  'fechar-caixa': 'Caixa',
  'contador-dinheiro': 'Contador de dinheiro',
  clientes: 'Clientes',
  produtos: 'Produtos',
  'entrada-mercadoria': 'Estoque — Entrada de mercadoria',
  'pedido-compra': 'Estoque — Pedido de compra',
  'saida-mercadoria': 'Estoque — Saída de mercadoria',
  'acerto-estoque': 'Estoque — Acerto de estoque',
  'contagem-estoque': 'Estoque — Contagem',
  'movimento-produto': 'Estoque — Movimento de produto',
  'consulta-reajustes': 'Estoque — Consulta de reajustes',
  'estoque-consulta': 'Estoque',
  'estoque-posicao': 'Estoque — Posição de estoque',
  'caixas-fechados': 'Financeiro — Caixas fechados',
  haver: 'Financeiro — Haver',
  'cheques-receber': 'Financeiro — Cheques a receber',
  'cheques-pagar': 'Financeiro — Cheques a pagar',
  'contas-pagar': 'Contas a pagar',
  'outras-receitas': 'Financeiro — Outras receitas',
  'consulta-recebimentos': 'Financeiro — Consulta de recebimentos',
  'consulta-pagamentos': 'Financeiro — Consulta de pagamentos',
  nfe: 'Fiscal — NF-e',
  'arquivo-contador': 'Fiscal — Arquivo contador',
  'documentos-fiscais': 'Fiscal — Documentos fiscais',
  manifestacao: 'Fiscal — Manifestação destinatário',
  'acerto-fiscal': 'Fiscal — Acerto fiscal',
  'movimento-fiscal': 'Fiscal — Movimento fiscal',
  'rel-vendas': 'Relatórios — Vendas',
  'rel-pre-venda': 'Relatórios — Pré-vendas',
  'rel-entradas': 'Relatórios — Entradas',
  'rel-produtos': 'Relatórios — Produtos',
  'rel-contas-pagar': 'Relatórios — Contas a pagar',
  'rel-contas-receber': 'Relatórios — Contas a receber',
  'rel-financeiro': 'Relatórios — Financeiro',
  'cad-clientes': 'Clientes',
  'cad-produtos': 'Produtos',
  'cad-fornecedores': 'Cadastro — Fornecedores',
  'config-empresa': 'Configurações — Dados da empresa',
  'config-sistema': 'Configurações',
  manutencao: 'Manutenção',
  'log-sistema': 'Log do Sistema',
}

export default function App() {
  const [pagina, setPagina] = useState('dashboard')
  const [caixaAberto, setCaixaAberto] = useState(false)
  const [caixaAtrasado, setCaixaAtrasado] = useState(null)
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [usuario, setUsuario] = useState(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_SESSAO)
      return salvo ? JSON.parse(salvo) : null
    } catch {
      return null
    }
  })
  const [temaEscuro, setTemaEscuro] = useState(false)

  function handleLogout() {
    window.api.auth.logout().catch(() => {})
    localStorage.removeItem(CHAVE_SESSAO)
    setUsuario(null)
    setPagina('dashboard')
  }

  useEffect(() => {
    window.api.caixa.status().then((s) => {
      setCaixaAberto(s?.situacao === 'A')
      if (s?.situacao === 'A' && s.data_abertura !== hojeStr()) {
        setCaixaAtrasado(s)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    function handler(e) {
      const tag = document.activeElement?.tagName
      const digitando =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      // Ctrl+K — busca global (sempre ativo)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setBuscaAberta((prev) => !prev)
        return
      }

      // Atalhos de função — só quando não está digitando em campo
      if (!digitando) {
        switch (e.key) {
          case 'F1':
            e.preventDefault()
            setBuscaAberta((prev) => !prev)
            break
          case 'F2':
            e.preventDefault()
            setPagina('vendas')
            break
          case 'F3':
            e.preventDefault()
            setPagina('pre-vendas')
            break
          case 'F4':
            e.preventDefault()
            setPagina('contas-receber')
            break
          case 'F5':
            e.preventDefault()
            setPagina('produtos')
            break
          case 'F6':
            e.preventDefault()
            setPagina('clientes')
            break
          case 'F7':
            e.preventDefault()
            setPagina('estoque-consulta')
            break
          case 'F8':
            e.preventDefault()
            setPagina('dashboard')
            break
          case 'Escape':
            if (buscaAberta) setBuscaAberta(false)
            else if (pagina !== 'dashboard') setPagina('dashboard')
            break
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [buscaAberta, pagina])

  // Nível mínimo exigido por página (ausente = livre para todos)
  // 1=operador  2=gerente  250=super
  const nivelMinimo = {
    // Super apenas
    'config-empresa':     250,
    'config-sistema':     250,
    'manutencao':         250,
    'importacao':         250,
    // Gerente apenas
    'caixas-fechados':      2,
    'contas-pagar':         2,
    'devolucao':            2,
    'haver':                2,
    'cheques-pagar':        2,
    'rel-financeiro':       2,
    'rel-contas-pagar':     2,
    // Operador e acima
    'contas-receber':       1,
    'fin-receber':          1,
    'cheques-receber':      1,
    'rel-contas-receber':   1,
    'rel-vendas':           1,
    'rel-pre-venda':        1,
    'rel-entradas':         1,
    'rel-produtos':         1,
    'rel-itens-vendidos':   1,
    'rel-inventario':       1,
    'rel-extrato':          2,
  }

  function renderPagina() {
    const nivelReq = nivelMinimo[pagina]
    if (nivelReq && (usuario?.nivel ?? 0) < nivelReq) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40 }}>🔒</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Acesso negado</div>
          <div style={{ fontSize: 13 }}>Seu nível de acesso não permite visualizar esta página.</div>
          <button onClick={() => setPagina('dashboard')} style={{ marginTop: 8, padding: '8px 20px', borderRadius: 8, background: 'var(--blue-700)', color: '#fff', fontSize: 13, border: 'none', cursor: 'pointer' }}>
            Voltar ao início
          </button>
        </div>
      )
    }

    switch (pagina) {
      // Dashboard
      case 'dashboard':
        return <Dashboard onNavigate={setPagina} caixaAberto={caixaAberto} usuario={usuario} />

      // Operacional
      case 'vendas':
        return <Vendas onNavigate={setPagina} usuario={usuario} />
      case 'pre-vendas':
        return <PreVendas usuario={usuario} />
      case 'devolucao':
        return <Devolucao usuario={usuario} />
      case 'contas-receber':
      case 'fin-receber':
        return <ContasReceber usuario={usuario} />
      case 'contas-pagar':
        return <ContasPagar usuario={usuario} />
      case 'haver':
        return <Haver usuario={usuario} />
      case 'importacao':
        return <Importacao />
      case 'abrir-caixa':
      case 'fechar-caixa':
        return (
          <Caixa caixaAberto={caixaAberto} setCaixaAberto={setCaixaAberto} usuario={usuario} onNavigate={setPagina} />
        )
      case 'clientes':
      case 'cad-clientes':
        return <Clientes />
      case 'produtos':
      case 'cad-produtos':
        return <Produtos usuario={usuario} />

      // Estoque
      case 'entrada-mercadoria':
      case 'movimento-produto':
      case 'estoque-consulta':
        return <Estoque abaInicial='movimentos' usuario={usuario} />
      case 'estoque-posicao':
        return <Estoque abaInicial='posicao' usuario={usuario} />
      case 'pedido-compra':
        return <Estoque abaInicial='pedido-compra' usuario={usuario} />
      case 'saida-mercadoria':
        return <Estoque abaInicial='saida-mercadoria' usuario={usuario} />
      case 'acerto-estoque':
        return <Estoque abaInicial='acerto-estoque' usuario={usuario} />
      case 'contagem-estoque':
        return <Estoque abaInicial='contagem-estoque' usuario={usuario} />
      case 'consulta-reajustes':
        return <Estoque abaInicial='reajustes' usuario={usuario} />

      // Relatórios
      case 'rel-vendas':
      case 'rel-pre-venda':
      case 'rel-entradas':
      case 'rel-produtos':
      case 'rel-contas-pagar':
      case 'rel-contas-receber':
      case 'rel-financeiro':
        return <Relatorios paginaAtiva={pagina} />

      //Configurações
      case 'config-empresa':
      case 'config-sistema':
        return <Configuracoes />
      case 'manutencao':
        return <Manutencao />
      case 'log-sistema':
        return <LogSistema />
      case 'nfe':
      case 'documentos-fiscais':
        return <NotaFiscal />

      // Financeiro
      case 'cheques-receber':
        return <Cheques tipo='R' />
      case 'cheques-pagar':
        return <Cheques tipo='P' />
      case 'outras-receitas':
        return <LancamentosExtras tipo='RECEITA' usuario={usuario} />
      case 'vales':
        return <LancamentosExtras tipo='VALE' usuario={usuario} />
      case 'despesas':
        return <LancamentosExtras tipo='DESPESA' usuario={usuario} />
      case 'contador-dinheiro':
        return <ContadorDinheiro />

      // Telas ainda não construídas
      default:
        return <EmBreve titulo={titulos[pagina] || pagina.replace(/-/g, ' ')} />
    }
  }

  const titulo = titulos[pagina] || pagina.replace(/-/g, ' ')
  if (!usuario) return <Login onLogin={setUsuario} />
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {caixaAtrasado && (
        <AvisoCaixaAtrasado
          status={caixaAtrasado}
          usuario={usuario}
          onFechado={() => {
            setCaixaAtrasado(null)
            setCaixaAberto(false)
          }}
        />
      )}
      <TopBar
        activePage={pagina}
        onNavigate={setPagina}
        caixaAberto={caixaAberto}
        temaEscuro={temaEscuro}
        setTemaEscuro={setTemaEscuro}
        usuario={usuario}
        onLogout={handleLogout}
      />
      <div
        style={{
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          height: 36,
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {pagina === 'dashboard' ? (
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              Início
            </span>
          ) : (
            <>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                {titulo}
              </span>
            </>
          )}
        </span>
      </div>
      <div
        style={{ flex: 1, overflow: 'hidden' }}
        className='fade-in'
        key={pagina}
      >
        {renderPagina()}
      </div>
      {buscaAberta && (
        <BuscaGlobal
          onNavigate={setPagina}
          onClose={() => setBuscaAberta(false)}
        />
      )}
      <Assistente caixaAberto={caixaAberto} onNavigate={setPagina} usuario={usuario} />
      <AtalhosTecla />
    </div>
  )
}
