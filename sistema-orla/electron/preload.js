const { contextBridge, ipcRenderer } = require('electron')

// Expõe API segura para o React via window.api
contextBridge.exposeInMainWorld('api', {

  // AUTH
  auth: {
    login: (dados) => ipcRenderer.invoke('auth:login', dados),
    logout: () => ipcRenderer.invoke('auth:logout'),
    verificarSenha: (dados) => ipcRenderer.invoke('auth:verificarSenha', dados),
    sessaoValida: () => ipcRenderer.invoke('auth:sessaoValida'),
  },

  // DIÁLOGOS (confirm/alert nativos via processo principal — ver main.js)
  dialog: {
    confirm: (mensagem) => ipcRenderer.invoke('dialog:confirm', mensagem),
    alert: (mensagem) => ipcRenderer.invoke('dialog:alert', mensagem),
  },

  // CICLO DE VIDA DO APP (fechar a janela intercepta e pergunta pro renderer
  // sobre o caixa aberto — ver main.js 'close' listener / ModalConfirmarSaida)
  app: {
    aoSolicitarFechamento: (callback) => {
      const listener = () => callback()
      ipcRenderer.on('app:solicitarFechamento', listener)
      return () => ipcRenderer.removeListener('app:solicitarFechamento', listener)
    },
    confirmarSaida: () => ipcRenderer.invoke('app:confirmarSaida'),
  },

  // ATUALIZAÇÕES (autoUpdater no main.js envia os eventos; UI é o ModalConfirmacao no React)
  updates: {
    aoDisponivel: (callback) => {
      const listener = () => callback()
      ipcRenderer.on('update:disponivel', listener)
      return () => ipcRenderer.removeListener('update:disponivel', listener)
    },
    aoBaixado: (callback) => {
      const listener = () => callback()
      ipcRenderer.on('update:baixado', listener)
      return () => ipcRenderer.removeListener('update:baixado', listener)
    },
    reiniciarAgora: () => ipcRenderer.invoke('update:reiniciarAgora'),
  },

  // CLIENTES
  clientes: {
    listar: (filtros) => ipcRenderer.invoke('clientes:listar', filtros),
    buscar: (codigo) => ipcRenderer.invoke('clientes:buscar', codigo),
    salvar: (dados) => ipcRenderer.invoke('clientes:salvar', dados),
    excluir: (codigo) => ipcRenderer.invoke('clientes:excluir', codigo),
  },

  // FORNECEDORES
  fornecedores: {
    listar: (filtros) => ipcRenderer.invoke('fornecedores:listar', filtros),
    buscar: (codigo) => ipcRenderer.invoke('fornecedores:buscar', codigo),
    salvar: (dados) => ipcRenderer.invoke('fornecedores:salvar', dados),
    excluir: (codigo) => ipcRenderer.invoke('fornecedores:excluir', codigo),
  },

  // HISTÓRICOS
  historicos: {
    listar: (filtros) => ipcRenderer.invoke('historicos:listar', filtros),
    salvar: (dados) => ipcRenderer.invoke('historicos:salvar', dados),
    excluir: (codigo) => ipcRenderer.invoke('historicos:excluir', codigo),
  },

  // PLANO DE CONTAS
  planoContas: {
    listar: (filtros) => ipcRenderer.invoke('planoContas:listar', filtros),
    salvar: (dados) => ipcRenderer.invoke('planoContas:salvar', dados),
    excluir: (codigo) => ipcRenderer.invoke('planoContas:excluir', codigo),
  },

  // PRODUTOS
  produtos: {
    listar: (filtros) => ipcRenderer.invoke('produtos:listar', filtros),
    buscar: (codigo) => ipcRenderer.invoke('produtos:buscar', codigo),
    salvar: (dados) => ipcRenderer.invoke('produtos:salvar', dados),
    excluir: (codigo) => ipcRenderer.invoke('produtos:excluir', codigo),
  },

  // VENDAS
  vendas: {
    listar: (filtros) => ipcRenderer.invoke('vendas:listar', filtros),
    buscar: (orcamento) => ipcRenderer.invoke('vendas:buscar', orcamento),
    salvar: (dados) => ipcRenderer.invoke('vendas:salvar', dados),
    cancelar: (dados) => ipcRenderer.invoke('vendas:cancelar', dados),
    devolver: (dados) => ipcRenderer.invoke('vendas:devolver', dados),
    proximoNumero: () => ipcRenderer.invoke('vendas:proximoNumero'),
  },

  // CONTAS A RECEBER
  contasReceber: {
    listar: (filtros) => ipcRenderer.invoke('contasReceber:listar', filtros),
    receber: (dados) => ipcRenderer.invoke('contasReceber:receber', dados),
    totalAberto: () => ipcRenderer.invoke('contasReceber:totalAberto'),
    baixarPrejuizo: (dados) => ipcRenderer.invoke('contasReceber:baixarPrejuizo', dados),
    listarPagamentos: (filtros) => ipcRenderer.invoke('contasReceber:listarPagamentos', filtros),
  },

  // CONTAS A PAGAR
  contasPagar: {
    listar: (filtros) => ipcRenderer.invoke('contasPagar:listar', filtros),
    pagar: (dados) => ipcRenderer.invoke('contasPagar:pagar', dados),
    salvar: (dados) => ipcRenderer.invoke('contasPagar:salvar', dados),
    totalAberto: () => ipcRenderer.invoke('contasPagar:totalAberto'),
  },

  // CAIXA
  caixa: {
    status: () => ipcRenderer.invoke('caixa:status'),
    abrir: (dados) => ipcRenderer.invoke('caixa:abrir', dados),
    fechar: (dados) => ipcRenderer.invoke('caixa:fechar', dados),
    resumoAtual: () => ipcRenderer.invoke('caixa:resumoAtual'),
    historico: (filtros) => ipcRenderer.invoke('caixa:historico', filtros),
    sangria: (dados) => ipcRenderer.invoke('caixa:sangria', dados),
    reforco: (dados) => ipcRenderer.invoke('caixa:reforco', dados),
  },

  // MANUTENÇÃO
  manutencao: {
    corrigirCR: () => ipcRenderer.invoke('manutencao:corrigirCR'),
  },

  // DASHBOARD
  dashboard: {
    resumo: (periodo) => ipcRenderer.invoke('dashboard:resumo', periodo),
  },

  // FINANCEIRO (lucro real — restrito a nível 250)
  financeiro: {
    resumoPeriodo: (dataInicio, dataFim) => ipcRenderer.invoke('financeiro:resumoPeriodo', { dataInicio, dataFim }),
    historicoMensal: (meses) => ipcRenderer.invoke('financeiro:historicoMensal', meses),
  },

  // CONFIGURAÇÕES
  config: {
    get: (chave) => ipcRenderer.invoke('config:get', chave),
    set: (dados) => ipcRenderer.invoke('config:set', dados),
  },

  // USUÁRIOS (aba "Usuários" em Configurações — esconder itens de menu)
  usuarios: {
    listar: () => ipcRenderer.invoke('usuarios:listar'),
    salvarMenusOcultos: (usuario, menusOcultos) => ipcRenderer.invoke('usuarios:salvarMenusOcultos', { usuario, menusOcultos }),
  },

  // BACKUP
  backup: {
    exportar: () => ipcRenderer.invoke('backup:exportar'),
    importar: () => ipcRenderer.invoke('backup:importar'),
  },

  // PRÉ-VENDAS
  preVendas: {
    listar: (filtros) => ipcRenderer.invoke('preVendas:listar', filtros),
    buscar: (numero) => ipcRenderer.invoke('preVendas:buscar', numero),
    salvar: (dados) => ipcRenderer.invoke('preVendas:salvar', dados),
    cancelar: (numero) => ipcRenderer.invoke('preVendas:cancelar', numero),
    baixar: (numero) => ipcRenderer.invoke('preVendas:baixar', numero),
    converter: (dados) => ipcRenderer.invoke('preVendas:converter', dados),
    proximoNumero: () => ipcRenderer.invoke('preVendas:proximoNumero'),
  },

  // MOVIMENTOS DE ESTOQUE
  movimentosEstoque: {
    listar: (filtros) => ipcRenderer.invoke('movimentosEstoque:listar', filtros),
    salvar: (dados) => ipcRenderer.invoke('movimentosEstoque:salvar', dados),
  },

  // PDF
  pdf: {
    gerarVenda: (orcamento) => ipcRenderer.invoke('pdf:gerarVenda', orcamento),
    gerarRelatorio: (html, nomeArquivo) => ipcRenderer.invoke('pdf:gerarRelatorio', { html, nomeArquivo }),
  },

  // IMPORTAÇÃO
  importar: {
    abrirArquivo: () => ipcRenderer.invoke('importar:abrirArquivo'),
    produtos: (conteudo) => ipcRenderer.invoke('importar:produtos', conteudo),
    clientes: (conteudo) => ipcRenderer.invoke('importar:clientes', conteudo),
  },

  // HAVER
  haver: {
    listar: (busca) => ipcRenderer.invoke('haver:listar', busca),
    ajustar: (dados) => ipcRenderer.invoke('haver:ajustar', dados),
    totalGeral: () => ipcRenderer.invoke('haver:totalGeral'),
  },

  // LOG DO SISTEMA
  log: {
    listar: (filtros) => ipcRenderer.invoke('log:listar', filtros),
  },

  // NF-e
  nfe: {
    listar: (filtros) => ipcRenderer.invoke('nfe:listar', filtros),
    registrar: (dados) => ipcRenderer.invoke('nfe:registrar', dados),
    detalhes: (orcamento) => ipcRenderer.invoke('nfe:detalhes', orcamento),
    abrirPortal: (url) => ipcRenderer.invoke('nfe:abrirPortal', url),
  },

  // PEDIDOS DE COMPRA
  pedidosCompra: {
    listar: (filtros) => ipcRenderer.invoke('pedidosCompra:listar', filtros),
    salvar: (dados) => ipcRenderer.invoke('pedidosCompra:salvar', dados),
    cancelar: (numero, usuario) => ipcRenderer.invoke('pedidosCompra:cancelar', { numero, usuario }),
    receber: (numero, usuario) => ipcRenderer.invoke('pedidosCompra:receber', { numero, usuario }),
    proximoNumero: () => ipcRenderer.invoke('pedidosCompra:proximoNumero'),
  },

  // CHEQUES
  cheques: {
    listar: (filtros) => ipcRenderer.invoke('cheques:listar', filtros),
    salvar: (dados) => ipcRenderer.invoke('cheques:salvar', dados),
    baixar: (dados) => ipcRenderer.invoke('cheques:baixar', dados),
    devolver: (dados) => ipcRenderer.invoke('cheques:devolver', dados),
  },

  // LANÇAMENTOS EXTRAS
  lancamentosExtras: {
    listar: (filtros) => ipcRenderer.invoke('lancamentosExtras:listar', filtros),
    salvar: (dados) => ipcRenderer.invoke('lancamentosExtras:salvar', dados),
    pagar: (dados) => ipcRenderer.invoke('lancamentosExtras:pagar', dados),
    cancelar: (id) => ipcRenderer.invoke('lancamentosExtras:cancelar', id),
  },

  // REAJUSTES DE PREÇO
  reajustesPreco: {
    listar: (filtros) => ipcRenderer.invoke('reajustesPreco:listar', filtros),
    aplicar: (dados) => ipcRenderer.invoke('reajustesPreco:aplicar', dados),
  },

  // RELATÓRIOS GERENCIAIS
  relatorios: {
    inventario: () => ipcRenderer.invoke('relatorios:inventario'),
    itenisVendidos: (f) => ipcRenderer.invoke('relatorios:itenisVendidos', f),
    entradasMercadoria: (f) => ipcRenderer.invoke('relatorios:entradasMercadoria', f),
    extrato: (f) => ipcRenderer.invoke('relatorios:extrato', f),
  },

  // APROVAÇÕES (contagem de estoque etc.)
  aprovacoes: {
    listarPendentes: (filtros) => ipcRenderer.invoke('aprovacoes:listarPendentes', filtros),
    solicitar: (dados) => ipcRenderer.invoke('aprovacoes:solicitar', dados),
    aprovar: (id, usuario) => ipcRenderer.invoke('aprovacoes:aprovar', { id, usuario }),
    rejeitar: (id, usuario, motivo) => ipcRenderer.invoke('aprovacoes:rejeitar', { id, usuario, motivo }),
    listarResolvidasNaoVistas: (usuarioSolicitante) => ipcRenderer.invoke('aprovacoes:listarResolvidasNaoVistas', usuarioSolicitante),
    marcarVisualizado: (id) => ipcRenderer.invoke('aprovacoes:marcarVisualizado', id),
  },

  // COMENTÁRIOS (conversa anexada a cada solicitação de aprovação)
  comentarios: {
    listar: (solicitacaoId) => ipcRenderer.invoke('comentarios:listar', solicitacaoId),
    enviar: (solicitacaoId, usuario, mensagem) => ipcRenderer.invoke('comentarios:enviar', { solicitacaoId, usuario, mensagem }),
    marcarVisto: (solicitacaoId, usuario) => ipcRenderer.invoke('comentarios:marcarVisto', { solicitacaoId, usuario }),
  },
})
