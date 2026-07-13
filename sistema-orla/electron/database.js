const { supabase, emailDoUsuario } = require('./supabaseClient')

// Escapa um valor para uso dentro de .or()/.filter() do supabase-js — evita
// que vírgula/aspas no texto digitado pelo usuário quebrem a sintaxe do filtro.
function orValue(v) {
  return `"${String(v).replace(/"/g, '\\"')}"`
}

// As tabelas legadas não têm FK declarada para clientes/fornecedores, então o
// embed automático do PostgREST (`select=*,clientes(nome)`) não funciona —
// busca os nomes em uma segunda query e mescla em JS.
async function anexarNomeCliente(linhas) {
  const codigos = [...new Set(linhas.map((v) => v.codigo_cliente).filter(Boolean))]
  if (!codigos.length)
    return linhas.map((v) => ({ ...v, nome_cliente: null, telefone_cliente: null }))
  const { data } = await supabase.from('clientes').select('codigo, nome, telefone, celular').in('codigo', codigos)
  const infoPorCodigo = Object.fromEntries(
    (data || []).map((c) => [c.codigo, { nome: c.nome, telefone: c.telefone || c.celular }]),
  )
  return linhas.map((v) => ({
    ...v,
    nome_cliente: infoPorCodigo[v.codigo_cliente]?.nome || null,
    telefone_cliente: infoPorCodigo[v.codigo_cliente]?.telefone || null,
  }))
}

async function anexarNomeFornecedor(linhas) {
  const codigos = [...new Set(linhas.map((v) => v.codigo_fornecedor).filter(Boolean))]
  if (!codigos.length) return linhas.map((v) => ({ ...v, nome_fornecedor: null }))
  const { data } = await supabase.from('fornecedores').select('codigo, nome').in('codigo', codigos)
  const nomePorCodigo = Object.fromEntries((data || []).map((f) => [f.codigo, f.nome]))
  return linhas.map((v) => ({ ...v, nome_fornecedor: nomePorCodigo[v.codigo_fornecedor] || null }))
}

// ============================================================
// INIT — confirma que o cliente Supabase está acessível
// ============================================================
async function init() {
  const { error } = await supabase.from('configuracoes').select('chave').limit(1)
  if (error) throw new Error(`Falha ao conectar no Supabase: ${error.message}`)
  console.log('✅ Cliente Supabase pronto.')
}

// ============================================================
// NUMERAÇÃO ATÔMICA (vendas, pré-vendas, pedidos de compra)
// ============================================================
async function proximoNumeroAtomico(chave) {
  const { data, error } = await supabase.rpc('proximo_numero_atomico', { p_chave: chave })
  if (error) throw new Error(error.message)
  return data
}

// ============================================================
// UTILITÁRIOS
// ============================================================
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
async function login(usuario, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailDoUsuario(usuario),
    password: senha,
  })

  if (error || !data.user) {
    return { sucesso: false, erro: 'Usuário ou senha inválidos' }
  }

  const { data: perfil, error: perfilErro } = await supabase
    .from('usuarios')
    .select('usuario, nome, nivel, super_usuario, codigo_vendedor, ativo, menus_ocultos')
    .eq('auth_id', data.user.id)
    .single()

  if (perfilErro || !perfil || perfil.ativo !== 'S') {
    await supabase.auth.signOut()
    return { sucesso: false, erro: 'Usuário ou senha inválidos' }
  }

  await supabase.rpc('registrar_login')

  const { ativo: _a, ...usuarioSemAtivo } = perfil
  return { sucesso: true, usuario: usuarioSemAtivo }
}

async function logout() {
  await supabase.auth.signOut()
  return { sucesso: true }
}

// ============================================================
// CLIENTES
// ============================================================
const clientes = {
  async listar(filtros = {}) {
    let q = supabase.from('clientes').select('*')
    if (filtros.busca) {
      const b = orValue(`%${filtros.busca}%`)
      q = q.or(`nome.like.${b},cgc.like.${b},cpf.like.${b},codigo.like.${b}`)
    }
    if (filtros.situacao) q = q.eq('codigo_situacao_cliente', filtros.situacao)
    const { data, error } = await q.order('nome').limit(500)
    if (error) throw new Error(error.message)
    return data
  },

  async buscar(codigo) {
    const { data, error } = await supabase.from('clientes').select('*').eq('codigo', codigo).maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async salvar(dados) {
    const { error } = await supabase
      .from('clientes')
      .upsert({ ...dados, data_atualizacao: hoje(), hora_atualizacao: agora() }, { onConflict: 'codigo' })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },

  async excluir(codigo) {
    const { error } = await supabase.from('clientes').update({ status_registro: 'I' }).eq('codigo', codigo)
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
}

// ============================================================
// PRODUTOS
// ============================================================
const produtos = {
  async listar(filtros = {}) {
    let q = supabase.from('produtos').select('*')
    if (filtros.busca) {
      const b = orValue(`%${filtros.busca}%`)
      q = q.or(`descricao.like.${b},codigo.like.${b},ean.like.${b},referencia.like.${b}`)
    }
    if (filtros.grupo) q = q.eq('codigo_grupo', filtros.grupo)
    if (filtros.linha) q = q.eq('codigo_linha', filtros.linha)
    if (filtros.situacao) q = q.eq('situacao_produto', filtros.situacao)
    const { data, error } = await q.order('descricao').limit(500)
    if (error) throw new Error(error.message)
    if (filtros.estoqueBaixo) {
      return data.filter((p) => p.controla_estoque === 'S' && p.situacao_produto === 'A' && p.estoque_atual <= p.estoque_minimo)
    }
    return data
  },

  async buscar(codigo) {
    const { data, error } = await supabase.from('produtos').select('*').eq('codigo', codigo).maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async salvar(dados) {
    const { error } = await supabase
      .from('produtos')
      .upsert({ ...dados, data_atualizacao: hoje(), hora_atualizacao: agora() }, { onConflict: 'codigo' })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },

  async excluir(codigo) {
    const { error } = await supabase.from('produtos').update({ situacao_produto: 'I' }).eq('codigo', codigo)
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
}

// ============================================================
// VENDAS
// ============================================================
const vendas = {
  async listar(filtros = {}) {
    let q = supabase.from('vendas').select('*')
    if (filtros.dataInicio) q = q.gte('data', filtros.dataInicio)
    if (filtros.dataFim) q = q.lte('data', filtros.dataFim)
    if (filtros.situacao) q = q.eq('situacao', filtros.situacao)
    if (filtros.caixaSessaoId) q = q.eq('caixa_sessao_id', filtros.caixaSessaoId)
    if (filtros.cliente) {
      const { data: porNome } = await supabase.from('clientes').select('codigo').like('nome', `%${filtros.cliente}%`)
      const codigos = new Set((porNome || []).map((c) => c.codigo))
      codigos.add(filtros.cliente)
      q = q.in('codigo_cliente', [...codigos])
    }
    const { data, error } = await q.order('data', { ascending: false }).order('orcamento', { ascending: false }).limit(500)
    if (error) throw new Error(error.message)
    return anexarNomeCliente(data)
  },

  async buscar(orcamento) {
    const { data: venda, error } = await supabase.from('vendas').select('*').eq('orcamento', orcamento).maybeSingle()
    if (error) throw new Error(error.message)
    if (!venda) return null

    const [{ data: itens }, [vendaComNome]] = await Promise.all([
      supabase.from('vendas_itens').select('*').eq('orcamento', orcamento),
      anexarNomeCliente([venda]),
    ])
    const codigosProduto = [...new Set((itens || []).map((i) => i.codigo_produto))]
    const { data: prods } = codigosProduto.length
      ? await supabase.from('produtos').select('codigo, descricao').in('codigo', codigosProduto)
      : { data: [] }
    const descPorCodigo = Object.fromEntries((prods || []).map((p) => [p.codigo, p.descricao]))
    vendaComNome.itens = (itens || []).map((i) => ({ ...i, desc_produto: descPorCodigo[i.codigo_produto] }))
    return vendaComNome
  },

  async proximoNumero() {
    const valor = await proximoNumeroAtomico('vendas')
    return { numero: String(valor).padStart(8, '0') }
  },

  async salvar(dados) {
    const { itens, nome_cliente, cheque_numero, cheque_banco, cheque_vencimento, ...venda } = dados
    const { error } = await supabase.rpc('vendas_salvar', { p_venda: venda, p_itens: itens || [] })
    if (error) return { sucesso: false, erro: error.message }

    // Venda paga (ao menos em parte) com cheque: gera o registro em
    // "Cheques a receber" automaticamente, senão o cheque fica sem rastro.
    if ((venda.valor_pago_cheque || 0) > 0) {
      const resCheque = await cheques.salvar({
        tipo: 'R',
        codigo_pessoa: venda.codigo_cliente,
        nome_pessoa: nome_cliente || venda.codigo_cliente,
        valor: venda.valor_pago_cheque,
        numero: cheque_numero || '',
        banco: cheque_banco || '',
        data_emissao: venda.data,
        data_vencimento: cheque_vencimento || venda.data,
        nro_docto: venda.orcamento,
        observacao: `Pagamento da venda #${venda.orcamento}`,
        usuario: venda.usuario_cadastro || '',
      })
      if (!resCheque.sucesso) {
        console.error('Venda salva, mas falhou ao gerar cheque a receber:', resCheque.erro)
      }
    }

    return { sucesso: true, orcamento: venda.orcamento }
  },

  async cancelar(orcamento, motivo, usuario) {
    const { error } = await supabase.rpc('vendas_cancelar', { p_orcamento: orcamento, p_motivo: motivo, p_usuario: usuario })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },

  async devolver(dados) {
    const { data, error } = await supabase.rpc('vendas_devolver', {
      p_orcamento: dados.orcamento,
      p_itens: dados.itens,
      p_motivo: dados.motivo || 'Devolução',
      p_usuario: dados.usuario,
    })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true, ...data }
  },
}

// ============================================================
// CONTAS A RECEBER
// ============================================================
const contasReceber = {
  async listar(filtros = {}) {
    let q = supabase.from('contas_receber').select('*')
    if (filtros.situacao) q = q.eq('situacao_docto', filtros.situacao)
    if (filtros.dataInicio) q = q.gte('data_vencimento', filtros.dataInicio)
    if (filtros.dataFim) q = q.lte('data_vencimento', filtros.dataFim)
    if (filtros.cliente) {
      const { data: porNome } = await supabase.from('clientes').select('codigo').like('nome', `%${filtros.cliente}%`)
      const codigos = new Set((porNome || []).map((c) => c.codigo))
      codigos.add(filtros.cliente)
      q = q.in('codigo_cliente', [...codigos])
    }
    const { data, error } = await q.order('data_vencimento').limit(500)
    if (error) throw new Error(error.message)
    const comNome = await anexarNomeCliente(data)
    return comNome.map((r) => ({
      ...r,
      numero_docto: r.nro_docto,
      valor_em_aberto: r.valor_docto - (r.valor_pagamento || 0),
    }))
  },

  async totalAberto() {
    const { data, error } = await supabase.rpc('contas_receber_total_aberto')
    if (error) throw new Error(error.message)
    return { total: data || 0 }
  },

  async porOrcamento(orcamento) {
    const { data, error } = await supabase
      .from('contas_receber')
      .select('*')
      .eq('nro_docto', String(orcamento))
      .eq('tipo_docto', 'VD')
      .order('seq_docto')
    if (error) throw new Error(error.message)
    return data
  },

  async saldoCliente(codigo_cliente) {
    const { data, error } = await supabase.rpc('contas_receber_saldo_cliente', { p_codigo_cliente: codigo_cliente })
    if (error) throw new Error(error.message)
    return data || 0
  },

  async receber(dados) {
    const { error } = await supabase.rpc('contas_receber_receber', {
      p_id: dados.id,
      p_valor_pagamento: dados.valor_pagamento,
      p_valor_desconto: dados.valor_desconto || 0,
      p_valor_acrescimo: dados.valor_acrescimo || 0,
      p_forma: dados.forma || null,
      p_data_pagamento: dados.data_pagamento || hoje(),
      p_usuario: dados.usuario,
    })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
}

// ============================================================
// CONTAS A PAGAR
// ============================================================
const contasPagar = {
  async listar(filtros = {}) {
    let q = supabase.from('contas_pagar').select('*')
    if (filtros.situacao) q = q.eq('situacao_docto', filtros.situacao)
    if (filtros.dataInicio) q = q.gte('data_vencimento', filtros.dataInicio)
    if (filtros.dataFim) q = q.lte('data_vencimento', filtros.dataFim)
    const { data, error } = await q.order('data_vencimento').limit(500)
    if (error) throw new Error(error.message)
    return anexarNomeFornecedor(data)
  },

  async totalAberto() {
    const { data, error } = await supabase.rpc('contas_pagar_total_aberto')
    if (error) throw new Error(error.message)
    return { total: data || 0 }
  },

  async pagar(dados) {
    const { error } = await supabase
      .from('contas_pagar')
      .update({
        situacao_docto: 'P',
        data_pagamento: dados.data_pagamento || hoje(),
        valor_pagamento: dados.valor_pagamento,
        valor_desconto: dados.valor_desconto || 0,
        usuario: dados.usuario,
        data_atualizacao: hoje(),
        hora_atualizacao: agora(),
      })
      .eq('id', dados.id)
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },

  async salvar(dados) {
    const { error } = await supabase.from('contas_pagar').insert({ ...dados, data_atualizacao: hoje(), hora_atualizacao: agora() })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
}

// ============================================================
// CAIXA
// ============================================================
const caixa = {
  async status() {
    const { data: aberto } = await supabase.from('movimentos_caixa').select('*').eq('situacao', 'A').order('id', { ascending: false }).limit(1).maybeSingle()
    if (aberto) return aberto
    const { data } = await supabase.from('movimentos_caixa').select('*').eq('data_abertura', hoje()).order('id', { ascending: false }).limit(1).maybeSingle()
    return data
  },

  async abrir(dados) {
    const { error } = await supabase.rpc('caixa_abrir', {
      p_numero_caixa: dados.numero_caixa || '001',
      p_numero_turno: dados.numero_turno || '1',
      p_usuario: dados.usuario,
      p_valor_abertura: dados.valor_abertura || 0,
    })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },

  // Resumo em tempo real da sessão de caixa aberta no momento — calculado no
  // banco a partir das vendas ligadas a essa sessão (não por data do dia),
  // porque a sessão pode ter sido aberta no dia anterior.
  async resumoAtual() {
    const { data, error } = await supabase.rpc('caixa_resumo_sessao_atual')
    if (error) throw new Error(error.message)
    return data
  },

  // Histórico de sessões (abertas/fechadas) já com o resumo calculado —
  // usado tanto na tela de Caixa (sessões recentes) quanto no relatório.
  async historico(filtros = {}) {
    const { data, error } = await supabase.rpc('caixa_historico', {
      p_data_inicio: filtros.dataInicio || null,
      p_data_fim: filtros.dataFim || null,
    })
    if (error) throw new Error(error.message)
    return data
  },

  async fechar(dados) {
    const { data, error } = await supabase.rpc('caixa_fechar', { p_usuario: dados.usuario })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true, resumo: data }
  },

  async sangria(dados) {
    const { error } = await supabase.rpc('caixa_sangria', { p_valor: dados.valor, p_motivo: dados.motivo || '', p_usuario: dados.usuario })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },

  async reforco(dados) {
    const { error } = await supabase.rpc('caixa_reforco', { p_valor: dados.valor, p_motivo: dados.motivo || '', p_usuario: dados.usuario })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
}

// ============================================================
// DASHBOARD
// ============================================================
const dashboard = {
  async resumo(periodo = 'hoje') {
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

    const { data, error } = await supabase.rpc('dashboard_resumo', { p_data_inicio: dataInicio, p_hoje: hoje() })
    if (error) throw new Error(error.message)
    return data
  },
}

// ============================================================
// FINANCEIRO — lucro real (restrito a nível 250, gate aplicado
// server-side nas RPCs abaixo via nivel_atual())
// ============================================================
const financeiro = {
  async resumoPeriodo(dataInicio, dataFim) {
    const { data, error } = await supabase.rpc('financeiro_lucro_periodo', {
      p_data_inicio: dataInicio,
      p_data_fim: dataFim,
    })
    if (error) throw new Error(error.message)
    return data
  },
  async historicoMensal(meses = 12) {
    const { data, error } = await supabase.rpc('financeiro_historico_mensal', { p_meses: meses })
    if (error) throw new Error(error.message)
    return data
  },
}

// ============================================================
// CONFIGURAÇÕES
// ============================================================
const config = {
  async get(chave) {
    if (chave) {
      const { data: row, error } = await supabase.from('configuracoes').select('valor').eq('chave', chave).maybeSingle()
      if (error) throw new Error(error.message)
      if (!row) return null
      try { return JSON.parse(row.valor) } catch { return row.valor }
    }
    const { data, error } = await supabase.from('configuracoes').select('*')
    if (error) throw new Error(error.message)
    return data
  },
  async set(chave, valor) {
    const valorStr = typeof valor === 'object' ? JSON.stringify(valor) : String(valor)
    const { error } = await supabase.from('configuracoes').upsert({ chave, valor: valorStr }, { onConflict: 'chave' })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
}

// ============================================================
// USUÁRIOS (só o necessário pra tela de "esconder itens do menu"
// em Configurações — cadastro/edição de usuário continua sendo feito
// direto no Supabase)
// ============================================================
const usuarios = {
  // A tabela usuarios só permite SELECT do próprio perfil via RLS (e nenhum
  // UPDATE) — listar todos e editar o de outra pessoa passa pelas funções
  // usuarios_listar/usuarios_salvar_menus_ocultos (SECURITY DEFINER, gated a
  // nível 250 no próprio banco).
  async listar() {
    const { data, error } = await supabase.rpc('usuarios_listar')
    if (error) throw new Error(error.message)
    return data
  },

  async salvarMenusOcultos(usuario, menusOcultos) {
    const { error } = await supabase.rpc('usuarios_salvar_menus_ocultos', {
      p_usuario: usuario,
      p_menus_ocultos: menusOcultos,
    })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
}

// ============================================================
// PRÉ-VENDAS
// ============================================================
const preVendas = {
  async proximoNumero() {
    const valor = await proximoNumeroAtomico('pre_vendas')
    return { numero: String(valor).padStart(8, '0') }
  },

  async listar(filtros = {}) {
    let q = supabase.from('pre_vendas').select('*')
    if (filtros.busca) {
      const b = orValue(`%${filtros.busca}%`)
      q = q.or(`nome_cliente.like.${b},numero.like.${b}`)
    }
    if (filtros.situacao && filtros.situacao !== 'Todas') q = q.eq('situacao', filtros.situacao.toUpperCase())
    const { data, error } = await q.order('id', { ascending: false }).limit(500)
    if (error) throw new Error(error.message)
    return data
  },

  async buscar(numero) {
    const { data: pv, error } = await supabase.from('pre_vendas').select('*').eq('numero', numero).maybeSingle()
    if (error) throw new Error(error.message)
    if (pv) {
      const { data: itens } = await supabase.from('pre_vendas_itens').select('*').eq('numero', numero)
      pv.itens = itens
    }
    return pv
  },

  async salvar(dados) {
    const { itens, ...pv } = dados
    const { error } = await supabase.rpc('pre_vendas_salvar', { p_pv: pv, p_itens: itens || [] })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true, numero: pv.numero }
  },

  async cancelar(numero) {
    const { error } = await supabase
      .from('pre_vendas')
      .update({ situacao: 'CANCELADA', data_atualizacao: hoje(), hora_atualizacao: agora() })
      .eq('numero', numero)
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },

  async baixar(numero) {
    const { error } = await supabase
      .from('pre_vendas')
      .update({ situacao: 'BAIXADA', data_atualizacao: hoje(), hora_atualizacao: agora() })
      .eq('numero', numero)
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },

  // Converte a pré-venda em venda e marca como baixada em uma única transação
  // no banco (pre_vendas_converter), evitando que uma falha entre as duas etapas
  // deixe a pré-venda "aberta" de novo e permita gerar uma venda duplicada.
  async converter(numero, forma, usuario) {
    const { data, error } = await supabase.rpc('pre_vendas_converter', { p_numero: numero, p_forma: forma, p_usuario: usuario })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true, orcamento: data }
  },
}

// ============================================================
// MOVIMENTOS DE ESTOQUE
// ============================================================
const movimentosEstoque = {
  async listar(filtros = {}) {
    let q = supabase.from('movimentos_estoque').select('*')
    if (filtros.busca) q = q.like('produto', `%${filtros.busca}%`)
    if (filtros.tipo && filtros.tipo !== 'todos') q = q.eq('tipo', filtros.tipo)
    const { data, error } = await q.order('id', { ascending: false }).limit(500)
    if (error) throw new Error(error.message)
    return data
  },

  async salvar(dados) {
    const { error } = await supabase.rpc('movimentos_estoque_salvar', {
      p_dados: {
        ...dados,
        quantidade: parseFloat(dados.quantidade),
        valor_unitario: parseFloat(dados.valor_unitario || 0),
        total: parseFloat(dados.total || 0),
        data: dados.data || hoje(),
      },
    })
    if (error) return { sucesso: false, erro: error.message }
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
  async produtos(conteudo) {
    const rows = parseCSV(conteudo)
    const resultados = []

    for (const row of rows) {
      const codigo = str(row['codigo'] || row['cod'])
      const descricao = str(row['descricao'] || row['nome'] || row['produto'])
      if (!codigo || !descricao) {
        resultados.push({ codigo: codigo || '?', status: 'erro', motivo: 'código ou descrição ausente' })
        continue
      }
      try {
        const { data: existeAntes } = await supabase.from('produtos').select('codigo').eq('codigo', codigo).maybeSingle()
        const { error } = await supabase.from('produtos').upsert({
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
          usuario: 'importacao',
          data_atualizacao: hoje(),
          hora_atualizacao: agora(),
        }, { onConflict: 'codigo' })
        if (error) throw new Error(error.message)
        resultados.push({ codigo, descricao, status: existeAntes ? 'atualizado' : 'inserido' })
      } catch (e) {
        resultados.push({ codigo, descricao, status: 'erro', motivo: e.message })
      }
    }
    return { sucesso: true, resultados, total: rows.length }
  },

  async clientes(conteudo) {
    const rows = parseCSV(conteudo)
    const resultados = []

    for (const row of rows) {
      const codigo = str(row['codigo'] || row['cod'])
      const nome = str(row['nome'] || row['nome_cliente'] || row['cliente'] || row['razao_social'])
      if (!codigo || !nome) {
        resultados.push({ codigo: codigo || '?', status: 'erro', motivo: 'código ou nome ausente' })
        continue
      }
      try {
        const { data: existeAntes } = await supabase.from('clientes').select('codigo').eq('codigo', codigo).maybeSingle()
        const { error } = await supabase.from('clientes').upsert({
          codigo, nome,
          nome_fantasia: str(row['nome_fantasia'] || row['fantasia']),
          cpf: str(row['cpf']),
          rg: str(row['rg']),
          cgc: str(row['cgc'] || row['cnpj'] || row['cpf_cnpj']),
          ie: str(row['ie'] || row['inscricao_estadual']),
          endereco: str(row['endereco'] || row['logradouro'] || row['rua']),
          numero: str(row['numero'] || row['num']),
          bairro: str(row['bairro']),
          cep: str(row['cep']),
          telefone: str(row['telefone'] || row['fone'] || row['tel']),
          celular: str(row['celular'] || row['cel']),
          email: str(row['email']),
          limite_credito: num(row['limite_credito'] || row['limite']),
          haver: num(row['haver'] || row['credito'] || row['saldo_haver']),
          codigo_situacao_cliente: str(row['situacao'], 'A'),
          usuario_cadastro: 'importacao',
          data_atualizacao: hoje(),
          hora_atualizacao: agora(),
        }, { onConflict: 'codigo' })
        if (error) throw new Error(error.message)
        resultados.push({ codigo, nome, status: existeAntes ? 'atualizado' : 'inserido' })
      } catch (e) {
        resultados.push({ codigo, nome, status: 'erro', motivo: e.message })
      }
    }
    return { sucesso: true, resultados, total: rows.length }
  },
}

const haver = {
  async listar(busca) {
    // Não existe coluna cpf_cnpj — combina cpf/cgc em JS pro formato que a tela espera.
    let q = supabase.from('clientes').select('codigo, nome, cpf, cgc, telefone, haver').gt('haver', 0)
    if (busca) {
      const b = orValue(`%${busca}%`)
      q = q.or(`nome.like.${b},codigo.like.${b},cpf.like.${b},cgc.like.${b}`)
    }
    const { data, error } = await q.order('haver', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map((c) => ({ ...c, cpf_cnpj: c.cpf || c.cgc || '' }))
  },

  async ajustar(dados) {
    // dados: { codigo, valor (positivo=credito, negativo=debito), usuario }
    const { error } = await supabase.rpc('haver_ajustar', { p_codigo: dados.codigo, p_valor: dados.valor })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },

  async totalGeral() {
    const { data, error } = await supabase.rpc('haver_total_geral')
    if (error) throw new Error(error.message)
    return { total: data || 0 }
  },
}

// ============================================================
// PEDIDOS DE COMPRA
// ============================================================
const pedidosCompra = {
  async proximoNumero() {
    const valor = await proximoNumeroAtomico('pedidos_compra')
    return { numero: String(valor).padStart(6, '0') }
  },
  async listar(filtros = {}) {
    let q = supabase.from('pedidos_compra').select('*')
    if (filtros.situacao && filtros.situacao !== 'todos') q = q.eq('situacao', filtros.situacao)
    if (filtros.busca) {
      const b = orValue(`%${filtros.busca}%`)
      q = q.or(`fornecedor.like.${b},numero.like.${b}`)
    }
    const { data: rows, error } = await q.order('id', { ascending: false }).limit(200)
    if (error) throw new Error(error.message)
    if (rows.length === 0) return []
    const numeros = rows.map((r) => r.numero)
    const { data: itensAll } = await supabase.from('pedidos_compra_itens').select('*').in('numero', numeros)
    const itensPorNumero = {}
    for (const item of itensAll || []) {
      if (!itensPorNumero[item.numero]) itensPorNumero[item.numero] = []
      itensPorNumero[item.numero].push(item)
    }
    return rows.map((r) => ({ ...r, itens: itensPorNumero[r.numero] || [] }))
  },
  async salvar(dados) {
    const { itens, obs, previsao_entrega, ...pc } = dados
    pc.observacao = obs || ''
    pc.data_previsao = previsao_entrega || null
    pc.valor_total = (itens || []).reduce((s, i) => s + (parseFloat(i.quantidade) || 0) * (parseFloat(i.valor_unitario) || 0), 0)
    const itensMapeados = (itens || []).map((i) => ({
      codigo_produto: i.produto_id,
      descricao: i.produto,
      quantidade: parseFloat(i.quantidade) || 0,
      preco_unitario: parseFloat(i.valor_unitario) || 0,
      total: (parseFloat(i.quantidade) || 0) * (parseFloat(i.valor_unitario) || 0),
    }))
    const { error } = await supabase.rpc('pedidos_compra_salvar', { p_pc: pc, p_itens: itensMapeados })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true, numero: pc.numero }
  },
  // Cancela o pedido. Se já estava RECEBIDO, reverte o estoque somado e
  // cancela a conta a pagar gerada (se ainda não tiver sido paga), tudo
  // atomicamente via RPC.
  async cancelar(numero, usuario) {
    const { error } = await supabase.rpc('pedidos_compra_cancelar', { p_numero: numero, p_usuario: usuario })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
  // Marca o pedido como recebido E lança a entrada de estoque de cada item
  // (produtos.estoque_atual + movimentos_estoque), tudo atomicamente via RPC.
  async receber(numero, usuario) {
    const { error } = await supabase.rpc('pedidos_compra_receber', { p_numero: numero, p_usuario: usuario })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
}

// ============================================================
// CHEQUES
// ============================================================
const cheques = {
  async listar(filtros = {}) {
    let q = supabase.from('cheques').select('*')
    if (filtros.tipo) q = q.eq('tipo', filtros.tipo)
    if (filtros.situacao && filtros.situacao !== 'todos') q = q.eq('situacao', filtros.situacao)
    if (filtros.busca) {
      const b = orValue(`%${filtros.busca}%`)
      q = q.or(`nome_pessoa.like.${b},numero.like.${b}`)
    }
    if (filtros.dataInicio) q = q.gte('data_vencimento', filtros.dataInicio)
    if (filtros.dataFim) q = q.lte('data_vencimento', filtros.dataFim)
    const { data, error } = await q.order('data_vencimento').order('id', { ascending: false }).limit(300)
    if (error) throw new Error(error.message)
    return data
  },
  async salvar(dados) {
    const payload = {
      tipo: dados.tipo, numero: dados.numero || '', banco: dados.banco || '', valor: dados.valor || 0,
      data_emissao: dados.data_emissao || null, data_vencimento: dados.data_vencimento || null,
      codigo_pessoa: dados.codigo_pessoa || '', nome_pessoa: dados.nome_pessoa || '', nro_docto: dados.nro_docto || '',
      observacao: dados.observacao || '', usuario: dados.usuario || '', data_atualizacao: hoje(), hora_atualizacao: agora(),
    }
    const { error } = dados.id
      ? await supabase.from('cheques').update({ ...payload, situacao: dados.situacao || 'A' }).eq('id', dados.id)
      : await supabase.from('cheques').insert({ ...payload, situacao: 'A' })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
  async baixar(id, data_compensacao, usuario) {
    const { error } = await supabase
      .from('cheques')
      .update({ situacao: 'C', data_compensacao: data_compensacao || hoje(), usuario: usuario || '', data_atualizacao: hoje(), hora_atualizacao: agora() })
      .eq('id', id)
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
  async devolver(id, usuario) {
    const { error } = await supabase
      .from('cheques')
      .update({ situacao: 'D', usuario: usuario || '', data_atualizacao: hoje(), hora_atualizacao: agora() })
      .eq('id', id)
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
}

// ============================================================
// LANÇAMENTOS EXTRAS (receitas, despesas, vales)
// ============================================================
const lancamentosExtras = {
  async listar(filtros = {}) {
    let q = supabase.from('lancamentos_extras').select('*')
    if (filtros.tipo) q = q.eq('tipo', filtros.tipo)
    if (filtros.situacao && filtros.situacao !== 'todos') q = q.eq('situacao', filtros.situacao)
    if (filtros.busca) {
      const b = orValue(`%${filtros.busca}%`)
      q = q.or(`descricao.like.${b},nome_pessoa.like.${b}`)
    }
    if (filtros.dataInicio) q = q.gte('data', filtros.dataInicio)
    if (filtros.dataFim) q = q.lte('data', filtros.dataFim)
    const { data, error } = await q.order('data', { ascending: false }).order('id', { ascending: false }).limit(300)
    if (error) throw new Error(error.message)
    return data
  },
  async salvar(dados) {
    const payload = {
      tipo: dados.tipo, descricao: dados.descricao, valor: dados.valor || 0,
      nome_pessoa: dados.nome_pessoa || '', forma_pagamento: dados.forma_pagamento || '',
      categoria: dados.categoria || null,
      observacao: dados.observacao || '', usuario: dados.usuario || '', data_atualizacao: hoje(), hora_atualizacao: agora(),
    }
    const { error } = dados.id
      ? await supabase.from('lancamentos_extras').update({ ...payload, data: dados.data, situacao: dados.situacao || 'A' }).eq('id', dados.id)
      : await supabase.from('lancamentos_extras').insert({ ...payload, data: dados.data || hoje(), situacao: 'A' })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
  async pagar(id, usuario) {
    const { error } = await supabase.rpc('lancamentos_extras_pagar', { p_id: id, p_usuario: usuario || '' })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
  async cancelar(id) {
    const { error } = await supabase.from('lancamentos_extras').update({ situacao: 'C', data_atualizacao: hoje(), hora_atualizacao: agora() }).eq('id', id)
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
}

// ============================================================
// REAJUSTE DE PREÇOS
// ============================================================
const reajustesPreco = {
  async listar(filtros = {}) {
    let q = supabase.from('reajustes_preco').select('*')
    if (filtros.dataInicio) q = q.gte('data', filtros.dataInicio)
    if (filtros.dataFim) q = q.lte('data', filtros.dataFim)
    if (filtros.busca) q = q.like('produto', `%${filtros.busca}%`)
    const { data, error } = await q.order('id', { ascending: false }).limit(500)
    if (error) throw new Error(error.message)
    return data
  },
  async aplicar(codigos, percentual, usuario) {
    const { data, error } = await supabase.rpc('reajustes_preco_aplicar', { p_codigos: codigos, p_percentual: percentual, p_usuario: usuario })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true, atualizados: data }
  },
}

// ============================================================
// SOLICITAÇÕES DE APROVAÇÃO
// (ex.: contagem de estoque feita por usuário nível 1, que só é
// aplicada de fato depois que um gerente/admin aprova)
// ============================================================
const aprovacoes = {
  async listarPendentes(filtros = {}) {
    let q = supabase.from('solicitacoes_aprovacao').select('*').eq('situacao', 'PENDENTE')
    if (filtros.tipo) q = q.eq('tipo', filtros.tipo)
    const { data, error } = await q.order('id', { ascending: false })
    if (error) throw new Error(error.message)
    return data
  },
  async solicitar(dados) {
    const { error } = await supabase.from('solicitacoes_aprovacao').insert({
      tipo: dados.tipo,
      itens: dados.itens || [],
      situacao: 'PENDENTE',
      usuario_solicitante: dados.usuario_solicitante || '',
      data_solicitacao: hoje(),
      hora_solicitacao: agora(),
    })
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
  async aprovar(id, usuario) {
    const { data: solicitacao, error: errBusca } = await supabase
      .from('solicitacoes_aprovacao')
      .select('*')
      .eq('id', id)
      .single()
    if (errBusca) return { sucesso: false, erro: errBusca.message }
    if (!solicitacao || solicitacao.situacao !== 'PENDENTE') {
      return { sucesso: false, erro: 'Solicitação não está mais pendente.' }
    }

    if (solicitacao.tipo === 'CONTAGEM_ESTOQUE') {
      for (const item of solicitacao.itens || []) {
        const { error } = await supabase.rpc('movimentos_estoque_salvar', {
          p_dados: {
            produto_id: item.produto_id,
            produto: item.produto,
            quantidade: item.quantidade_nova,
            tipo: 'ACERTO',
            valor_unitario: 0,
            total: 0,
            obs: `Contagem de estoque (solicitado por ${solicitacao.usuario_solicitante}, aprovado por ${usuario})`,
            data: hoje(),
          },
        })
        if (error) return { sucesso: false, erro: error.message }
      }
    }

    const { error: errUpdate } = await supabase
      .from('solicitacoes_aprovacao')
      .update({
        situacao: 'APROVADO',
        usuario_aprovador: usuario,
        data_aprovacao: hoje(),
        hora_aprovacao: agora(),
      })
      .eq('id', id)
    if (errUpdate) return { sucesso: false, erro: errUpdate.message }
    return { sucesso: true }
  },
  async rejeitar(id, usuario, motivo) {
    const { error } = await supabase
      .from('solicitacoes_aprovacao')
      .update({
        situacao: 'REJEITADO',
        usuario_aprovador: usuario,
        data_aprovacao: hoje(),
        hora_aprovacao: agora(),
        motivo_rejeicao: motivo || '',
      })
      .eq('id', id)
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
  // Solicitações já decididas (aprovadas/rejeitadas) que o próprio solicitante
  // ainda não visualizou — usado para notificar quem pediu a aprovação.
  async listarResolvidasNaoVistas(usuarioSolicitante) {
    const { data, error } = await supabase
      .from('solicitacoes_aprovacao')
      .select('*')
      .eq('usuario_solicitante', usuarioSolicitante)
      .eq('visualizado_solicitante', false)
      .in('situacao', ['APROVADO', 'REJEITADO'])
      .order('id', { ascending: false })
    if (error) throw new Error(error.message)
    return data
  },
  async marcarVisualizado(id) {
    const { error } = await supabase
      .from('solicitacoes_aprovacao')
      .update({ visualizado_solicitante: true })
      .eq('id', id)
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },
}

// ============================================================
// NF-e
// ============================================================
const nfe = {
  async listar(filtros = {}) {
    let q = supabase.from('vendas').select('orcamento, data, hora_cadastro, valor_total, situacao, numero_nfe, codigo_cliente, usuario_cadastro').neq('situacao', 'C')
    if (filtros.dataInicio) q = q.gte('data', filtros.dataInicio)
    if (filtros.dataFim) q = q.lte('data', filtros.dataFim)
    if (filtros.status === 'com') q = q.not('numero_nfe', 'is', null).neq('numero_nfe', '')
    if (filtros.status === 'sem') q = q.or('numero_nfe.is.null,numero_nfe.eq.')
    if (filtros.busca) {
      const b = orValue(`%${filtros.busca}%`)
      q = q.or(`orcamento.like.${b},numero_nfe.like.${b}`)
    }
    const { data, error } = await q.order('data', { ascending: false }).order('hora_cadastro', { ascending: false }).limit(500)
    if (error) throw new Error(error.message)
    const comNome = await anexarNomeCliente(data)
    return comNome.map((v) => ({ ...v, nome_cliente: v.nome_cliente || 'Consumidor' }))
  },

  async registrar(orcamento, numero_nfe) {
    const { error } = await supabase.from('vendas').update({ numero_nfe: numero_nfe || null }).eq('orcamento', orcamento)
    if (error) return { sucesso: false, erro: error.message }
    return { sucesso: true }
  },

  // Dados completos da venda para preencher a nota fiscal no portal da prefeitura
  async detalhes(orcamento) {
    const { data: venda, error } = await supabase.from('vendas').select('*').eq('orcamento', orcamento).maybeSingle()
    if (error) throw new Error(error.message)
    if (!venda) return null
    const [{ data: cliente }, { data: itens }] = await Promise.all([
      supabase.from('clientes').select('*').eq('codigo', venda.codigo_cliente).maybeSingle(),
      supabase.from('vendas_itens').select('*').eq('orcamento', orcamento).order('id'),
    ])
    return { venda, cliente: cliente || null, itens: itens || [] }
  },
}

// ============================================================
// LOG DO SISTEMA
// ============================================================
const log = {
  async listar(filtros = {}) {
    const { data, error } = await supabase.rpc('log_listar', {
      p_data_inicio: filtros.dataInicio || null,
      p_data_fim: filtros.dataFim || null,
      p_categoria: filtros.categoria || null,
    })
    if (error) throw new Error(error.message)
    return data
  },
}

const manutencao = {
  // Cancela CR abertos de vendas que já foram canceladas
  async corrigirCROrfaos() {
    const { data, error } = await supabase.rpc('manutencao_corrigir_cr_orfaos')
    if (error) throw new Error(error.message)
    return { corrigidos: data }
  },
}

// ============================================================
// RELATÓRIOS GERENCIAIS
// ============================================================
const relatorios = {
  async inventario() {
    const { data, error } = await supabase.rpc('relatorio_inventario')
    if (error) throw new Error(error.message)
    return data
  },

  async itenisVendidos(dataInicio, dataFim) {
    const { data, error } = await supabase.rpc('relatorio_itens_vendidos', { p_data_inicio: dataInicio, p_data_fim: dataFim })
    if (error) throw new Error(error.message)
    return data
  },

  async entradasMercadoria(dataInicio, dataFim) {
    const { data, error } = await supabase.rpc('relatorio_entradas_mercadoria', { p_data_inicio: dataInicio, p_data_fim: dataFim })
    if (error) throw new Error(error.message)
    return data
  },

  async extrato(dataInicio, dataFim) {
    const [{ data: saldoInicial, error: e1 }, { data: movimentos, error: e2 }] = await Promise.all([
      supabase.rpc('relatorio_extrato_saldo_inicial', { p_data_inicio: dataInicio }),
      supabase.rpc('relatorio_extrato_movimentos', { p_data_inicio: dataInicio, p_data_fim: dataFim }),
    ])
    if (e1) throw new Error(e1.message)
    if (e2) throw new Error(e2.message)
    return { saldoInicial: saldoInicial || 0, movimentos }
  },
}

module.exports = {
  init,
  login,
  logout,
  clientes,
  produtos,
  vendas,
  contasReceber,
  contasPagar,
  caixa,
  dashboard,
  financeiro,
  config,
  usuarios,
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
  aprovacoes,
}
