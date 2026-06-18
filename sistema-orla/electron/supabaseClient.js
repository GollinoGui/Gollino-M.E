const { createClient } = require('@supabase/supabase-js')

// URL + anon key são públicos por design — a segurança vem das políticas de
// Row Level Security no banco, não do sigilo dessas duas strings.
const SUPABASE_URL = 'https://mycfhjtjxthxoshwgtom.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2ZoanRqeHRoeG9zaHdndG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDAwODcsImV4cCI6MjA5NzI3NjA4N30.73Mq0CSAHW7nsLl5AwN4_9ziasJXz71yeo_jeUSNN3Y'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
})

// Usuários do app não têm e-mail próprio — login continua sendo só
// usuario+senha, mas o Supabase Auth exige um e-mail por trás.
function emailDoUsuario(usuario) {
  return `${usuario.toLowerCase()}@gollino.app`
}

module.exports = { supabase, emailDoUsuario }
