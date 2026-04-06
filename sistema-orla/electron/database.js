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

  // Migração única de produtos — roda apenas uma vez
  const jaRodou = db.prepare(`SELECT valor FROM configuracoes WHERE chave = 'migracao_produtos_v1'`).get()
  if (!jaRodou) {
    migrarProdutos()
    db.prepare(`INSERT OR IGNORE INTO configuracoes (chave, valor, descricao) VALUES ('migracao_produtos_v1', 'S', 'Migração inicial de produtos')`).run()
    console.log('✅ Migração de produtos concluída.')
  }
}

function migrarProdutos() {
  const produtos = [
    { codigo: '00000004', descricao: 'APLICADOR P/SELANTES TUBO',        estoque: 3,      custo: 30.25,    preco: 48.00  },
    { codigo: '00000442', descricao: 'ARAME SOLDA [FIO]',                 estoque: 10,     custo: 4.892,    preco: 10.00  },
    { codigo: '00000079', descricao: 'BROCANTE-CC 3/16 X 7/8 X 5/16',    estoque: 2950,   custo: 0.1402,   preco: 0.30   },
    { codigo: '00000017', descricao: 'BROCANTE-SC 3/16 X 3/4 X 5/16',    estoque: 700,    custo: 0.1400,   preco: 0.30   },
    { codigo: '00000060', descricao: 'CHAPA GALVANIZADA 22/0,80MM',       estoque: 29.3,   custo: 9.15,     preco: 14.00  },
    { codigo: '00000736', descricao: 'CHAPA GALVANIZADA 24/0,65MM',       estoque: 169.1,  custo: 9.15,     preco: 13.00  },
    { codigo: '00000046', descricao: 'CHAPA GALVANIZADA 26/0,50MM',       estoque: 6241,   custo: 9.15,     preco: 13.00  },
    { codigo: '00000062', descricao: 'CONDUTOR 25',                        estoque: 25,     custo: 21.00,    preco: 33.00  },
    { codigo: '00000023', descricao: 'CONDUTOR 28',                        estoque: 60,     custo: 23.00,    preco: 35.00  },
    { codigo: '00000024', descricao: 'CONDUTOR 33',                        estoque: 203,    custo: 24.00,    preco: 40.00  },
    { codigo: '00000607', descricao: 'CONDUTOR 40',                        estoque: 25,     custo: 32.00,    preco: 53.00  },
    { codigo: '00000622', descricao: 'CONDUTOR 50',                        estoque: 40,     custo: 40.00,    preco: 65.00  },
    { codigo: '00000008', descricao: 'DISCO FINO INOX 4,5" TYROLIT',      estoque: 67,     custo: 5.396,    preco: 9.00   },
    { codigo: '00000570', descricao: 'DISCO FINO INOX 7" TYROLIT',        estoque: 39,     custo: 9.36,     preco: 14.00  },
    { codigo: '00000097', descricao: 'DOBRA DE CHAPA',                     estoque: 56.6,   custo: 0.10,     preco: 1.50   },
    { codigo: '00000756', descricao: 'ELETRODO 3,25MM',                    estoque: 4,      custo: 15.34,    preco: 25.00  },
    { codigo: '00000312', descricao: 'ELETRODO 2,5MM',                     estoque: 14.92,  custo: 16.40,    preco: 25.00  },
    { codigo: '00000374', descricao: 'ESQUADRO ALUMINIO 12"',              estoque: 3,      custo: 40.413,   preco: 62.00  },
    { codigo: '00000095', descricao: 'ESTANHADOR ELETRICO 110V 950W',      estoque: 1,      custo: 160.50,   preco: 240.00 },
    { codigo: '00000385', descricao: 'ESTANHO 50X50 SUPER LIGAS',          estoque: 99,     custo: 15.90,    preco: 25.00  },
    { codigo: '00000035', descricao: 'EXAUSTOR EOLICO 24',                 estoque: 7,      custo: 302.00,   preco: 500.00 },
    { codigo: '00000738', descricao: 'EXAUSTOR/COPO PROT.ROLAMENTO',       estoque: 13,     custo: 10.00,    preco: 20.00  },
    { codigo: '00000739', descricao: 'EXAUSTOR/MANCAL P/ROLAMENTO',        estoque: 15,     custo: 10.00,    preco: 20.00  },
    { codigo: '00000761', descricao: 'EXAUSTOR/ROLAMENTO 6201',            estoque: 1,      custo: 5.00,     preco: 10.00  },
    { codigo: '00000077', descricao: 'FITA ISOLANTE 3M 20MT',              estoque: 5,      custo: 8.0066,   preco: 13.00  },
    { codigo: '00000292', descricao: 'P.PHILLIPS 4,2X13 BROCANTE',         estoque: 20,     custo: 5.50,     preco: 10.00  },
    { codigo: '00001000', descricao: 'P.PHILLIPS 4,2X13 PONTA AGULHA',     estoque: 10,     custo: 5.50,     preco: 10.00  },
    { codigo: '00000112', descricao: 'PREGO 15 X 15',                      estoque: 20,     custo: 1.66,     preco: 4.00   },
    { codigo: '00000251', descricao: 'PREGO 18 X 24',                      estoque: 45,     custo: 2.104,    preco: 4.00   },
    { codigo: '00000543', descricao: 'PREGO DE ACO BEMICA',                estoque: 1,      custo: 26.90,    preco: 36.00  },
    { codigo: '00000113', descricao: 'PREGO DE ACO SFOR',                  estoque: 4,      custo: 15.90,    preco: 23.00  },
    { codigo: '00000566', descricao: 'PU HEKOL SACHE 600ML',               estoque: 70,     custo: 44.90,    preco: 60.00  },
    { codigo: '00000550', descricao: 'PU HEKOL TUBO 300ML',                estoque: 38,     custo: 32.90,    preco: 40.00  },
    { codigo: '00000178', descricao: 'PU UNIAO SACHE 870ML',               estoque: 44,     custo: 30.00,    preco: 45.00  },
    { codigo: '00000019', descricao: 'REBITE FLORADO',                      estoque: 484,    custo: 0.298,    preco: 0.50   },
    { codigo: '00000082', descricao: 'REBITE POP DE ACO 308',               estoque: 14,     custo: 13.90,    preco: 24.00  },
    { codigo: '00000279', descricao: 'TELHA FIBRA DE VIDRO LEITOSA 1',     estoque: 6,      custo: 59.00,    preco: 82.00  },
    { codigo: '00000758', descricao: 'TINTA SPRAY PRETO/BRANCA',            estoque: 14,     custo: 17.5465,  preco: 24.00  },
    { codigo: '00000812', descricao: 'VIDRO P/MASCARA SOLDA TRANSP.',       estoque: 6,      custo: 2.35,     preco: 3.50   },
  ]

  const upsert = db.prepare(`
    INSERT INTO produtos
      (codigo, descricao, estoque_atual, preco_custo_atual, preco_venda_vista, preco_venda_prazo,
       situacao_produto, controla_estoque, unidade, data_atualizacao)
    VALUES
      (@codigo, @descricao, @estoque, @custo, @preco, @preco, 'A', 'S', 'PC', date('now'))
    ON CONFLICT(codigo) DO UPDATE SET
      descricao         = excluded.descricao,
      estoque_atual     = excluded.estoque_atual,
      preco_custo_atual = excluded.preco_custo_atual,
      preco_venda_vista = excluded.preco_venda_vista,
      preco_venda_prazo = excluded.preco_venda_prazo,
      situacao_produto  = 'A',
      controla_estoque  = 'S',
      data_atualizacao  = date('now')
  `)

  const codigos = produtos.map(p => `'${p.codigo}'`).join(',')
  const inativar = db.prepare(`UPDATE produtos SET situacao_produto = 'I' WHERE codigo NOT IN (${codigos})`)

  db.transaction(() => {
    inativar.run()
    for (const p of produtos) upsert.run(p)
  })()
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
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function agora() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
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
      sql += ` AND estoque_atual <= estoque_minimo AND controla_estoque = 'S' AND situacao_produto = 'A'`
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
          observacao, usuario_cadastro, data_cadastro, hora_cadastro)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
          venda.observacao || '',
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

        db.prepare(`UPDATE produtos SET estoque_atual = estoque_atual - ? WHERE codigo = ?`)
          .run(item.quantidade, item.codigo_produto)

        // Registra saída no movimento de estoque
        db.prepare(`INSERT INTO movimentos_estoque (tipo, produto_id, produto, quantidade, valor_unitario, total, data, obs, usuario, data_atualizacao, hora_atualizacao)
          VALUES ('SAIDA', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(item.codigo_produto, item.descricao, item.quantidade, item.preco_unitario || 0, item.valor_total || 0,
            hoje(), `Venda #${venda.orcamento}`, venda.usuario_cadastro || 'sistema', hoje(), agora())
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
      const venda = db.prepare(`SELECT * FROM vendas WHERE orcamento = ?`).get(orcamento)

      // Reverte estoque e registra movimento
      const itens = db.prepare(`SELECT * FROM vendas_itens WHERE orcamento = ?`).all(orcamento)
      for (const item of itens) {
        db.prepare(`UPDATE produtos SET estoque_atual = estoque_atual + ? WHERE codigo = ?`)
          .run(item.quantidade, item.codigo_produto)

        db.prepare(`INSERT INTO movimentos_estoque (tipo, produto_id, produto, quantidade, valor_unitario, total, data, obs, usuario, data_atualizacao, hora_atualizacao)
          VALUES ('ENTRADA', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(item.codigo_produto, item.descricao, item.quantidade, item.preco_unitario || 0, item.valor_total || 0,
            hoje(), `Cancelamento venda #${orcamento}`, usuario, hoje(), agora())
      }

      // Cancela contas a receber em aberto desta venda
      db.prepare(`UPDATE contas_receber SET situacao_docto='C', data_atualizacao=?, hora_atualizacao=? WHERE nro_docto=? AND tipo_docto='VD' AND situacao_docto='A'`)
        .run(hoje(), agora(), orcamento)

      // Devolve haver ao cliente se a venda foi paga com haver
      if (venda?.valor_pago_haver > 0 && venda?.codigo_cliente) {
        db.prepare(`UPDATE clientes SET haver = haver + ? WHERE codigo = ?`)
          .run(venda.valor_pago_haver, venda.codigo_cliente)
      }

      db.prepare(`UPDATE vendas SET situacao='C', usuario_cancelamento=?, data_cancelamento=?, motivo_cancelamento=? WHERE orcamento=?`)
        .run(usuario, hoje(), motivo, orcamento)
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

  porOrcamento(orcamento) {
    return db.prepare(`SELECT * FROM contas_receber WHERE nro_docto = ? AND tipo_docto = 'VD' ORDER BY seq_docto`).all(String(orcamento))
  },

  saldoCliente(codigo_cliente) {
    const row = db.prepare(`SELECT COALESCE(SUM(valor_docto - COALESCE(valor_pagamento,0)),0) as total FROM contas_receber WHERE codigo_cliente = ? AND situacao_docto = 'A'`).get(codigo_cliente)
    return row?.total || 0
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
    // Retorna o caixa aberto, ou se não houver, o último do dia (para mostrar o fechamento no log)
    const aberto = db.prepare(`SELECT * FROM movimentos_caixa WHERE situacao = 'A' ORDER BY id DESC LIMIT 1`).get()
    if (aberto) return aberto
    return db.prepare(`SELECT * FROM movimentos_caixa WHERE data_abertura = ? ORDER BY id DESC LIMIT 1`).get(hoje())
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

  sessoesHoje() {
    return db.prepare(`SELECT * FROM movimentos_caixa WHERE data_abertura = ? ORDER BY id ASC`).all(hoje())
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
    // Entradas de caixa = somente o que efetivamente entrou (dinheiro + cartão + cheque)
    // Exclui a parcela que foi para contas a receber (prazo, convênio)
    const entradasCaixa = db
      .prepare(
        `SELECT COALESCE(SUM(
          COALESCE(valor_pago_dinheiro,0) +
          COALESCE(valor_pago_cartao_credito,0) +
          COALESCE(valor_pago_cartao_debito,0) +
          COALESCE(valor_pago_cheque,0) +
          COALESCE(valor_pago_haver,0)
        ),0) as total FROM vendas WHERE data = ? AND situacao = 'N'`,
      )
      .get(hoje())
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
      entradasCaixa: entradasCaixa.total,
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

// ============================================================
// IMPORTAÇÃO CSV
// ============================================================
function parseCSV(conteudo) {
  const lines = conteudo.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
  if (lines.length < 2) return []
  const sep = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  return lines.slice(1).map(line => {
    const values = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === sep && !inQ) { values.push(cur); cur = '' }
      else cur += ch
    }
    values.push(cur)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (values[i] || '').trim().replace(/^"|"$/g, '') })
    return obj
  }).filter(r => Object.values(r).some(v => v))
}

function num(v, d = 0) { const n = parseFloat(String(v || '').replace(',', '.')); return isNaN(n) ? d : n }
function str(v, d = '') { return String(v || d).trim() }
function yn(v, d = 'N') {
  const s = String(v || '').trim().toUpperCase()
  return (s === 'S' || s === 'SIM' || s === '1') ? 'S' : (s === 'N' || s === 'NAO' || s === 'NÃO' || s === '0') ? 'N' : d
}

const importar = {
  produtos(conteudo) {
    const rows = parseCSV(conteudo)
    const resultados = []

    const stmt = db.prepare(`
      INSERT INTO produtos (
        codigo, descricao, descricao_menor, referencia, unidade,
        codigo_grupo, codigo_linha,
        preco_venda_vista, preco_venda_prazo, preco_venda_minimo,
        custo_preco_unitario, preco_custo_atual,
        estoque_atual, estoque_minimo, controla_estoque,
        situacao_produto, data_cadastro, usuario_cadastro
      ) VALUES (
        @codigo, @descricao, @descricao_menor, @referencia, @unidade,
        @codigo_grupo, @codigo_linha,
        @preco_venda_vista, @preco_venda_prazo, @preco_venda_minimo,
        @custo_preco_unitario, @preco_custo_atual,
        @estoque_atual, @estoque_minimo, @controla_estoque,
        @situacao_produto, @data_cadastro, @usuario_cadastro
      )
      ON CONFLICT(codigo) DO UPDATE SET
        descricao = excluded.descricao,
        descricao_menor = excluded.descricao_menor,
        referencia = excluded.referencia,
        unidade = excluded.unidade,
        codigo_grupo = excluded.codigo_grupo,
        codigo_linha = excluded.codigo_linha,
        preco_venda_vista = excluded.preco_venda_vista,
        preco_venda_prazo = excluded.preco_venda_prazo,
        preco_venda_minimo = excluded.preco_venda_minimo,
        custo_preco_unitario = excluded.custo_preco_unitario,
        preco_custo_atual = excluded.preco_custo_atual,
        estoque_atual = excluded.estoque_atual,
        estoque_minimo = excluded.estoque_minimo,
        controla_estoque = excluded.controla_estoque,
        situacao_produto = excluded.situacao_produto,
        data_atualizacao = @data_cadastro
    `)

    const verificarProduto = db.prepare('SELECT 1 FROM produtos WHERE codigo = ?')

    const run = db.transaction(() => {
      for (const row of rows) {
        const codigo = str(row['codigo'] || row['cod'])
        const descricao = str(row['descricao'] || row['nome'] || row['produto'])
        if (!codigo || !descricao) {
          resultados.push({ codigo: codigo || '?', status: 'erro', motivo: 'código ou descrição ausente' })
          continue
        }
        try {
          stmt.run({
            codigo,
            descricao,
            descricao_menor: str(row['descricao_menor'] || descricao.substring(0, 30)),
            referencia: str(row['referencia'] || row['ref'] || row['ean'] || row['codigo_barras']),
            unidade: str(row['unidade'] || row['un'] || 'UN'),
            codigo_grupo: str(row['codigo_grupo'] || row['grupo']),
            codigo_linha: str(row['codigo_linha'] || row['linha']),
            preco_venda_vista: num(row['preco_venda_vista'] || row['preco_vista'] || row['preco'] || row['valor']),
            preco_venda_prazo: num(row['preco_venda_prazo'] || row['preco_prazo'] || row['preco'] || row['valor']),
            preco_venda_minimo: num(row['preco_venda_minimo'] || row['preco_minimo']),
            custo_preco_unitario: num(row['custo_preco_unitario'] || row['custo'] || row['preco_custo']),
            preco_custo_atual: num(row['preco_custo_atual'] || row['custo'] || row['preco_custo']),
            estoque_atual: num(row['estoque_atual'] || row['estoque'] || row['saldo']),
            estoque_minimo: num(row['estoque_minimo'] || row['minimo']),
            controla_estoque: yn(row['controla_estoque'] || row['controla'], 'S'),
            situacao_produto: str(row['situacao'], 'A'),
            data_cadastro: hoje(),
            usuario_cadastro: 'importacao',
          })
          resultados.push({ codigo, descricao, status: verificarProduto.get(codigo) ? 'atualizado' : 'inserido' })
        } catch (e) {
          resultados.push({ codigo, descricao, status: 'erro', motivo: e.message })
        }
      }
    })
    run()
    return { sucesso: true, resultados, total: rows.length }
  },

  clientes(conteudo) {
    const rows = parseCSV(conteudo)
    const resultados = []

    const stmt = db.prepare(`
      INSERT INTO clientes (
        codigo, nome, nome_fantasia, cpf, rg, cgc, ie,
        logradouro, numero, bairro, cep, cidade, uf,
        telefone, celular, email, limite_credito, haver,
        situacao_cliente, data_cadastro, usuario_cadastro
      ) VALUES (
        @codigo, @nome, @nome_fantasia, @cpf, @rg, @cgc, @ie,
        @logradouro, @numero, @bairro, @cep, @cidade, @uf,
        @telefone, @celular, @email, @limite_credito, @haver,
        @situacao_cliente, @data_cadastro, @usuario_cadastro
      )
      ON CONFLICT(codigo) DO UPDATE SET
        nome = excluded.nome, nome_fantasia = excluded.nome_fantasia,
        cpf = excluded.cpf, cgc = excluded.cgc, ie = excluded.ie,
        logradouro = excluded.logradouro, numero = excluded.numero,
        bairro = excluded.bairro, cep = excluded.cep, cidade = excluded.cidade, uf = excluded.uf,
        telefone = excluded.telefone, celular = excluded.celular, email = excluded.email,
        limite_credito = excluded.limite_credito, situacao_cliente = excluded.situacao_cliente,
        data_atualizacao = @data_cadastro
    `)

    const verificarCliente = db.prepare('SELECT 1 FROM clientes WHERE codigo = ?')

    const run = db.transaction(() => {
      for (const row of rows) {
        const codigo = str(row['codigo'] || row['cod'])
        const nome = str(row['nome'] || row['nome_cliente'] || row['cliente'] || row['razao_social'])
        if (!codigo || !nome) {
          resultados.push({ codigo: codigo || '?', status: 'erro', motivo: 'código ou nome ausente' })
          continue
        }
        try {
          stmt.run({
            codigo, nome,
            nome_fantasia: str(row['nome_fantasia'] || row['fantasia']),
            cpf: str(row['cpf']),
            rg: str(row['rg']),
            cgc: str(row['cgc'] || row['cnpj'] || row['cpf_cnpj']),
            ie: str(row['ie'] || row['inscricao_estadual']),
            logradouro: str(row['logradouro'] || row['endereco'] || row['rua']),
            numero: str(row['numero'] || row['num']),
            bairro: str(row['bairro']),
            cep: str(row['cep']),
            cidade: str(row['cidade']),
            uf: str(row['uf'] || row['estado']),
            telefone: str(row['telefone'] || row['fone'] || row['tel']),
            celular: str(row['celular'] || row['cel']),
            email: str(row['email']),
            limite_credito: num(row['limite_credito'] || row['limite']),
            haver: num(row['haver'] || row['credito'] || row['saldo_haver']),
            situacao_cliente: str(row['situacao'], 'A'),
            data_cadastro: hoje(),
            usuario_cadastro: 'importacao',
          })
          resultados.push({ codigo, nome, status: verificarCliente.get(codigo) ? 'atualizado' : 'inserido' })
        } catch (e) {
          resultados.push({ codigo, nome, status: 'erro', motivo: e.message })
        }
      }
    })
    run()
    return { sucesso: true, resultados, total: rows.length }
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

// ============================================================
// PEDIDOS DE COMPRA
// ============================================================
const pedidosCompra = {
  proximoNumero() {
    const row = db.prepare(`SELECT MAX(CAST(numero AS INTEGER)) as ultimo FROM pedidos_compra`).get()
    return { numero: ((row?.ultimo || 0) + 1).toString().padStart(6, '0') }
  },
  listar(filtros = {}) {
    let sql = `SELECT * FROM pedidos_compra WHERE 1=1`
    const params = []
    if (filtros.situacao && filtros.situacao !== 'todos') { sql += ` AND situacao = ?`; params.push(filtros.situacao) }
    if (filtros.busca) { sql += ` AND (fornecedor LIKE ? OR numero LIKE ?)`; const b = `%${filtros.busca}%`; params.push(b, b) }
    sql += ` ORDER BY id DESC LIMIT 200`
    const rows = db.prepare(sql).all(...params)
    if (rows.length === 0) return []
    const placeholders = rows.map(() => '?').join(',')
    const numeros = rows.map(r => r.numero)
    const itensAll = db.prepare(`SELECT * FROM pedidos_compra_itens WHERE numero IN (${placeholders})`).all(...numeros)
    const itensPorNumero = {}
    for (const item of itensAll) {
      if (!itensPorNumero[item.numero]) itensPorNumero[item.numero] = []
      itensPorNumero[item.numero].push(item)
    }
    return rows.map(r => ({ ...r, itens: itensPorNumero[r.numero] || [] }))
  },
  salvar(dados) {
    const { itens, ...pc } = dados
    db.transaction(() => {
      const existe = db.prepare(`SELECT id FROM pedidos_compra WHERE numero = ?`).get(pc.numero)
      if (existe) {
        db.prepare(`UPDATE pedidos_compra SET fornecedor=?,data=?,data_previsao=?,situacao=?,valor_total=?,observacao=?,usuario=?,data_atualizacao=?,hora_atualizacao=? WHERE numero=?`)
          .run(pc.fornecedor, pc.data, pc.data_previsao||null, pc.situacao||'ABERTO', pc.valor_total||0, pc.observacao||'', pc.usuario||'', hoje(), agora(), pc.numero)
        db.prepare(`DELETE FROM pedidos_compra_itens WHERE numero = ?`).run(pc.numero)
      } else {
        db.prepare(`INSERT INTO pedidos_compra (numero,fornecedor,data,data_previsao,situacao,valor_total,observacao,usuario,data_atualizacao,hora_atualizacao) VALUES (?,?,?,?,?,?,?,?,?,?)`)
          .run(pc.numero, pc.fornecedor, pc.data||hoje(), pc.data_previsao||null, 'ABERTO', pc.valor_total||0, pc.observacao||'', pc.usuario||'', hoje(), agora())
      }
      const ins = db.prepare(`INSERT INTO pedidos_compra_itens (numero,codigo_produto,descricao,quantidade,preco_unitario,total) VALUES (?,?,?,?,?,?)`)
      for (const item of itens || []) ins.run(pc.numero, item.codigo_produto, item.descricao, item.quantidade, item.preco_unitario||0, item.total||0)
    })()
    return { sucesso: true, numero: pc.numero }
  },
  cancelar(numero) {
    db.prepare(`UPDATE pedidos_compra SET situacao='CANCELADO',data_atualizacao=?,hora_atualizacao=? WHERE numero=?`).run(hoje(), agora(), numero)
    return { sucesso: true }
  },
  receber(numero) {
    db.prepare(`UPDATE pedidos_compra SET situacao='RECEBIDO',data_atualizacao=?,hora_atualizacao=? WHERE numero=?`).run(hoje(), agora(), numero)
    return { sucesso: true }
  },
}

// ============================================================
// CHEQUES
// ============================================================
const cheques = {
  listar(filtros = {}) {
    let sql = `SELECT * FROM cheques WHERE 1=1`
    const params = []
    if (filtros.tipo) { sql += ` AND tipo = ?`; params.push(filtros.tipo) }
    if (filtros.situacao && filtros.situacao !== 'todos') { sql += ` AND situacao = ?`; params.push(filtros.situacao) }
    if (filtros.busca) { sql += ` AND (nome_pessoa LIKE ? OR numero LIKE ?)`; const b = `%${filtros.busca}%`; params.push(b, b) }
    if (filtros.dataInicio) { sql += ` AND data_vencimento >= ?`; params.push(filtros.dataInicio) }
    if (filtros.dataFim) { sql += ` AND data_vencimento <= ?`; params.push(filtros.dataFim) }
    sql += ` ORDER BY data_vencimento ASC, id DESC LIMIT 300`
    return db.prepare(sql).all(...params)
  },
  salvar(dados) {
    if (dados.id) {
      db.prepare(`UPDATE cheques SET tipo=?,numero=?,banco=?,valor=?,data_emissao=?,data_vencimento=?,codigo_pessoa=?,nome_pessoa=?,nro_docto=?,situacao=?,observacao=?,usuario=?,data_atualizacao=?,hora_atualizacao=? WHERE id=?`)
        .run(dados.tipo, dados.numero||'', dados.banco||'', dados.valor||0, dados.data_emissao||null, dados.data_vencimento||null, dados.codigo_pessoa||'', dados.nome_pessoa||'', dados.nro_docto||'', dados.situacao||'A', dados.observacao||'', dados.usuario||'', hoje(), agora(), dados.id)
    } else {
      db.prepare(`INSERT INTO cheques (tipo,numero,banco,valor,data_emissao,data_vencimento,codigo_pessoa,nome_pessoa,nro_docto,situacao,observacao,usuario,data_atualizacao,hora_atualizacao) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(dados.tipo, dados.numero||'', dados.banco||'', dados.valor||0, dados.data_emissao||null, dados.data_vencimento||null, dados.codigo_pessoa||'', dados.nome_pessoa||'', dados.nro_docto||'', 'A', dados.observacao||'', dados.usuario||'', hoje(), agora())
    }
    return { sucesso: true }
  },
  baixar(id, data_compensacao, usuario) {
    db.prepare(`UPDATE cheques SET situacao='C',data_compensacao=?,usuario=?,data_atualizacao=?,hora_atualizacao=? WHERE id=?`)
      .run(data_compensacao || hoje(), usuario||'', hoje(), agora(), id)
    return { sucesso: true }
  },
  devolver(id, usuario) {
    db.prepare(`UPDATE cheques SET situacao='D',usuario=?,data_atualizacao=?,hora_atualizacao=? WHERE id=?`)
      .run(usuario||'', hoje(), agora(), id)
    return { sucesso: true }
  },
}

// ============================================================
// LANÇAMENTOS EXTRAS (receitas, despesas, vales)
// ============================================================
const lancamentosExtras = {
  listar(filtros = {}) {
    let sql = `SELECT * FROM lancamentos_extras WHERE 1=1`
    const params = []
    if (filtros.tipo) { sql += ` AND tipo = ?`; params.push(filtros.tipo) }
    if (filtros.situacao && filtros.situacao !== 'todos') { sql += ` AND situacao = ?`; params.push(filtros.situacao) }
    if (filtros.busca) { sql += ` AND (descricao LIKE ? OR nome_pessoa LIKE ?)`; const b = `%${filtros.busca}%`; params.push(b, b) }
    if (filtros.dataInicio) { sql += ` AND data >= ?`; params.push(filtros.dataInicio) }
    if (filtros.dataFim) { sql += ` AND data <= ?`; params.push(filtros.dataFim) }
    sql += ` ORDER BY data DESC, id DESC LIMIT 300`
    return db.prepare(sql).all(...params)
  },
  salvar(dados) {
    if (dados.id) {
      db.prepare(`UPDATE lancamentos_extras SET tipo=?,descricao=?,valor=?,data=?,nome_pessoa=?,forma_pagamento=?,situacao=?,observacao=?,usuario=?,data_atualizacao=?,hora_atualizacao=? WHERE id=?`)
        .run(dados.tipo, dados.descricao, dados.valor||0, dados.data, dados.nome_pessoa||'', dados.forma_pagamento||'', dados.situacao||'A', dados.observacao||'', dados.usuario||'', hoje(), agora(), dados.id)
    } else {
      db.prepare(`INSERT INTO lancamentos_extras (tipo,descricao,valor,data,nome_pessoa,forma_pagamento,situacao,observacao,usuario,data_atualizacao,hora_atualizacao) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
        .run(dados.tipo, dados.descricao, dados.valor||0, dados.data||hoje(), dados.nome_pessoa||'', dados.forma_pagamento||'', 'A', dados.observacao||'', dados.usuario||'', hoje(), agora())
    }
    return { sucesso: true }
  },
  pagar(id, usuario) {
    db.prepare(`UPDATE lancamentos_extras SET situacao='P',data_pagamento=?,usuario=?,data_atualizacao=?,hora_atualizacao=? WHERE id=?`)
      .run(hoje(), usuario||'', hoje(), agora(), id)
    return { sucesso: true }
  },
  cancelar(id) {
    db.prepare(`UPDATE lancamentos_extras SET situacao='C',data_atualizacao=?,hora_atualizacao=? WHERE id=?`)
      .run(hoje(), agora(), id)
    return { sucesso: true }
  },
}

// ============================================================
// REAJUSTE DE PREÇOS
// ============================================================
const reajustesPreco = {
  listar(filtros = {}) {
    let sql = `SELECT * FROM reajustes_preco WHERE 1=1`
    const params = []
    if (filtros.dataInicio) { sql += ` AND data >= ?`; params.push(filtros.dataInicio) }
    if (filtros.dataFim) { sql += ` AND data <= ?`; params.push(filtros.dataFim) }
    if (filtros.busca) { sql += ` AND produto LIKE ?`; params.push(`%${filtros.busca}%`) }
    sql += ` ORDER BY id DESC LIMIT 500`
    return db.prepare(sql).all(...params)
  },
  aplicar(codigos, percentual, usuario) {
    // codigos: array de código de produto; percentual: float (ex: 10 = +10%, -5 = -5%)
    const fator = 1 + (percentual / 100)
    const selProd = db.prepare(`SELECT codigo, descricao, preco_venda_vista, preco_venda_prazo FROM produtos WHERE codigo = ?`)
    const updProd = db.prepare(`UPDATE produtos SET preco_venda_vista=?,preco_venda_prazo=?,data_atualizacao=? WHERE codigo=?`)
    const insLog = db.prepare(`INSERT INTO reajustes_preco (codigo_produto,produto,preco_anterior,preco_novo,percentual,data,usuario) VALUES (?,?,?,?,?,?,?)`)
    const dataHoje = hoje()
    db.transaction(() => {
      for (const codigo of codigos) {
        const prod = selProd.get(codigo)
        if (!prod) continue
        const novoVista = Math.round(prod.preco_venda_vista * fator * 100) / 100
        const novoPrazo = Math.round(prod.preco_venda_prazo * fator * 100) / 100
        updProd.run(novoVista, novoPrazo, dataHoje, codigo)
        insLog.run(codigo, prod.descricao, prod.preco_venda_vista, novoVista, percentual, dataHoje, usuario||'')
      }
    })()
    return { sucesso: true, atualizados: codigos.length }
  },
}

// ============================================================
// NF-e
// ============================================================
const nfe = {
  listar(filtros = {}) {
    let sql = `
      SELECT v.orcamento, v.data, v.hora_cadastro, v.valor_total, v.situacao,
        v.numero_nfe, v.codigo_cliente, COALESCE(c.nome, 'Consumidor') as nome_cliente,
        v.usuario_cadastro
      FROM vendas v LEFT JOIN clientes c ON v.codigo_cliente = c.codigo
      WHERE v.situacao NOT IN ('C')
    `
    const params = []
    if (filtros.dataInicio) { sql += ` AND v.data >= ?`; params.push(filtros.dataInicio) }
    if (filtros.dataFim) { sql += ` AND v.data <= ?`; params.push(filtros.dataFim) }
    if (filtros.status === 'com') { sql += ` AND v.numero_nfe IS NOT NULL AND v.numero_nfe != ''` }
    if (filtros.status === 'sem') { sql += ` AND (v.numero_nfe IS NULL OR v.numero_nfe = '')` }
    if (filtros.busca) {
      sql += ` AND (COALESCE(c.nome,'') LIKE ? OR v.orcamento LIKE ? OR v.numero_nfe LIKE ?)`
      const b = `%${filtros.busca}%`
      params.push(b, b, b)
    }
    sql += ` ORDER BY v.data DESC, v.hora_cadastro DESC LIMIT 500`
    return db.prepare(sql).all(...params)
  },

  registrar(orcamento, numero_nfe) {
    db.prepare(`UPDATE vendas SET numero_nfe = ? WHERE orcamento = ?`)
      .run(numero_nfe || null, orcamento)
    return { sucesso: true }
  },
}

// ============================================================
// LOG DO SISTEMA
// ============================================================
const log = {
  listar(filtros = {}) {
    const dataInicio = filtros.dataInicio || null
    const dataFim = filtros.dataFim || null
    const categoria = filtros.categoria || null

    let sql = `
      SELECT categoria, ref, descricao, valor, data, hora, usuario, extra
      FROM (
        SELECT 'VENDA' as categoria, v.orcamento as ref,
          COALESCE(c.nome, 'Consumidor') as descricao,
          v.valor_total as valor, v.data, v.hora_cadastro as hora,
          COALESCE(v.usuario_cadastro,'') as usuario, '' as extra
        FROM vendas v LEFT JOIN clientes c ON v.codigo_cliente = c.codigo
        WHERE v.situacao NOT IN ('C','D')

        UNION ALL

        SELECT 'CANCELAMENTO', v.orcamento,
          COALESCE(c.nome, 'Consumidor'),
          v.valor_total,
          COALESCE(v.data_cancelamento, v.data),
          v.hora_cadastro,
          COALESCE(v.usuario_cancelamento,''),
          COALESCE(v.motivo_cancelamento,'')
        FROM vendas v LEFT JOIN clientes c ON v.codigo_cliente = c.codigo
        WHERE v.situacao = 'C'

        UNION ALL

        SELECT 'ESTOQUE_' || tipo, CAST(id AS TEXT),
          produto || ' ×' || CAST(CAST(quantidade AS INTEGER) AS TEXT),
          total, data, hora_atualizacao,
          '', COALESCE(obs,'')
        FROM movimentos_estoque

        UNION ALL

        SELECT 'CAIXA_ABERTURA', CAST(id AS TEXT),
          'Caixa aberto',
          COALESCE(valor_abertura,0), data_abertura, hora_abertura,
          COALESCE(usuario_abertura,''), ''
        FROM movimentos_caixa WHERE data_abertura IS NOT NULL

        UNION ALL

        SELECT 'CAIXA_FECHAMENTO', CAST(id AS TEXT),
          'Caixa fechado',
          COALESCE(valor_fechamento,0), data_fechamento, hora_fechamento,
          COALESCE(usuario_fechamento,''), ''
        FROM movimentos_caixa WHERE situacao='F' AND data_fechamento IS NOT NULL

        UNION ALL

        SELECT 'RECEBIMENTO', cr.nro_docto,
          COALESCE(c.nome,'Consumidor'),
          cr.valor_docto, cr.data_pagamento, cr.hora_atualizacao,
          COALESCE(cr.usuario,''), ''
        FROM contas_receber cr LEFT JOIN clientes c ON cr.codigo_cliente = c.codigo
        WHERE cr.situacao_docto='P' AND cr.data_pagamento IS NOT NULL
      )
      WHERE 1=1
    `
    const params = []
    if (dataInicio) { sql += ` AND data >= ?`; params.push(dataInicio) }
    if (dataFim) { sql += ` AND data <= ?`; params.push(dataFim) }
    if (categoria) { sql += ` AND categoria LIKE ?`; params.push(categoria + '%') }
    sql += ` ORDER BY data DESC, hora DESC LIMIT 500`
    return db.prepare(sql).all(...params)
  },
}

const manutencao = {
  // Cancela CR abertos de vendas que já foram canceladas
  corrigirCROrfaos() {
    const resultado = db.prepare(`
      UPDATE contas_receber SET situacao_docto='C', data_atualizacao=?, hora_atualizacao=?
      WHERE tipo_docto='VD' AND situacao_docto='A'
        AND nro_docto IN (SELECT orcamento FROM vendas WHERE situacao='C')
    `).run(hoje(), agora())
    return { corrigidos: resultado.changes }
  },
}

// ============================================================
// RELATÓRIOS GERENCIAIS
// ============================================================
const relatorios = {
  inventario() {
    return db.prepare(`
      SELECT codigo, descricao, unidade, estoque_atual, estoque_minimo,
             preco_custo_atual, preco_venda_vista,
             ROUND(estoque_atual * preco_custo_atual, 4) as valor_custo,
             ROUND(estoque_atual * preco_venda_vista, 4) as valor_vista
      FROM produtos
      WHERE situacao_produto = 'A'
      ORDER BY descricao
    `).all()
  },

  itenisVendidos(dataInicio, dataFim) {
    return db.prepare(`
      SELECT vi.codigo_produto as codigo, vi.descricao,
             SUM(vi.quantidade) as quantidade,
             SUM(vi.valor_total) as valor_venda
      FROM vendas_itens vi
      JOIN vendas v ON vi.orcamento = v.orcamento
      WHERE v.situacao = 'N' AND v.data >= ? AND v.data <= ?
      GROUP BY vi.codigo_produto, vi.descricao
      ORDER BY vi.descricao
    `).all(dataInicio, dataFim)
  },

  entradasMercadoria(dataInicio, dataFim) {
    return db.prepare(`
      SELECT produto_id as codigo, produto as descricao,
             SUM(quantidade) as qtde_total,
             SUM(total) as valor_total
      FROM movimentos_estoque
      WHERE tipo = 'ENTRADA' AND data >= ? AND data <= ?
      GROUP BY produto_id, produto
      ORDER BY produto
    `).all(dataInicio, dataFim)
  },

  extrato(dataInicio, dataFim) {
    const saldoAntes = db.prepare(`
      SELECT COALESCE(SUM(valor), 0) as total FROM (
        SELECT valor_pagamento as valor FROM contas_receber
          WHERE situacao_docto = 'P' AND data_pagamento < ?
        UNION ALL
        SELECT -valor_pagamento FROM contas_pagar
          WHERE situacao_docto = 'P' AND data_pagamento < ?
        UNION ALL
        SELECT CASE WHEN tipo = 'RECEITA' THEN valor ELSE -valor END
          FROM lancamentos_extras WHERE situacao = 'P' AND data_pagamento < ?
      )
    `).get(dataInicio, dataInicio, dataInicio)

    const movimentos = db.prepare(`
      SELECT data, historico, debito, credito, documento, observacao FROM (
        SELECT data_pagamento as data,
               UPPER(COALESCE(NULLIF(forma_pagamento,''), 'PIX')) as historico,
               0.0 as debito, valor_pagamento as credito,
               nro_docto as documento,
               'Cliente: ' || COALESCE(codigo_cliente,'') as observacao,
               id
        FROM contas_receber
        WHERE situacao_docto = 'P' AND data_pagamento >= ? AND data_pagamento <= ?
        UNION ALL
        SELECT data_pagamento, 'COMPR', valor_pagamento, 0.0,
               nro_docto, 'Fornecedor: ' || COALESCE(codigo_fornecedor,''), id
        FROM contas_pagar
        WHERE situacao_docto = 'P' AND data_pagamento >= ? AND data_pagamento <= ?
        UNION ALL
        SELECT data_pagamento,
               UPPER(SUBSTR(descricao,1,5)),
               CASE WHEN tipo IN ('DESPESA','VALE') THEN valor ELSE 0.0 END,
               CASE WHEN tipo = 'RECEITA' THEN valor ELSE 0.0 END,
               CAST(id AS TEXT), descricao, id
        FROM lancamentos_extras
        WHERE situacao = 'P' AND data_pagamento >= ? AND data_pagamento <= ?
      )
      ORDER BY data, id
    `).all(dataInicio, dataFim, dataInicio, dataFim, dataInicio, dataFim)

    return { saldoInicial: saldoAntes?.total || 0, movimentos }
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
  importar,
  manutencao,
  log,
  nfe,
  pedidosCompra,
  cheques,
  lancamentosExtras,
  reajustesPreco,
  relatorios,
}
