const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

let db

// ============================================================
// INIT — cria o banco e as tabelas se não existirem
// ============================================================
function init(dbPath) {
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  const schemaPath = path.join(__dirname, '../schema.sql')
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8')
    db.exec(schema)
  }

  console.log('✅ Banco de dados iniciado em:', dbPath)
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function hashSenha(senha) {
  return crypto
    .createHash('sha256')
    .update(senha + 'gollino_salt')
    .digest('hex')
}

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

function agora() {
  return new Date().toISOString().slice(11, 19)
}

// ============================================================
// AUTH
// ============================================================
function login(usuario, senha) {
  const hash = hashSenha(senha)
  const user = db
    .prepare(
      `
    SELECT usuario, nome, nivel, super_usuario, codigo_vendedor
    FROM usuarios
    WHERE usuario = ? AND senha = ? AND ativo = 'S'
  `,
    )
    .get(usuario, hash)

  if (user) {
    db.prepare(`UPDATE usuarios SET ultima_saida = ? WHERE usuario = ?`).run(
      new Date().toISOString(),
      usuario,
    )
    return { sucesso: true, usuario: user }
  }
  return { sucesso: false, erro: 'Usuário ou senha inválidos' }
}

// ============================================================
// CLIENTES
// ============================================================
const clientes = {
  listar(filtros = {}) {
    let sql = `SELECT * FROM clientes WHERE 1=1`
    const params = []

    if (filtros.busca) {
      sql += ` AND (nome LIKE ? OR cgc LIKE ? OR cpf LIKE ? OR codigo LIKE ?)`
      const b = `%${filtros.busca}%`
      params.push(b, b, b, b)
    }
    if (filtros.situacao) {
      sql += ` AND codigo_situacao_cliente = ?`
      params.push(filtros.situacao)
    }
    sql += ` ORDER BY nome LIMIT 500`
    return db.prepare(sql).all(...params)
  },

  buscar(codigo) {
    return db.prepare(`SELECT * FROM clientes WHERE codigo = ?`).get(codigo)
  },

  salvar(dados) {
    const existe = db
      .prepare(`SELECT id FROM clientes WHERE codigo = ?`)
      .get(dados.codigo)
    if (existe) {
      const sets = Object.keys(dados)
        .filter((k) => k !== 'codigo')
        .map((k) => `${k} = ?`)
        .join(', ')
      const vals = Object.keys(dados)
        .filter((k) => k !== 'codigo')
        .map((k) => dados[k])
      db.prepare(
        `UPDATE clientes SET ${sets}, data_atualizacao = ?, hora_atualizacao = ? WHERE codigo = ?`,
      ).run(...vals, hoje(), agora(), dados.codigo)
    } else {
      const cols = Object.keys(dados).join(', ')
      const phs = Object.keys(dados)
        .map(() => '?')
        .join(', ')
      db.prepare(
        `INSERT INTO clientes (${cols}, data_atualizacao, hora_atualizacao) VALUES (${phs}, ?, ?)`,
      ).run(...Object.values(dados), hoje(), agora())
    }
    return { sucesso: true }
  },

  excluir(codigo) {
    db.prepare(
      `UPDATE clientes SET status_registro = 'I' WHERE codigo = ?`,
    ).run(codigo)
    return { sucesso: true }
  },
}

// ============================================================
// PRODUTOS
// ============================================================
const produtos = {
  listar(filtros = {}) {
    let sql = `SELECT * FROM produtos WHERE 1=1`
    const params = []

    if (filtros.busca) {
      sql += ` AND (descricao LIKE ? OR codigo LIKE ? OR ean LIKE ? OR referencia LIKE ?)`
      const b = `%${filtros.busca}%`
      params.push(b, b, b, b)
    }
    if (filtros.grupo) {
      sql += ` AND codigo_grupo = ?`
      params.push(filtros.grupo)
    }
    if (filtros.linha) {
      sql += ` AND codigo_linha = ?`
      params.push(filtros.linha)
    }
    if (filtros.situacao) {
      sql += ` AND situacao_produto = ?`
      params.push(filtros.situacao)
    }
    if (filtros.estoqueBaixo) {
      sql += ` AND estoque_atual <= estoque_minimo AND controla_estoque = 'S'`
    }
    sql += ` ORDER BY descricao LIMIT 500`
    return db.prepare(sql).all(...params)
  },

  buscar(codigo) {
    return db.prepare(`SELECT * FROM produtos WHERE codigo = ?`).get(codigo)
  },

  salvar(dados) {
    const existe = db
      .prepare(`SELECT id FROM produtos WHERE codigo = ?`)
      .get(dados.codigo)
    if (existe) {
      const sets = Object.keys(dados)
        .filter((k) => k !== 'codigo')
        .map((k) => `${k} = ?`)
        .join(', ')
      const vals = Object.keys(dados)
        .filter((k) => k !== 'codigo')
        .map((k) => dados[k])
      db.prepare(
        `UPDATE produtos SET ${sets}, data_atualizacao = ?, hora_atualizacao = ? WHERE codigo = ?`,
      ).run(...vals, hoje(), agora(), dados.codigo)
    } else {
      const cols = Object.keys(dados).join(', ')
      const phs = Object.keys(dados)
        .map(() => '?')
        .join(', ')
      db.prepare(
        `INSERT INTO produtos (${cols}, data_atualizacao, hora_atualizacao) VALUES (${phs}, ?, ?)`,
      ).run(...Object.values(dados), hoje(), agora())
    }
    return { sucesso: true }
  },

  excluir(codigo) {
    db.prepare(
      `UPDATE produtos SET situacao_produto = 'I' WHERE codigo = ?`,
    ).run(codigo)
    return { sucesso: true }
  },
}

// ============================================================
// VENDAS
// ============================================================
const vendas = {
  listar(filtros = {}) {
    let sql = `
      SELECT v.*, c.nome as nome_cliente
      FROM vendas v
      LEFT JOIN clientes c ON v.codigo_cliente = c.codigo
      WHERE 1=1
    `
    const params = []

    if (filtros.dataInicio) {
      sql += ` AND v.data >= ?`
      params.push(filtros.dataInicio)
    }
    if (filtros.dataFim) {
      sql += ` AND v.data <= ?`
      params.push(filtros.dataFim)
    }
    if (filtros.situacao) {
      sql += ` AND v.situacao = ?`
      params.push(filtros.situacao)
    }
    if (filtros.cliente) {
      sql += ` AND (c.nome LIKE ? OR v.codigo_cliente = ?)`
      const b = `%${filtros.cliente}%`
      params.push(b, filtros.cliente)
    }

    sql += ` ORDER BY v.data DESC, v.orcamento DESC LIMIT 500`
    return db.prepare(sql).all(...params)
  },

  buscar(orcamento) {
    const venda = db
      .prepare(
        `
      SELECT v.*, c.nome as nome_cliente
      FROM vendas v
      LEFT JOIN clientes c ON v.codigo_cliente = c.codigo
      WHERE v.orcamento = ?
    `,
      )
      .get(orcamento)

    if (venda) {
      venda.itens = db
        .prepare(
          `
        SELECT vi.*, p.descricao as desc_produto
        FROM vendas_itens vi
        LEFT JOIN produtos p ON vi.codigo_produto = p.codigo
        WHERE vi.orcamento = ?
      `,
        )
        .all(orcamento)
    }
    return venda
  },

  proximoNumero() {
    const row = db
      .prepare(`SELECT MAX(CAST(orcamento AS INTEGER)) as ultimo FROM vendas`)
      .get()
    const proximo = ((row?.ultimo || 0) + 1).toString().padStart(8, '0')
    return { numero: proximo }
  },

  salvar(dados) {
    const { itens, ...venda } = dados

    const salvarVenda = db.transaction(() => {
      // Salva cabeçalho
      const existe = db
        .prepare(`SELECT id FROM vendas WHERE orcamento = ?`)
        .get(venda.orcamento)
      if (existe) {
        db.prepare(
          `UPDATE vendas SET codigo_cliente=?, data=?, tipo_venda=?, situacao=?,
          valor_total=?, valor_descontos_itens=?, valor_acrescimo=?, valor_desconto_final=?,
          valor_entrada=?, valor_restante=?, codigo_forma_pagamento1=?, valor_pago_dinheiro=?,
          valor_pago_cartao_credito=?, valor_pago_cartao_debito=?, valor_pago_cheque=?,
          usuario_cadastro=?, data_cadastro=?, hora_cadastro=?
          WHERE orcamento = ?`,
        ).run(
          venda.codigo_cliente,
          venda.data,
          venda.tipo_venda || 'V',
          venda.situacao || 'N',
          venda.valor_total,
          venda.valor_descontos_itens || 0,
          venda.valor_acrescimo || 0,
          venda.valor_desconto_final || 0,
          venda.valor_entrada || 0,
          venda.valor_restante || 0,
          venda.codigo_forma_pagamento1,
          venda.valor_pago_dinheiro || 0,
          venda.valor_pago_cartao_credito || 0,
          venda.valor_pago_cartao_debito || 0,
          venda.valor_pago_cheque || 0,
          venda.usuario_cadastro,
          hoje(),
          agora(),
          venda.orcamento,
        )
        db.prepare(`DELETE FROM vendas_itens WHERE orcamento = ?`).run(
          venda.orcamento,
        )
      } else {
        db.prepare(
          `INSERT INTO vendas (orcamento, codigo_cliente, data, tipo_venda, situacao,
          valor_total, valor_descontos_itens, valor_acrescimo, valor_desconto_final,
          valor_entrada, valor_restante, codigo_forma_pagamento1, valor_pago_dinheiro,
          valor_pago_cartao_credito, valor_pago_cartao_debito, valor_pago_cheque,
          usuario_cadastro, data_cadastro, hora_cadastro)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        ).run(
          venda.orcamento,
          venda.codigo_cliente,
          venda.data,
          venda.tipo_venda || 'V',
          'N',
          venda.valor_total,
          venda.valor_descontos_itens || 0,
          venda.valor_acrescimo || 0,
          venda.valor_desconto_final || 0,
          venda.valor_entrada || 0,
          venda.valor_restante || 0,
          venda.codigo_forma_pagamento1,
          venda.valor_pago_dinheiro || 0,
          venda.valor_pago_cartao_credito || 0,
          venda.valor_pago_cartao_debito || 0,
          venda.valor_pago_cheque || 0,
          venda.usuario_cadastro,
          hoje(),
          agora(),
        )
      }

      // Salva itens e atualiza estoque
      const insItem = db.prepare(`INSERT INTO vendas_itens
        (orcamento, codigo_produto, descricao, quantidade, unidade, preco_unitario, preco_custo, valor_desconto, valor_acrescimo, valor_total)
        VALUES (?,?,?,?,?,?,?,?,?,?)`)

      for (const item of itens || []) {
        insItem.run(
          venda.orcamento,
          item.codigo_produto,
          item.descricao,
          item.quantidade,
          item.unidade,
          item.preco_unitario,
          item.preco_custo || 0,
          item.valor_desconto || 0,
          item.valor_acrescimo || 0,
          item.valor_total,
        )

        // Atualiza estoque
        db.prepare(
          `UPDATE produtos SET estoque_atual = estoque_atual - ? WHERE codigo = ?`,
        ).run(item.quantidade, item.codigo_produto)
      }

      // Atualiza haver do cliente se necessário
      if (venda.valor_deixado_em_haver > 0) {
        db.prepare(
          `UPDATE clientes SET haver = haver + ? WHERE codigo = ?`,
        ).run(venda.valor_deixado_em_haver, venda.codigo_cliente)
      }
    })

    salvarVenda()
    return { sucesso: true, orcamento: venda.orcamento }
  },

  cancelar(orcamento, motivo, usuario) {
    const cancelar = db.transaction(() => {
      // Reverte estoque
      const itens = db
        .prepare(`SELECT * FROM vendas_itens WHERE orcamento = ?`)
        .all(orcamento)
      for (const item of itens) {
        db.prepare(
          `UPDATE produtos SET estoque_atual = estoque_atual + ? WHERE codigo = ?`,
        ).run(item.quantidade, item.codigo_produto)
      }
      db.prepare(
        `UPDATE vendas SET situacao='C', usuario_cancelamento=?, data_cancelamento=?, motivo_cancelamento=? WHERE orcamento=?`,
      ).run(usuario, hoje(), motivo, orcamento)
    })
    cancelar()
    return { sucesso: true }
  },
}

// ============================================================
// CONTAS A RECEBER
// ============================================================
const contasReceber = {
  listar(filtros = {}) {
    let sql = `
      SELECT cr.*, c.nome as nome_cliente
      FROM contas_receber cr
      LEFT JOIN clientes c ON cr.codigo_cliente = c.codigo
      WHERE 1=1
    `
    const params = []
    if (filtros.situacao) {
      sql += ` AND cr.situacao_docto = ?`
      params.push(filtros.situacao)
    }
    if (filtros.cliente) {
      sql += ` AND (c.nome LIKE ? OR cr.codigo_cliente = ?)`
      params.push(`%${filtros.cliente}%`, filtros.cliente)
    }
    if (filtros.dataInicio) {
      sql += ` AND cr.data_vencimento >= ?`
      params.push(filtros.dataInicio)
    }
    if (filtros.dataFim) {
      sql += ` AND cr.data_vencimento <= ?`
      params.push(filtros.dataFim)
    }
    sql += ` ORDER BY cr.data_vencimento ASC LIMIT 500`
    return db.prepare(sql).all(...params)
  },

  totalAberto() {
    const row = db
      .prepare(
        `SELECT SUM(valor_docto - COALESCE(valor_pagamento,0)) as total FROM contas_receber WHERE situacao_docto = 'A'`,
      )
      .get()
    return { total: row?.total || 0 }
  },

  receber(dados) {
    db.prepare(
      `UPDATE contas_receber SET situacao_docto='P', data_pagamento=?, valor_pagamento=?,
      valor_desconto=?, valor_acrescimo=?, usuario=?, data_atualizacao=?, hora_atualizacao=?
      WHERE id = ?`,
    ).run(
      dados.data_pagamento || hoje(),
      dados.valor_pagamento,
      dados.valor_desconto || 0,
      dados.valor_acrescimo || 0,
      dados.usuario,
      hoje(),
      agora(),
      dados.id,
    )
    return { sucesso: true }
  },
}

// ============================================================
// CONTAS A PAGAR
// ============================================================
const contasPagar = {
  listar(filtros = {}) {
    let sql = `
      SELECT cp.*, f.nome as nome_fornecedor
      FROM contas_pagar cp
      LEFT JOIN fornecedores f ON cp.codigo_fornecedor = f.codigo
      WHERE 1=1
    `
    const params = []
    if (filtros.situacao) {
      sql += ` AND cp.situacao_docto = ?`
      params.push(filtros.situacao)
    }
    if (filtros.dataInicio) {
      sql += ` AND cp.data_vencimento >= ?`
      params.push(filtros.dataInicio)
    }
    if (filtros.dataFim) {
      sql += ` AND cp.data_vencimento <= ?`
      params.push(filtros.dataFim)
    }
    sql += ` ORDER BY cp.data_vencimento ASC LIMIT 500`
    return db.prepare(sql).all(...params)
  },

  totalAberto() {
    const row = db
      .prepare(
        `SELECT SUM(valor_docto - COALESCE(valor_pagamento,0)) as total FROM contas_pagar WHERE situacao_docto = 'A'`,
      )
      .get()
    return { total: row?.total || 0 }
  },

  pagar(dados) {
    db.prepare(
      `UPDATE contas_pagar SET situacao_docto='P', data_pagamento=?, valor_pagamento=?,
      valor_desconto=?, usuario=?, data_atualizacao=?, hora_atualizacao=?
      WHERE id = ?`,
    ).run(
      dados.data_pagamento || hoje(),
      dados.valor_pagamento,
      dados.valor_desconto || 0,
      dados.usuario,
      hoje(),
      agora(),
      dados.id,
    )
    return { sucesso: true }
  },
}

// ============================================================
// CAIXA
// ============================================================
const caixa = {
  status() {
    return db
      .prepare(
        `SELECT * FROM movimentos_caixa WHERE situacao = 'A' ORDER BY id DESC LIMIT 1`,
      )
      .get()
  },

  abrir(dados) {
    db.prepare(
      `INSERT INTO movimentos_caixa (numero_caixa, numero_turno, data_abertura, hora_abertura, usuario_abertura, valor_abertura, situacao)
      VALUES (?, ?, ?, ?, ?, ?, 'A')`,
    ).run(
      dados.numero_caixa || '001',
      dados.numero_turno || '1',
      hoje(),
      agora(),
      dados.usuario,
      dados.valor_abertura || 0,
    )
    db.prepare(
      `UPDATE configuracoes SET valor = 'S' WHERE chave = 'caixa_aberto'`,
    ).run()
    return { sucesso: true }
  },

  fechar(dados) {
    db.prepare(
      `UPDATE movimentos_caixa SET situacao='F', data_fechamento=?, hora_fechamento=?,
      usuario_fechamento=?, valor_fechamento=?, valor_dinheiro=?, valor_cheque=?,
      valor_cartao_credito=?, valor_cartao_debito=?
      WHERE situacao = 'A'`,
    ).run(
      hoje(),
      agora(),
      dados.usuario,
      dados.valor_fechamento || 0,
      dados.valor_dinheiro || 0,
      dados.valor_cheque || 0,
      dados.valor_cartao_credito || 0,
      dados.valor_cartao_debito || 0,
    )
    db.prepare(
      `UPDATE configuracoes SET valor = 'N' WHERE chave = 'caixa_aberto'`,
    ).run()
    return { sucesso: true }
  },
}

// ============================================================
// DASHBOARD
// ============================================================
const dashboard = {
  resumo(periodo = 'hoje') {
    let dataInicio
    const d = new Date()
    if (periodo === 'hoje') dataInicio = hoje()
    else if (periodo === 'semana') {
      d.setDate(d.getDate() - 7)
      dataInicio = d.toISOString().slice(0, 10)
    } else if (periodo === 'mes') {
      d.setDate(1)
      dataInicio = d.toISOString().slice(0, 10)
    } else dataInicio = hoje()

    const vendaTotal = db
      .prepare(
        `SELECT COALESCE(SUM(valor_total),0) as total, COUNT(*) as qtde FROM vendas WHERE data >= ? AND situacao = 'N'`,
      )
      .get(dataInicio)
    const crAberto = db
      .prepare(
        `SELECT COALESCE(SUM(valor_docto - COALESCE(valor_pagamento,0)),0) as total FROM contas_receber WHERE situacao_docto = 'A'`,
      )
      .get()
    const cpAberto = db
      .prepare(
        `SELECT COALESCE(SUM(valor_docto - COALESCE(valor_pagamento,0)),0) as total FROM contas_pagar WHERE situacao_docto = 'A'`,
      )
      .get()
    const estoqueBaixo = db
      .prepare(
        `SELECT COUNT(*) as qtde FROM produtos WHERE estoque_atual <= estoque_minimo AND controla_estoque = 'S' AND situacao_produto = 'A'`,
      )
      .get()
    const ultimas7 = db
      .prepare(
        `
      SELECT data, COALESCE(SUM(valor_total),0) as total
      FROM vendas WHERE data >= date('now', '-7 days') AND situacao = 'N'
      GROUP BY data ORDER BY data ASC
    `,
      )
      .all()

    return {
      vendas: { total: vendaTotal.total, qtde: vendaTotal.qtde },
      contasReceber: { total: crAberto.total },
      contasPagar: { total: cpAberto.total },
      estoqueBaixo: estoqueBaixo.qtde,
      grafico7dias: ultimas7,
    }
  },
}

// ============================================================
// CONFIGURAÇÕES
// ============================================================
const config = {
  get(chave) {
    if (chave)
      return db
        .prepare(`SELECT valor FROM configuracoes WHERE chave = ?`)
        .get(chave)
    return db.prepare(`SELECT * FROM configuracoes`).all()
  },
  set(chave, valor) {
    db.prepare(
      `INSERT INTO configuracoes (chave, valor) VALUES (?,?) ON CONFLICT(chave) DO UPDATE SET valor=?`,
    ).run(chave, valor, valor)
    return { sucesso: true }
  },
}

module.exports = {
  init,
  login,
  clientes,
  produtos,
  vendas,
  contasReceber,
  contasPagar,
  caixa,
  dashboard,
  config,
}
