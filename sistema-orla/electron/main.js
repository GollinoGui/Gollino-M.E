const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
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
ipcMain.handle('contasPagar:salvar', (_, dados) => {
  return db.contasPagar.salvar(dados)
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

// --- PRÉ-VENDAS ---
ipcMain.handle('preVendas:listar', (_, filtros) => {
  return db.preVendas.listar(filtros)
})
ipcMain.handle('preVendas:buscar', (_, numero) => {
  return db.preVendas.buscar(numero)
})
ipcMain.handle('preVendas:salvar', (_, dados) => {
  return db.preVendas.salvar(dados)
})
ipcMain.handle('preVendas:cancelar', (_, numero) => {
  return db.preVendas.cancelar(numero)
})
ipcMain.handle('preVendas:baixar', (_, numero) => {
  return db.preVendas.baixar(numero)
})
ipcMain.handle('preVendas:proximoNumero', () => {
  return db.preVendas.proximoNumero()
})

// --- MOVIMENTOS DE ESTOQUE ---
ipcMain.handle('movimentosEstoque:listar', (_, filtros) => {
  return db.movimentosEstoque.listar(filtros)
})
ipcMain.handle('movimentosEstoque:salvar', (_, dados) => {
  return db.movimentosEstoque.salvar(dados)
})

// --- PDF ---
function getVendasDir() {
  const base = isDev
    ? path.join(__dirname, '..')
    : path.dirname(app.getPath('exe'))
  const dir = path.join(base, 'banco', 'vendas')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function gerarHtmlVenda(venda, empresa) {
  const fmt = (v) =>
    (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtDate = (d) =>
    d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : ''

  const formas = []
  if ((venda.valor_pago_dinheiro || 0) > 0)
    formas.push(`Dinheiro: ${fmt(venda.valor_pago_dinheiro)}`)
  if ((venda.valor_pago_cartao_credito || 0) > 0)
    formas.push(`Cartão Crédito: ${fmt(venda.valor_pago_cartao_credito)}`)
  if ((venda.valor_pago_cartao_debito || 0) > 0)
    formas.push(`Cartão Débito: ${fmt(venda.valor_pago_cartao_debito)}`)
  if ((venda.valor_pago_cheque || 0) > 0)
    formas.push(`Cheque: ${fmt(venda.valor_pago_cheque)}`)
  if ((venda.valor_pago_haver || 0) > 0)
    formas.push(`Haver: ${fmt(venda.valor_pago_haver)}`)
  if ((venda.valor_troco || 0) > 0)
    formas.push(`Troco: ${fmt(venda.valor_troco)}`)

  const linhasVazias = Math.max(0, 6 - (venda.itens || []).length)

  const itensHtml = (venda.itens || [])
    .map(
      (item, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td style="text-align:center;font-family:monospace">${item.codigo_produto}</td>
      <td>${item.descricao || ''}</td>
      <td style="text-align:center">${item.quantidade}</td>
      <td style="text-align:center">${item.unidade || 'UN'}</td>
      <td style="text-align:right">${fmt(item.preco_unitario)}</td>
      <td style="text-align:right">${(item.valor_desconto || 0) > 0 ? fmt(item.valor_desconto) : '-'}</td>
      <td style="text-align:right;font-weight:600">${fmt(item.valor_total)}</td>
    </tr>`,
    )
    .join('')

  const vaziosHtml = Array(linhasVazias)
    .fill(
      '<tr><td colspan="8" style="height:22px;border-color:#e5e5e5">&nbsp;</td></tr>',
    )
    .join('')

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111;padding:18px 22px}
  .topo{text-align:center;padding-bottom:10px;margin-bottom:10px;border-bottom:2px solid #111}
  .topo h1{font-size:17px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
  .topo p{font-size:10px;color:#444;margin-top:3px}
  .titulo-doc{text-align:center;font-size:13px;font-weight:700;text-transform:uppercase;
    border:1px solid #111;padding:5px;margin-bottom:10px;letter-spacing:1px}
  .bloco{border:1px solid #bbb;padding:7px 10px;margin-bottom:8px;border-radius:2px}
  .label{font-size:9px;color:#666;text-transform:uppercase;font-weight:600;margin-bottom:2px}
  .row-info{display:flex;gap:20px}
  .col-info{flex:1}
  table{width:100%;border-collapse:collapse;margin-bottom:8px;font-size:10px}
  thead th{background:#f0f0f0;border:1px solid #999;padding:5px 6px;font-size:10px;font-weight:700}
  tbody td{border:1px solid #ccc;padding:4px 6px}
  tbody tr:nth-child(even){background:#fafafa}
  .totais{display:flex;justify-content:flex-end;margin-bottom:8px}
  .totais-box{width:240px;border:1px solid #bbb}
  .totais-row{display:flex;justify-content:space-between;padding:4px 10px;border-bottom:1px solid #e5e5e5;font-size:11px}
  .totais-row.total-final{background:#f0f0f0;font-weight:700;font-size:13px;border-bottom:none}
  .pagto{border:1px solid #bbb;padding:7px 10px;margin-bottom:8px;border-radius:2px}
  .assinaturas{display:flex;gap:24px;margin-top:24px}
  .ass{flex:1;border-top:1px solid #111;padding-top:5px;text-align:center;font-size:10px;color:#555}
  .rodape{text-align:center;font-size:8px;color:#aaa;margin-top:14px;padding-top:6px;border-top:1px solid #e5e5e5}
  @media print{body{padding:6px 10px}@page{margin:8mm;size:A4}}
</style></head>
<body>

<div class="topo">
  <h1>${empresa.empresa_razao_social || 'ELTER GOLLINO'}</h1>
  <p>${empresa.empresa_nome_fantasia || 'GOLLINO M.E'} &nbsp;|&nbsp; CNPJ: ${empresa.empresa_cnpj || ''} &nbsp;|&nbsp; ${empresa.empresa_cidade || 'Orlândia'} - ${empresa.empresa_uf || 'SP'}</p>
  <p>Regime: ${empresa.empresa_regime || 'Simples Nacional'}</p>
</div>

<div class="titulo-doc">Pedido de Venda &nbsp; Nº ${venda.orcamento}</div>

<div class="bloco">
  <div class="row-info" style="margin-bottom:7px">
    <div class="col-info">
      <div class="label">Data</div>
      <strong>${fmtDate(venda.data)}</strong>
    </div>
    <div class="col-info">
      <div class="label">Tipo de Venda</div>
      <strong>${venda.tipo_venda === 'C' ? 'Convênio / Prazo' : 'À Vista'}</strong>
    </div>
    <div class="col-info">
      <div class="label">Operador</div>
      <strong>${venda.usuario_cadastro || '-'}</strong>
    </div>
    <div class="col-info">
      <div class="label">Caixa</div>
      <strong>${venda.numero_caixa || '001'}</strong>
    </div>
  </div>
  <div class="row-info">
    <div class="col-info" style="flex:2">
      <div class="label">Cliente</div>
      <strong style="font-size:13px">${venda.nome_cliente || venda.codigo_cliente}</strong>
    </div>
    <div class="col-info">
      <div class="label">Código</div>
      <strong style="font-family:monospace">${venda.codigo_cliente}</strong>
    </div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="width:28px;text-align:center">Nº</th>
      <th style="width:80px;text-align:center">Código</th>
      <th>Descrição</th>
      <th style="width:48px;text-align:center">Qtde</th>
      <th style="width:36px;text-align:center">UN</th>
      <th style="width:88px;text-align:right">Preço Unit.</th>
      <th style="width:72px;text-align:right">Desconto</th>
      <th style="width:88px;text-align:right">Total</th>
    </tr>
  </thead>
  <tbody>
    ${itensHtml}
    ${vaziosHtml}
  </tbody>
</table>

<div style="display:flex;gap:12px;margin-bottom:8px;align-items:flex-start">
  <div class="pagto" style="flex:1">
    <div class="label" style="margin-bottom:5px">Forma de Pagamento</div>
    ${formas.length > 0 ? formas.map((f) => `<div style="font-weight:600;margin-bottom:2px">${f}</div>`).join('') : '<div style="color:#888">-</div>'}
  </div>
  <div class="bloco" style="flex:1;margin-bottom:0">
    <div class="label" style="margin-bottom:4px">Observação</div>
    <div style="min-height:32px">${venda.observacao || ''}</div>
  </div>
</div>

<div class="totais">
  <div class="totais-box">
    <div class="totais-row"><span>Subtotal dos produtos</span><span>${fmt(venda.valor_produtos || venda.valor_total)}</span></div>
    ${(venda.valor_descontos_itens || 0) > 0 ? `<div class="totais-row"><span>Desc. itens</span><span>- ${fmt(venda.valor_descontos_itens)}</span></div>` : ''}
    ${(venda.valor_desconto_final || 0) > 0 ? `<div class="totais-row"><span>Desc. geral</span><span>- ${fmt(venda.valor_desconto_final)}</span></div>` : ''}
    ${(venda.taxa_entrega || 0) > 0 ? `<div class="totais-row"><span>Taxa de entrega</span><span>+ ${fmt(venda.taxa_entrega)}</span></div>` : ''}
    <div class="totais-row total-final"><span>TOTAL</span><span>${fmt(venda.valor_total)}</span></div>
  </div>
</div>

<div class="assinaturas">
  <div class="ass">Assinatura do Vendedor / Responsável</div>
  <div class="ass">Assinatura do Cliente / Responsável</div>
</div>

<div class="rodape">
  Emitido em ${new Date().toLocaleString('pt-BR')} &nbsp;|&nbsp; ${empresa.empresa_nome_fantasia || 'GOLLINO M.E'} &nbsp;|&nbsp; CNPJ: ${empresa.empresa_cnpj || ''}
</div>

</body></html>`
}

ipcMain.handle('pdf:gerarVenda', async (_, orcamento) => {
  try {
    const venda = db.vendas.buscar(orcamento)
    if (!venda) return { sucesso: false, erro: 'Venda não encontrada' }

    const configs = db.config.get()
    const empresa = {}
    for (const c of configs) empresa[c.chave] = c.valor

    const html = gerarHtmlVenda(venda, empresa)

    const win = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    })

    await win.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
    )

    const pdfBuffer = await win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: false,
      marginsType: 1,
    })

    win.close()

    const dir = getVendasDir()
    const fileName = `venda_${orcamento}_${new Date().toISOString().slice(0, 10)}.pdf`
    const filePath = path.join(dir, fileName)
    fs.writeFileSync(filePath, pdfBuffer)

    await shell.openPath(filePath)

    return { sucesso: true, caminho: filePath }
  } catch (err) {
    console.error('Erro ao gerar PDF:', err)
    return { sucesso: false, erro: err.message }
  }
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
