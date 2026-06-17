// ============================================================
// Migração única: SQLite local (banco/gollino.db) -> Supabase (Postgres)
//
// Uso:
//   node migrar_para_supabase.js
//
// A config de conexão é lida de banco/connection.json:
//   { "host": "...", "port": 5432, "database": "postgres", "user": "postgres", "password": "..." }
// (campos separados em vez de uma URI única, pra evitar problema de escaping
// quando a senha tem caracteres especiais como # ou @)
//
// Roda uma única vez, antes de liberar o app pra loja. É seguro rodar de
// novo (upsert) para as tabelas com chave única de negócio (clientes,
// produtos, fornecedores, usuarios, configuracoes, caixas, etc), mas o
// script aborta de cara se a tabela `vendas` no Postgres já tiver linhas,
// pra não duplicar histórico de vendas/itens/contas que não têm chave
// de conflito.
// ============================================================

const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')
const { Pool } = require('pg')

function getDbConfig() {
  const connFile = path.join(__dirname, 'banco', 'connection.json')
  if (!fs.existsSync(connFile)) {
    throw new Error(
      `Arquivo de conexão não encontrado: ${connFile}\n` +
      `Crie esse arquivo com: { "host": "...", "port": 5432, "database": "postgres", "user": "postgres", "password": "..." }`,
    )
  }
  const conteudo = JSON.parse(fs.readFileSync(connFile, 'utf8'))
  if (!conteudo.host || !conteudo.password) {
    throw new Error(`"host"/"password" ausentes em ${connFile}`)
  }
  return conteudo
}

async function copiarTabela(sqliteDb, pool, tabela, conflictColumn) {
  const linhas = sqliteDb.prepare(`SELECT * FROM ${tabela}`).all()
  if (linhas.length === 0) {
    console.log(`  (vazio) ${tabela}`)
    return 0
  }

  for (const linha of linhas) {
    const colunas = Object.keys(linha).filter((c) => c !== 'id')
    const valores = colunas.map((c) => linha[c])
    const placeholders = colunas.map((_, i) => `$${i + 1}`).join(', ')
    let sql = `INSERT INTO ${tabela} (${colunas.join(', ')}) VALUES (${placeholders})`
    if (conflictColumn) {
      const updates = colunas
        .filter((c) => c !== conflictColumn)
        .map((c) => `${c} = excluded.${c}`)
        .join(', ')
      sql += ` ON CONFLICT (${conflictColumn}) DO UPDATE SET ${updates}`
    }
    await pool.query(sql, valores)
  }

  console.log(`  ✅ ${tabela}: ${linhas.length} linha(s)`)
  return linhas.length
}

async function seedNumerador(pool, sqliteDb, chave, tabela, coluna) {
  const row = sqliteDb.prepare(`SELECT MAX(CAST(${coluna} AS INTEGER)) as max FROM ${tabela}`).get()
  const valor = row?.max || 0
  await pool.query(
    `INSERT INTO numeradores (chave, valor) VALUES ($1, $2)
     ON CONFLICT (chave) DO UPDATE SET valor = GREATEST(numeradores.valor, excluded.valor)`,
    [chave, valor],
  )
  console.log(`  ✅ numeradores.${chave} = ${valor}`)
}

async function main() {
  const sqlitePath = path.join(__dirname, 'banco', 'gollino.db')
  if (!fs.existsSync(sqlitePath)) {
    throw new Error(`Banco local não encontrado em ${sqlitePath}`)
  }

  const dbConfig = getDbConfig()
  const sqliteDb = new Database(sqlitePath, { readonly: true })
  const pool = new Pool({ ...dbConfig, ssl: { rejectUnauthorized: false } })

  console.log('Aplicando schema.postgres.sql no Supabase...')
  const schema = fs.readFileSync(path.join(__dirname, 'schema.postgres.sql'), 'utf8')
  await pool.query(schema)

  const { rows: [{ count }] } = await pool.query(`SELECT COUNT(*) FROM vendas`)
  if (Number(count) > 0) {
    throw new Error(
      `A tabela "vendas" no Supabase já tem ${count} linha(s) — a migração parece já ter rodado. ` +
      `Abortando para não duplicar histórico (vendas/itens/contas não têm chave de conflito).`,
    )
  }

  console.log('\nCopiando dados...')

  // Tabelas com chave de negócio única -> upsert seguro de rodar de novo
  await copiarTabela(sqliteDb, pool, 'clientes', 'codigo')
  await copiarTabela(sqliteDb, pool, 'produtos', 'codigo')
  await copiarTabela(sqliteDb, pool, 'fornecedores', 'codigo')
  await copiarTabela(sqliteDb, pool, 'grupos_produtos', 'codigo')
  await copiarTabela(sqliteDb, pool, 'linhas_produtos', 'codigo')
  await copiarTabela(sqliteDb, pool, 'cidades', 'codigo')
  await copiarTabela(sqliteDb, pool, 'usuarios', 'usuario')
  await copiarTabela(sqliteDb, pool, 'caixas', 'codigo')
  await copiarTabela(sqliteDb, pool, 'configuracoes', 'chave')

  // Tabelas sem chave de conflito -> insert simples (protegido pelo guard acima)
  await copiarTabela(sqliteDb, pool, 'vendas', 'orcamento')
  await copiarTabela(sqliteDb, pool, 'vendas_itens')
  await copiarTabela(sqliteDb, pool, 'contas_receber')
  await copiarTabela(sqliteDb, pool, 'contas_pagar', 'id_conta_pagar')
  await copiarTabela(sqliteDb, pool, 'movimentos_caixa')
  await copiarTabela(sqliteDb, pool, 'pre_vendas', 'numero')
  await copiarTabela(sqliteDb, pool, 'pre_vendas_itens')
  await copiarTabela(sqliteDb, pool, 'movimentos_estoque')
  await copiarTabela(sqliteDb, pool, 'pedidos_compra', 'numero')
  await copiarTabela(sqliteDb, pool, 'pedidos_compra_itens')
  await copiarTabela(sqliteDb, pool, 'cheques')
  await copiarTabela(sqliteDb, pool, 'lancamentos_extras')
  await copiarTabela(sqliteDb, pool, 'reajustes_preco')

  console.log('\nPopulando numeradores (continua a contagem de onde o SQLite parou)...')
  await seedNumerador(pool, sqliteDb, 'vendas', 'vendas', 'orcamento')
  await seedNumerador(pool, sqliteDb, 'pre_vendas', 'pre_vendas', 'numero')
  await seedNumerador(pool, sqliteDb, 'pedidos_compra', 'pedidos_compra', 'numero')

  sqliteDb.close()
  await pool.end()
  console.log('\n✅ Migração concluída.')
}

main().catch((e) => {
  console.error('\n❌ Erro na migração:', e.message)
  process.exit(1)
})
