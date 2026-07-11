const { createClient } = require('@supabase/supabase-js')
const { app } = require('electron')
const fs = require('fs')
const path = require('path')

// URL + anon key são públicos por design — a segurança vem das políticas de
// Row Level Security no banco, não do sigilo dessas duas strings.
const SUPABASE_URL = 'https://mycfhjtjxthxoshwgtom.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2ZoanRqeHRoeG9zaHdndG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDAwODcsImV4cCI6MjA5NzI3NjA4N30.73Mq0CSAHW7nsLl5AwN4_9ziasJXz71yeo_jeUSNN3Y'

// As políticas de RLS no banco exigem a role "authenticated" (via
// nivel_atual(), que lê auth.uid()) — sem uma sessão real do Supabase Auth,
// toda leitura/gravação volta vazia (RLS filtra, não dá erro). O recurso
// "manter conectado" (Login.jsx) só guarda o objeto `usuario` pra pular a
// TELA de login — sem isto aqui, o cliente Supabase do processo principal
// reiniciava anônimo a cada abertura do app, e ficava anônimo pro resto da
// sessão inteira (produtos sumindo, caixa aparentando fechado etc., mesmo
// com tudo certo no banco). Persistindo a sessão real (JWT + refresh token)
// num arquivo local, ela é restaurada e renovada automaticamente pelo
// supabase-js a cada reinício, igual ao restante do app já assume que acontece.
function arquivoSessao() {
  return path.join(app.getPath('userData'), 'supabase-session.json')
}

function lerArquivoSessao() {
  try {
    return JSON.parse(fs.readFileSync(arquivoSessao(), 'utf-8'))
  } catch {
    return {}
  }
}

const storageSessao = {
  getItem: (chave) => lerArquivoSessao()[chave] ?? null,
  setItem: (chave, valor) => {
    try {
      const dados = lerArquivoSessao()
      dados[chave] = valor
      fs.writeFileSync(arquivoSessao(), JSON.stringify(dados))
    } catch (e) {
      console.error('Erro ao persistir sessão Supabase:', e.message)
    }
  },
  removeItem: (chave) => {
    try {
      const dados = lerArquivoSessao()
      delete dados[chave]
      fs.writeFileSync(arquivoSessao(), JSON.stringify(dados))
    } catch (e) {
      console.error('Erro ao remover sessão Supabase:', e.message)
    }
  },
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: storageSessao,
  },
})

// Usuários do app não têm e-mail próprio — login continua sendo só
// usuario+senha, mas o Supabase Auth exige um e-mail por trás.
function emailDoUsuario(usuario) {
  return `${usuario.toLowerCase()}@gollino.app`
}

module.exports = { supabase, emailDoUsuario }
