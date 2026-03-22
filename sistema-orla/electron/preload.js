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
})
