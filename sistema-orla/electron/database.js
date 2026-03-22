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
function hashSenha(senha, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(senha, s, 100000, 64, 'sha256').toString('hex')
  return `pbkdf2:${s}:${hash}`
}

function verificarSenha(senha, hashArmazenado) {
  if (hashArmazenado && hashArmazenado.startsWith('pbkdf2:')) {
    const parts = hashArmazenado.split(':')
    const s = parts[1]
    const h = parts[2]
    return crypto.pbkdf2Sync(senha, s, 100000, 64, 'sha256').toString('hex') === h
  }
  // legado SHA256 — aceita enquanto migra
  return crypto.createHash('sha256').update(senha + 'gollino_salt').digest('hex') === hashArmazenado
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
  const row = db
    .prepare(
      `SELECT usuario, nome, nivel, super_usuario, codigo_vendedor, senha
       FROM usuarios WHERE usuario = ? AND ativo = 'S'`,
    )
    .get(usuario)

  if (!row || !verificarSenha(senha, row.senha)) {
    return { sucesso: false, erro: 'Usuário ou senha inválidos' }
  }

  // migração gradual: se ainda usa hash legado, atualiza para PBKDF2
  if (!row.senha.startsWith('pbkdf2:')) {
    db.prepare(`UPDATE usuarios SET senha = ? WHERE usuario = ?`).run(
      hashSenha(senha),
      usuario,
    )
  }

  db.prepare(`UPDATE usuarios SET ultima_saida = ? WHERE usuario = ?`).run(
    new Date().toISOString(),
    usuario,
  )

  const { senha: _s, ...usuarioSemSenha } = row
  return { sucesso: true, usuario: usuarioSemSenha }
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

      // Valida estoque antes de salvar
      for (const item of itens || []) {
        const prod = db
          .prepare(`SELECT estoque_atual, controla_estoque, descricao FROM produtos WHERE codigo = ?`)
          .get(item.codigo_produto)
        if (prod?.controla_estoque === 'S' && (prod.estoque_atual ?? 0) < item.quantidade) {
          throw new Error(
            `Estoque insuficiente: "${prod.descricao}" — disponível: ${prod.estoque_atual}, solicitado: ${item.quantidade}`,
          )
        }
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

      // Cria contas a receber para vendas a prazo/convênio (apenas em vendas novas)
      if (!existe && venda.situacao === 'N') {
        const crJaExiste = db
          .prepare(`SELECT id FROM contas_receber WHERE nro_docto = ? AND tipo_docto = 'VD'`)
          .get(venda.orcamento)

        if (!crJaExiste) {
          const insCR = db.prepare(`
            INSERT INTO contas_receber
              (nro_docto, tipo_docto, seq_docto, codigo_cliente, data_docto, data_vencimento,
               valor_docto, valor_original, situacao_docto, numero_caixa, numero_turno,
               usuario, data_atualizacao, hora_atualizacao)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)

          if (venda.codigo_forma_pagamento1 === 'Convênio') {
            // Vencimento padrão: 30 dias
            const d = new Date(); d.setDate(d.getDate() + 30)
            const dataVenc = d.toISOString().slice(0, 10)
            insCR.run(
              venda.orcamento, 'VD', '001', venda.codigo_cliente, hoje(), dataVenc,
              venda.valor_total, venda.valor_total, 'A',
              venda.numero_caixa || '001', venda.numero_turno || '1',
              venda.usuario_cadastro, hoje(), agora(),
            )
          } else if (venda.parcelas?.length > 0) {
            // Parcelamento: uma CR por parcela
            for (const p of venda.parcelas) {
              insCR.run(
                venda.orcamento, 'VD', p.seq, venda.codigo_cliente, hoje(), p.data_vencimento,
                p.valor, p.valor, 'A',
                venda.numero_caixa || '001', venda.numero_turno || '1',
                venda.usuario_cadastro, hoje(), agora(),
              )
            }
          }
        }
      }
    })

    try {
      salvarVenda()
      return { sucesso: true, orcamento: venda.orcamento }
    } catch (e) {
      return { sucesso: false, erro: e.message }
    }
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

  devolver(dados) {
    // dados: { orcamento, itens: [{codigo_produto, quantidade}], usuario, motivo }
    const devolver = db.transaction(() => {
      const venda = db
        .prepare(`SELECT * FROM vendas WHERE orcamento = ? AND situacao = 'N'`)
        .get(dados.orcamento)
      if (!venda) throw new Error('Venda não encontrada ou já cancelada/devolvida.')

      const itensOriginais = db
        .prepare(`SELECT * FROM vendas_itens WHERE orcamento = ?`)
        .all(dados.orcamento)

      let totalDevolvido = 0

      for (const item of dados.itens) {
        const orig = itensOriginais.find(i => i.codigo_produto === item.codigo_produto)
        if (!orig) throw new Error(`Produto ${item.codigo_produto} não encontrado na venda.`)
        if (item.quantidade > orig.quantidade)
          throw new Error(`Quantidade a devolver (${item.quantidade}) maior que a vendida (${orig.quantidade}) para ${orig.descricao}.`)

        // Reverte estoque
        db.prepare(`UPDATE produtos SET estoque_atual = estoque_atual + ? WHERE codigo = ?`)
          .run(item.quantidade, item.codigo_produto)

        totalDevolvido += (orig.preco_unitario || 0) * item.quantidade
      }

      // Verifica se é devolução total
      const totalItensDevolvidos = dados.itens.reduce((s, i) => s + i.quantidade, 0)
      const totalItensVendidos = itensOriginais.reduce((s, i) => s + i.quantidade, 0)
      const total = totalItensDevolvidos >= totalItensVendidos

      // Marca venda
      db.prepare(`UPDATE vendas SET situacao=?, motivo_cancelamento=?, usuario_cancelamento=?, data_cancelamento=? WHERE orcamento=?`)
        .run(total ? 'D' : 'N', dados.motivo || 'Devolução', dados.usuario, hoje(), dados.orcamento)

      // Cancela CR aberto desta venda
      db.prepare(`UPDATE contas_receber SET situacao_docto='C', data_atualizacao=?, hora_atualizacao=? WHERE nro_docto=? AND situacao_docto='A'`)
        .run(hoje(), agora(), dados.orcamento)

      // Credita haver do cliente
      if (venda.codigo_cliente) {
        db.prepare(`UPDATE clientes SET haver = haver + ? WHERE codigo = ?`)
          .run(totalDevolvido, venda.codigo_cliente)
      }

      return { totalDevolvido, total }
    })

    try {
      const resultado = devolver()
      return { sucesso: true, ...resultado }
    } catch (e) {
      return { sucesso: false, erro: e.message }
    }
  },
}

// ============================================================
// CONTAS A RECEBER
// ============================================================
const contasReceber = {
  listar(filtros = {}) {
    let sql = `
      SELECT cr.*,
        cr.nro_docto as numero_docto,
        (cr.valor_docto - COALESCE(cr.valor_pagamento, 0)) as valor_em_aberto,
        c.nome as nome_cliente
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

  salvar(dados) {
    const cols = Object.keys(dados).join(', ')
    const phs = Object.keys(dados)
      .map(() => '?')
      .join(', ')
    db.prepare(
      `INSERT INTO contas_pagar (${cols}, data_atualizacao, hora_atualizacao)
       VALUES (${phs}, ?, ?)`,
    ).run(...Object.values(dados), hoje(), agora())
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
    if (chave) {
      const row = db.prepare(`SELECT valor FROM configuracoes WHERE chave = ?`).get(chave)
      if (!row) return null
      try { return JSON.parse(row.valor) } catch { return row.valor }
    }
    return db.prepare(`SELECT * FROM configuracoes`).all()
  },
  set(chave, valor) {
    const valorStr = typeof valor === 'object' ? JSON.stringify(valor) : String(valor)
    db.prepare(
      `INSERT INTO configuracoes (chave, valor) VALUES (?,?) ON CONFLICT(chave) DO UPDATE SET valor=?`,
    ).run(chave, valorStr, valorStr)
    return { sucesso: true }
  },
}

// ============================================================
// PRÉ-VENDAS
// ============================================================
const preVendas = {
  proximoNumero() {
    const row = db
      .prepare(
        `SELECT MAX(CAST(numero AS INTEGER)) as ultimo FROM pre_vendas`,
      )
      .get()
    const proximo = ((row?.ultimo || 0) + 1).toString().padStart(8, '0')
    return { numero: proximo }
  },

  listar(filtros = {}) {
    let sql = `SELECT * FROM pre_vendas WHERE 1=1`
    const params = []
    if (filtros.busca) {
      sql += ` AND (nome_cliente LIKE ? OR numero LIKE ?)`
      const b = `%${filtros.busca}%`
      params.push(b, b)
    }
    if (filtros.situacao && filtros.situacao !== 'Todas') {
      sql += ` AND situacao = ?`
      params.push(filtros.situacao.toUpperCase())
    }
    sql += ` ORDER BY id DESC LIMIT 500`
    return db.prepare(sql).all(...params)
  },

  buscar(numero) {
    const pv = db
      .prepare(`SELECT * FROM pre_vendas WHERE numero = ?`)
      .get(numero)
    if (pv) {
      pv.itens = db
        .prepare(`SELECT * FROM pre_vendas_itens WHERE numero = ?`)
        .all(numero)
    }
    return pv
  },

  salvar(dados) {
    const { itens, ...pv } = dados
    const salvarPV = db.transaction(() => {
      const existe = db
        .prepare(`SELECT id FROM pre_vendas WHERE numero = ?`)
        .get(pv.numero)
      if (existe) {
        db.prepare(
          `UPDATE pre_vendas SET tipo=?, codigo_cliente=?, nome_cliente=?, vendedor=?,
          observacao=?, valor_total=?, qtde_itens=?, situacao=?,
          data_atualizacao=?, hora_atualizacao=? WHERE numero=?`,
        ).run(
          pv.tipo,
          pv.codigo_cliente || '',
          pv.nome_cliente,
          pv.vendedor,
          pv.observacao || '',
          pv.valor_total,
          pv.qtde_itens || 0,
          pv.situacao || 'ABERTA',
          hoje(),
          agora(),
          pv.numero,
        )
        db.prepare(`DELETE FROM pre_vendas_itens WHERE numero = ?`).run(
          pv.numero,
        )
      } else {
        db.prepare(
          `INSERT INTO pre_vendas (numero, tipo, codigo_cliente, nome_cliente, vendedor,
          observacao, valor_total, qtde_itens, situacao, data, hora, data_atualizacao, hora_atualizacao)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        ).run(
          pv.numero,
          pv.tipo,
          pv.codigo_cliente || '',
          pv.nome_cliente,
          pv.vendedor,
          pv.observacao || '',
          pv.valor_total,
          pv.qtde_itens || 0,
          'ABERTA',
          pv.data || hoje(),
          agora(),
          hoje(),
          agora(),
        )
      }
      const insItem = db.prepare(
        `INSERT INTO pre_vendas_itens (numero, codigo_produto, descricao, quantidade, preco_unitario, total)
        VALUES (?,?,?,?,?,?)`,
      )
      for (const item of itens || []) {
        insItem.run(
          pv.numero,
          item.codigo || item.codigo_produto,
          item.descricao,
          item.qty || item.quantidade,
          item.preco_unitario,
          item.total,
        )
      }
    })
    salvarPV()
    return { sucesso: true, numero: pv.numero }
  },

  cancelar(numero) {
    db.prepare(
      `UPDATE pre_vendas SET situacao='CANCELADA', data_atualizacao=?, hora_atualizacao=? WHERE numero=?`,
    ).run(hoje(), agora(), numero)
    return { sucesso: true }
  },

  baixar(numero) {
    db.prepare(
      `UPDATE pre_vendas SET situacao='BAIXADA', data_atualizacao=?, hora_atualizacao=? WHERE numero=?`,
    ).run(hoje(), agora(), numero)
    return { sucesso: true }
  },
}

// ============================================================
// MOVIMENTOS DE ESTOQUE
// ============================================================
const movimentosEstoque = {
  listar(filtros = {}) {
    let sql = `SELECT * FROM movimentos_estoque WHERE 1=1`
    const params = []
    if (filtros.busca) {
      sql += ` AND produto LIKE ?`
      params.push(`%${filtros.busca}%`)
    }
    if (filtros.tipo && filtros.tipo !== 'todos') {
      sql += ` AND tipo = ?`
      params.push(filtros.tipo)
    }
    sql += ` ORDER BY id DESC LIMIT 500`
    return db.prepare(sql).all(...params)
  },

  salvar(dados) {
    const qty = parseFloat(dados.quantidade)
    db.prepare(
      `INSERT INTO movimentos_estoque (tipo, produto_id, produto, quantidade, valor_unitario, total, data, fornecedor, obs, data_atualizacao, hora_atualizacao)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      dados.tipo,
      dados.produto_id,
      dados.produto,
      qty,
      parseFloat(dados.valor_unitario || 0),
      parseFloat(dados.total || 0),
      dados.data || hoje(),
      dados.fornecedor || '',
      dados.obs || '',
      hoje(),
      agora(),
    )
    // Atualiza estoque do produto
    if (dados.tipo === 'ENTRADA') {
      db.prepare(
        `UPDATE produtos SET estoque_atual = estoque_atual + ? WHERE codigo = ?`,
      ).run(qty, dados.produto_id)
    } else if (dados.tipo === 'SAIDA') {
      db.prepare(
        `UPDATE produtos SET estoque_atual = estoque_atual - ? WHERE codigo = ?`,
      ).run(qty, dados.produto_id)
    } else if (dados.tipo === 'ACERTO') {
      db.prepare(
        `UPDATE produtos SET estoque_atual = ? WHERE codigo = ?`,
      ).run(qty, dados.produto_id)
    }
    return { sucesso: true }
  },
}

const haver = {
  listar(busca) {
    let sql = `SELECT codigo, nome, cpf_cnpj, telefone, haver FROM clientes WHERE haver > 0`
    const params = []
    if (busca) {
      sql += ` AND (nome LIKE ? OR codigo LIKE ? OR cpf_cnpj LIKE ?)`
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`)
    }
    sql += ` ORDER BY haver DESC`
    return db.prepare(sql).all(...params)
  },

  ajustar(dados) {
    // dados: { codigo, valor (positivo=credito, negativo=debito), usuario }
    db.prepare(`UPDATE clientes SET haver = ROUND(MAX(0, haver + ?), 2) WHERE codigo = ?`)
      .run(dados.valor, dados.codigo)
    return { sucesso: true }
  },

  totalGeral() {
    const row = db.prepare(`SELECT COALESCE(SUM(haver),0) as total FROM clientes WHERE haver > 0`).get()
    return { total: row?.total || 0 }
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
  preVendas,
  movimentosEstoque,
  haver,
}
