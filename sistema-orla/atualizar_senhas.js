const db = require('better-sqlite3')('banco\\gollino.db')

db.prepare("UPDATE usuarios SET senha='6c12863da47b965432875f30cad3213524d802544ea2f9878553cbcdab424707' WHERE usuario='admin'").run()
db.prepare("UPDATE usuarios SET senha='e625caf8bde95031db99602785cf94b1c473e4321723cca842fb1b3a4e6b628a' WHERE usuario='ELTER'").run()
db.prepare("UPDATE usuarios SET senha='2bbc91450ec3b7cf6d3deadffb450be0de7d617e332f22c46e16dae179b3a1f7' WHERE usuario='ROSANGELA'").run()

// Garante que os usuários existem
const usuarios = db.prepare("SELECT usuario, senha FROM usuarios").all()
console.log('Usuários no banco:', usuarios.map(u => u.usuario))
console.log('Senhas atualizadas!')
db.close()
