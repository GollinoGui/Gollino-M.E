const db = require('better-sqlite3')('banco\\gollino.db')
const crypto = require('crypto')

function hash(senha) {
  return crypto.createHash('sha256').update(senha + 'gollino_salt').digest('hex')
}

// Mostra o que tem no banco
const antes = db.prepare("SELECT usuario, senha FROM usuarios").all()
console.log('Usuários encontrados:', antes.map(u => u.usuario))

// Deleta todos e recria com nomes corretos
db.prepare("DELETE FROM usuarios").run()

db.prepare(`INSERT INTO usuarios (usuario, senha, nome, nivel, super_usuario, ativo) VALUES (?, ?, ?, ?, ?, 'S')`).run(
  'admin', hash('admin123'), 'Administrador', 250, 'S'
)
db.prepare(`INSERT INTO usuarios (usuario, senha, nome, nivel, super_usuario, ativo) VALUES (?, ?, ?, ?, ?, 'S')`).run(
  'elter', hash('gollino'), 'Elter Gollino', 2, 'N'
)
db.prepare(`INSERT INTO usuarios (usuario, senha, nome, nivel, super_usuario, ativo) VALUES (?, ?, ?, ?, ?, 'S')`).run(
  'rosangela', hash('gollino123'), 'Rosangela', 4, 'N'
)

const depois = db.prepare("SELECT usuario FROM usuarios").all()
console.log('Usuários criados:', depois.map(u => u.usuario))
console.log('')
console.log('Senhas:')
console.log('  admin     -> admin123')
console.log('  elter     -> gollino')
console.log('  rosangela -> gollino123')
console.log('')
console.log('Pronto!')
db.close()
