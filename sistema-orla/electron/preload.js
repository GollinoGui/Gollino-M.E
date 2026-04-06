const { contextBridge, ipcRenderer } = require('electron')

// Expõe API segura para o React via window.api
contextBridge.exposeInMainWorld('api', {

  // AUTH
  auth: {
    login: (dados) => ipcRenderer.invoke('auth:login', dados),
  },

  // CLIENTES
  clientes: {
    listar: (filtros) => ipcRenderer.invoke('clientes:listar', filtros),
    buscar: (codigo) => ipcRenderer.invoke('clientes:buscar', codigo),
    salvar: (dados) => ipcRenderer.invoke('clientes:salvar', dados),
    excluir: (codigo) => ipcRenderer.invoke('clientes:excluir', codigo),
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
    sessoesHoje: () => ipcRenderer.invoke('caixa:sessoesHoje'),
  },

  // MANUTENÇÃO
  manutencao: {
    corrigirCR: () => ipcRenderer.invoke('manutencao:corrigirCR'),
  },

  // DASHBOARD
  dashboard: {
    resumo: (periodo) => ipcRenderer.invoke('dashboard:resumo', periodo),
  },

  // CONFIGURAÇÕES
  config: {
    get: (chave) => ipcRenderer.invoke('config:get', chave),
    set: (dados) => ipcRenderer.invoke('config:set', dados),
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
  },

  // PEDIDOS DE COMPRA
  pedidosCompra: {
    listar: (filtros) => ipcRenderer.invoke('pedidosCompra:listar', filtros),
    salvar: (dados) => ipcRenderer.invoke('pedidosCompra:salvar', dados),
    cancelar: (numero) => ipcRenderer.invoke('pedidosCompra:cancelar', numero),
    receber: (numero) => ipcRenderer.invoke('pedidosCompra:receber', numero),
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
})
