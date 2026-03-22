const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

// Importa o módulo de banco de dados
const db = require('./database')

const isDev = !app.isPackaged

// Pasta onde o banco vai ficar: C:\GollinoME\banco\
function getDbPath() {
  const base = isDev
    ? path.join(__dirname, '..')
    : path.dirname(app.getPath('exe'))
  const dbDir = path.join(base, 'banco')
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
  return path.join(dbDir, 'gollino.db')
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
    title: 'Gollino M.E — Sistema de Gestão',
  })

  // Em dev carrega o Vite; em produção carrega o build
  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.setMenuBarVisibility(false)
}

app.whenReady().then(() => {
  // Inicializa o banco de dados
  db.init(getDbPath())

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ============================================================
// IPC HANDLERS — comunicação React ↔ SQLite
// ============================================================

// --- AUTH ---
ipcMain.handle('auth:login', async (_, { usuario, senha }) => {
  try {
    const result = db.login(usuario, senha)
    return result
  } catch (e) {
    return { sucesso: false, erro: e.message }
  }
})

// --- CLIENTES ---
ipcMain.handle('clientes:listar', (_, filtros) => {
  return db.clientes.listar(filtros)
})
ipcMain.handle('clientes:buscar', (_, codigo) => {
  return db.clientes.buscar(codigo)
})
ipcMain.handle('clientes:salvar', (_, dados) => {
  return db.clientes.salvar(dados)
})
ipcMain.handle('clientes:excluir', (_, codigo) => {
  return db.clientes.excluir(codigo)
})

// --- PRODUTOS ---
ipcMain.handle('produtos:listar', (_, filtros) => {
  return db.produtos.listar(filtros)
})
ipcMain.handle('produtos:buscar', (_, codigo) => {
  return db.produtos.buscar(codigo)
})
ipcMain.handle('produtos:salvar', (_, dados) => {
  return db.produtos.salvar(dados)
})
ipcMain.handle('produtos:excluir', (_, codigo) => {
  return db.produtos.excluir(codigo)
})

// --- VENDAS ---
ipcMain.handle('vendas:listar', (_, filtros) => {
  return db.vendas.listar(filtros)
})
ipcMain.handle('vendas:buscar', (_, orcamento) => {
  return db.vendas.buscar(orcamento)
})
ipcMain.handle('vendas:salvar', (_, dados) => {
  return db.vendas.salvar(dados)
})
ipcMain.handle('vendas:cancelar', (_, { orcamento, motivo, usuario }) => {
  return db.vendas.cancelar(orcamento, motivo, usuario)
})
ipcMain.handle('vendas:proximoNumero', () => {
  return db.vendas.proximoNumero()
})

// --- CONTAS A RECEBER ---
ipcMain.handle('contasReceber:listar', (_, filtros) => {
  return db.contasReceber.listar(filtros)
})
ipcMain.handle('contasReceber:receber', (_, dados) => {
  return db.contasReceber.receber(dados)
})
ipcMain.handle('contasReceber:totalAberto', () => {
  return db.contasReceber.totalAberto()
})

// --- CONTAS A PAGAR ---
ipcMain.handle('contasPagar:listar', (_, filtros) => {
  return db.contasPagar.listar(filtros)
})
ipcMain.handle('contasPagar:pagar', (_, dados) => {
  return db.contasPagar.pagar(dados)
})
ipcMain.handle('contasPagar:totalAberto', () => {
  return db.contasPagar.totalAberto()
})

// --- CAIXA ---
ipcMain.handle('caixa:status', () => {
  return db.caixa.status()
})
ipcMain.handle('caixa:abrir', (_, dados) => {
  return db.caixa.abrir(dados)
})
ipcMain.handle('caixa:fechar', (_, dados) => {
  return db.caixa.fechar(dados)
})

// --- DASHBOARD ---
ipcMain.handle('dashboard:resumo', (_, periodo) => {
  return db.dashboard.resumo(periodo)
})

// --- CONFIGURACOES ---
ipcMain.handle('config:get', (_, chave) => {
  return db.config.get(chave)
})
ipcMain.handle('config:set', (_, { chave, valor }) => {
  return db.config.set(chave, valor)
})

// --- BACKUP ---
ipcMain.handle('backup:exportar', async () => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Salvar Backup',
    defaultPath: `backup_gollino_${new Date().toISOString().slice(0, 10)}.db`,
    filters: [{ name: 'Banco de Dados', extensions: ['db'] }],
  })
  if (filePath) {
    fs.copyFileSync(getDbPath(), filePath)
    return { sucesso: true, caminho: filePath }
  }
  return { sucesso: false }
})
