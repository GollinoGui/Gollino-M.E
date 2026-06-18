// ============================================================
// Script de configuração única: cria os 3 usuários (admin, elter,
// rosangela) como usuários reais no Supabase Auth, e liga cada um
// à linha correspondente em `usuarios` via `auth_id`.
//
// Uso: node criar_usuarios_auth.js
//
// Lê SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY de .env (gitignored).
// Roda uma única vez — depois disso a senha antiga (pbkdf2 em
// usuarios.senha) deixa de ser usada para login.
// ============================================================

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

for (const linha of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n')) {
  const m = linha.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].trim()
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DOMINIO = 'gollino.app'
const USUARIOS = ['admin', 'elter', 'rosangela']

function gerarSenha() {
  return crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, '').slice(0, 12)
}

async function main() {
  const senhas = {}

  for (const usuario of USUARIOS) {
    const email = `${usuario}@${DOMINIO}`
    const senha = gerarSenha()

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    })

    if (error) {
      console.error(`❌ Falha ao criar ${usuario}:`, error.message)
      continue
    }

    senhas[usuario] = senha

    const { error: updErr } = await supabase
      .from('usuarios')
      .update({ auth_id: data.user.id })
      .eq('usuario', usuario)

    if (updErr) {
      console.error(`❌ Falha ao ligar auth_id de ${usuario}:`, updErr.message)
      continue
    }

    console.log(`✅ ${usuario} -> ${email}`)
  }

  console.log('\nSenhas novas (Supabase Auth) — entregue ao respectivo usuário, não reutilizar:')
  for (const [usuario, senha] of Object.entries(senhas)) {
    console.log(`  ${usuario}: ${senha}`)
  }
}

main().then(() => process.exit(0))
