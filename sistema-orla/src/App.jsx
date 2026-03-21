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
import EmBreve from './pages/EmBreve'
import Configuracoes from './pages/Configuracoes'
import Assistente from './components/Assistente'
import BuscaGlobal from './components/BuscaGlobal'
import Login from './pages/Login'
import AtalhosTecla from './components/AtalhosTecla'
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
}

export default function App() {
  const [pagina, setPagina] = useState('dashboard')
  const [caixaAberto, setCaixaAberto] = useState(true)
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [usuario, setUsuario] = useState(null)
  const [temaEscuro, setTemaEscuro] = useState(false)
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

  function renderPagina() {
    switch (pagina) {
      // Dashboard
      case 'dashboard':
        return <Dashboard onNavigate={setPagina} caixaAberto={caixaAberto} />

      // Operacional
      case 'vendas':
        return <Vendas />
      case 'pre-vendas':
        return <PreVendas />
      case 'contas-receber':
      case 'fin-receber':
        return <ContasReceber />
      case 'contas-pagar':
        return <ContasPagar />
      case 'abrir-caixa':
      case 'fechar-caixa':
        return (
          <Caixa caixaAberto={caixaAberto} setCaixaAberto={setCaixaAberto} />
        )
      case 'clientes':
      case 'cad-clientes':
        return <Clientes />
      case 'produtos':
      case 'cad-produtos':
        return <Produtos />

      // Estoque
      case 'entrada-mercadoria':
      case 'saida-mercadoria':
      case 'acerto-estoque':
      case 'contagem-estoque':
      case 'movimento-produto':
      case 'consulta-reajustes':
      case 'estoque-consulta':
        return <Estoque />

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

      // Telas ainda não construídas
      default:
        return <EmBreve titulo={titulos[pagina] || pagina.replace(/-/g, ' ')} />
    }
  }

  const titulo = titulos[pagina] || pagina.replace(/-/g, ' ')
  if (!usuario) return <Login onLogin={setUsuario} />
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        activePage={pagina}
        onNavigate={setPagina}
        caixaAberto={caixaAberto}
        temaEscuro={temaEscuro}
        setTemaEscuro={setTemaEscuro}
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
      <Assistente caixaAberto={caixaAberto} onNavigate={setPagina} />
      <AtalhosTecla />
    </div>
  )
}
