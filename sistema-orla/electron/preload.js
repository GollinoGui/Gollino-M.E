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

  // HAVER
  haver: {
    listar: (busca) => ipcRenderer.invoke('haver:listar', busca),
    ajustar: (dados) => ipcRenderer.invoke('haver:ajustar', dados),
    totalGeral: () => ipcRenderer.invoke('haver:totalGeral'),
  },
})
