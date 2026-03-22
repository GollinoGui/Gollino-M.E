/**
 * Script de Importação — Gollino M.E
 *
 * USO:
 *   node scripts/importar.js produtos scripts/produtos.csv
 *   node scripts/importar.js clientes scripts/clientes.csv
 *
 * O banco é lido de: banco/gollino.db (pasta raiz do projeto)
 */

const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')

// ── Configuração do banco ────────────────────────────────────────────────────
const DB_PATH = path.join(__dirname, '..', 'banco', 'gollino.db')

if (!fs.existsSync(DB_PATH)) {
  console.error(`\n❌ Banco não encontrado em: ${DB_PATH}`)
  console.error('   Verifique se o sistema já foi aberto ao menos uma vez.\n')
  process.exit(1)
}

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ── Utilitários ──────────────────────────────────────────────────────────────
function hoje() {
  return new Date().toISOString().slice(0, 10)
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'))

  if (lines.length < 2) {
    console.error('❌ CSV vazio ou sem dados (precisa ter cabeçalho + ao menos 1 linha).')
    process.exit(1)
  }

  // Detecta separador (ponto-e-vírgula ou vírgula)
  const sep = lines[0].includes(';') ? ';' : ','

  const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i], sep)
    if (values.length === 0) continue
    const obj = {}
    headers.forEach((h, idx) => {
      obj[h] = (values[idx] || '').trim().replace(/^"|"$/g, '')
    })
    rows.push(obj)
  }

  return rows
}

function splitCSVLine(line, sep) {
  // Suporta campos entre aspas com vírgulas dentro
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === sep && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function num(v, def = 0) {
  const n = parseFloat(String(v || '').replace(',', '.'))
  return isNaN(n) ? def : n
}

function str(v, def = '') {
  return String(v || def).trim()
}

function yn(v, def = 'N') {
  const s = String(v || '').trim().toUpperCase()
  if (s === 'S' || s === 'SIM' || s === '1' || s === 'TRUE') return 'S'
  if (s === 'N' || s === 'NAO' || s === 'NÃO' || s === '0' || s === 'FALSE') return 'N'
  return def
}

function log(msg) { process.stdout.write(msg) }
function ok() { process.stdout.write(' ✓\n') }
function skip(reason) { process.stdout.write(` — ignorado (${reason})\n`) }

// ── IMPORTAR PRODUTOS ────────────────────────────────────────────────────────
function importarProdutos(csvPath) {
  console.log(`\n📦 Importando produtos de: ${csvPath}\n`)

  const rows = parseCSV(csvPath)
  let inseridos = 0
  let atualizados = 0
  let erros = 0

  const stmt = db.prepare(`
    INSERT INTO produtos (
      codigo, descricao, descricao_menor, referencia, unidade,
      codigo_grupo, codigo_linha,
      preco_venda_vista, preco_venda_prazo, preco_venda_minimo,
      custo_preco_unitario, preco_custo_atual,
      margem_lucro_vista, margem_lucro_prazo,
      estoque_atual, estoque_minimo, controla_estoque,
      situacao_produto, data_cadastro, usuario_cadastro
    ) VALUES (
      @codigo, @descricao, @descricao_menor, @referencia, @unidade,
      @codigo_grupo, @codigo_linha,
      @preco_venda_vista, @preco_venda_prazo, @preco_venda_minimo,
      @custo_preco_unitario, @preco_custo_atual,
      @margem_lucro_vista, @margem_lucro_prazo,
      @estoque_atual, @estoque_minimo, @controla_estoque,
      @situacao_produto, @data_cadastro, @usuario_cadastro
    )
    ON CONFLICT(codigo) DO UPDATE SET
      descricao          = excluded.descricao,
      descricao_menor    = excluded.descricao_menor,
      referencia         = excluded.referencia,
      unidade            = excluded.unidade,
      codigo_grupo       = excluded.codigo_grupo,
      codigo_linha       = excluded.codigo_linha,
      preco_venda_vista  = excluded.preco_venda_vista,
      preco_venda_prazo  = excluded.preco_venda_prazo,
      preco_venda_minimo = excluded.preco_venda_minimo,
      custo_preco_unitario = excluded.custo_preco_unitario,
      preco_custo_atual  = excluded.preco_custo_atual,
      margem_lucro_vista = excluded.margem_lucro_vista,
      margem_lucro_prazo = excluded.margem_lucro_prazo,
      estoque_atual      = excluded.estoque_atual,
      estoque_minimo     = excluded.estoque_minimo,
      controla_estoque   = excluded.controla_estoque,
      situacao_produto   = excluded.situacao_produto,
      data_atualizacao   = @data_cadastro
  `)

  const existentes = new Set(
    db.prepare('SELECT codigo FROM produtos').all().map(r => r.codigo)
  )

  const importar = db.transaction(() => {
    for (const row of rows) {
      const codigo = str(row['codigo'] || row['cod'] || row['code'])
      if (!codigo) { log(`   [linha sem código]`); skip('sem código'); erros++; continue }

      const descricao = str(row['descricao'] || row['descricao_produto'] || row['nome'] || row['produto'])
      if (!descricao) { log(`   [${codigo}]`); skip('sem descrição'); erros++; continue }

      const jaExiste = existentes.has(codigo)
      log(`   ${jaExiste ? '↺' : '+'} [${codigo}] ${descricao.substring(0, 40)}`)

      try {
        stmt.run({
          codigo,
          descricao,
          descricao_menor: str(row['descricao_menor'] || row['descricao_curta'] || descricao.substring(0, 30)),
          referencia:      str(row['referencia'] || row['ref'] || row['ean'] || row['codigo_barras']),
          unidade:         str(row['unidade'] || row['un'] || row['und'], 'UN'),
          codigo_grupo:    str(row['codigo_grupo'] || row['grupo']),
          codigo_linha:    str(row['codigo_linha'] || row['linha']),
          preco_venda_vista:  num(row['preco_venda_vista']  || row['preco_vista']  || row['preco'] || row['valor']),
          preco_venda_prazo:  num(row['preco_venda_prazo']  || row['preco_prazo']  || row['preco'] || row['valor']),
          preco_venda_minimo: num(row['preco_venda_minimo'] || row['preco_minimo'] || 0),
          custo_preco_unitario: num(row['custo_preco_unitario'] || row['custo'] || row['preco_custo'] || 0),
          preco_custo_atual:    num(row['preco_custo_atual']    || row['custo'] || row['preco_custo'] || 0),
          margem_lucro_vista:  num(row['margem_lucro_vista']  || row['margem_vista']  || 0),
          margem_lucro_prazo:  num(row['margem_lucro_prazo']  || row['margem_prazo']  || 0),
          estoque_atual:   num(row['estoque_atual']  || row['estoque'] || row['saldo'] || 0),
          estoque_minimo:  num(row['estoque_minimo'] || row['minimo']  || 0),
          controla_estoque: yn(row['controla_estoque'] || row['controla'] || 'S'),
          situacao_produto: str(row['situacao'] || 'A'),
          data_cadastro:   hoje(),
          usuario_cadastro: 'importacao',
        })
        jaExiste ? atualizados++ : inseridos++
        ok()
      } catch (e) {
        skip(`erro: ${e.message}`)
        erros++
      }
    }
  })

  importar()

  console.log(`\n✅ Produtos concluído:`)
  console.log(`   Inseridos:   ${inseridos}`)
  console.log(`   Atualizados: ${atualizados}`)
  console.log(`   Erros:       ${erros}\n`)
}

// ── IMPORTAR CLIENTES ────────────────────────────────────────────────────────
function importarClientes(csvPath) {
  console.log(`\n👥 Importando clientes de: ${csvPath}\n`)

  const rows = parseCSV(csvPath)
  let inseridos = 0
  let atualizados = 0
  let erros = 0

  const stmt = db.prepare(`
    INSERT INTO clientes (
      codigo, nome, nome_fantasia,
      cpf, rg, cgc, ie,
      logradouro, numero, bairro, cep, cidade, uf,
      telefone, celular, email,
      limite_credito, haver,
      situacao_cliente, data_cadastro, usuario_cadastro
    ) VALUES (
      @codigo, @nome, @nome_fantasia,
      @cpf, @rg, @cgc, @ie,
      @logradouro, @numero, @bairro, @cep, @cidade, @uf,
      @telefone, @celular, @email,
      @limite_credito, @haver,
      @situacao_cliente, @data_cadastro, @usuario_cadastro
    )
    ON CONFLICT(codigo) DO UPDATE SET
      nome            = excluded.nome,
      nome_fantasia   = excluded.nome_fantasia,
      cpf             = excluded.cpf,
      cgc             = excluded.cgc,
      ie              = excluded.ie,
      logradouro      = excluded.logradouro,
      numero          = excluded.numero,
      bairro          = excluded.bairro,
      cep             = excluded.cep,
      cidade          = excluded.cidade,
      uf              = excluded.uf,
      telefone        = excluded.telefone,
      celular         = excluded.celular,
      email           = excluded.email,
      limite_credito  = excluded.limite_credito,
      situacao_cliente = excluded.situacao_cliente,
      data_atualizacao = @data_cadastro
  `)

  const existentes = new Set(
    db.prepare('SELECT codigo FROM clientes').all().map(r => r.codigo)
  )

  const importar = db.transaction(() => {
    for (const row of rows) {
      const codigo = str(row['codigo'] || row['cod'] || row['code'])
      if (!codigo) { log(`   [linha sem código]`); skip('sem código'); erros++; continue }

      const nome = str(row['nome'] || row['nome_cliente'] || row['cliente'] || row['razao_social'])
      if (!nome) { log(`   [${codigo}]`); skip('sem nome'); erros++; continue }

      const jaExiste = existentes.has(codigo)
      log(`   ${jaExiste ? '↺' : '+'} [${codigo}] ${nome.substring(0, 40)}`)

      try {
        stmt.run({
          codigo,
          nome,
          nome_fantasia:   str(row['nome_fantasia'] || row['fantasia'] || ''),
          cpf:             str(row['cpf'] || ''),
          rg:              str(row['rg']  || ''),
          cgc:             str(row['cgc'] || row['cnpj'] || row['cpf_cnpj'] || ''),
          ie:              str(row['ie']  || row['inscricao_estadual'] || ''),
          logradouro:      str(row['logradouro'] || row['endereco'] || row['rua'] || ''),
          numero:          str(row['numero'] || row['num'] || ''),
          bairro:          str(row['bairro'] || ''),
          cep:             str(row['cep'] || ''),
          cidade:          str(row['cidade'] || ''),
          uf:              str(row['uf'] || row['estado'] || ''),
          telefone:        str(row['telefone'] || row['fone'] || row['tel'] || ''),
          celular:         str(row['celular'] || row['cel'] || ''),
          email:           str(row['email'] || ''),
          limite_credito:  num(row['limite_credito'] || row['limite'] || 0),
          haver:           num(row['haver'] || row['credito'] || row['saldo_haver'] || 0),
          situacao_cliente: str(row['situacao'] || 'A'),
          data_cadastro:   hoje(),
          usuario_cadastro: 'importacao',
        })
        jaExiste ? atualizados++ : inseridos++
        ok()
      } catch (e) {
        skip(`erro: ${e.message}`)
        erros++
      }
    }
  })

  importar()

  console.log(`\n✅ Clientes concluído:`)
  console.log(`   Inseridos:   ${inseridos}`)
  console.log(`   Atualizados: ${atualizados}`)
  console.log(`   Erros:       ${erros}\n`)
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
const [,, tipo, csvPath] = process.argv

if (!tipo || !csvPath) {
  console.log(`
Uso:
  node scripts/importar.js produtos scripts/produtos.csv
  node scripts/importar.js clientes scripts/clientes.csv

Templates disponíveis:
  scripts/produtos_template.csv
  scripts/clientes_template.csv
`)
  process.exit(0)
}

const fullPath = path.isAbsolute(csvPath)
  ? csvPath
  : path.join(process.cwd(), csvPath)

if (!fs.existsSync(fullPath)) {
  console.error(`\n❌ Arquivo não encontrado: ${fullPath}\n`)
  process.exit(1)
}

if (tipo === 'produtos') importarProdutos(fullPath)
else if (tipo === 'clientes') importarClientes(fullPath)
else {
  console.error(`\n❌ Tipo inválido: "${tipo}". Use "produtos" ou "clientes".\n`)
  process.exit(1)
}

db.close()
