-- ============================================================
-- SCHEMA SQLite — Gollino M.E
-- Baseado nas tabelas reais do Orlasoft (Access MDB)
-- Gerado em: 21/03/2026
-- ============================================================

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- ============================================================
-- TABELA: clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,           -- ex: 000358
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  cpf TEXT,
  rg TEXT,
  cgc TEXT,                              -- CNPJ
  ie TEXT,                               -- Inscrição Estadual
  inscricao_suframa TEXT,
  endereco TEXT,
  numero TEXT,
  bairro TEXT,
  complemento TEXT,
  codigo_cidade TEXT,
  cep TEXT,
  telefone TEXT,
  celular TEXT,
  fax TEXT,
  contato TEXT,
  email TEXT,
  codigo_empresa TEXT,
  detalhes_empresa TEXT,
  data_nascimento TEXT,
  sexo TEXT,
  observacao TEXT,
  haver REAL DEFAULT 0,
  saldo REAL DEFAULT 0,
  codigo_situacao_cliente TEXT DEFAULT 'A',  -- A=Ativo I=Inativo
  tipo_preco TEXT,
  tipo_venda TEXT,
  limite_credito REAL DEFAULT 0,
  credito_rotativo TEXT,
  tabela_preco TEXT,
  forma_pagamento TEXT,
  percentual_desconto_padrao REAL DEFAULT 0,
  codigo_grupo_cliente TEXT,
  tipo_cliente TEXT,
  mensagem_na_venda TEXT,
  observacao_cobranca TEXT,
  usuario_cadastro TEXT,
  data_cadastro TEXT,
  hora_cadastro TEXT,
  usuario_atualizacao TEXT,
  data_atualizacao TEXT,
  hora_atualizacao TEXT,
  status_registro TEXT DEFAULT 'A'
);

-- ============================================================
-- TABELA: produtos
-- ============================================================
CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,           -- ex: 000001
  descricao TEXT NOT NULL,
  descricao_menor TEXT,
  referencia TEXT,
  nro_original TEXT,
  codigo_grupo TEXT,
  codigo_linha TEXT,
  unidade TEXT,
  revenda_consumo TEXT,                  -- R=Revenda C=Consumo
  cor TEXT,
  tamanho TEXT,
  localizacao TEXT,
  ean TEXT,                              -- Código de barras
  codigo_fabricante TEXT,
  caminho_foto TEXT,
  observacao TEXT,
  situacao_produto TEXT DEFAULT 'A',     -- A=Ativo I=Inativo
  -- Estoque
  estoque_atual REAL DEFAULT 0,
  estoque_minimo REAL DEFAULT 0,
  estoque_condicional REAL DEFAULT 0,
  estoque_requisicao REAL DEFAULT 0,
  controla_estoque TEXT DEFAULT 'S',
  -- Preços e custos
  custo_preco_unitario REAL DEFAULT 0,
  preco_custo_atual REAL DEFAULT 0,
  preco_custo_diferenciado REAL DEFAULT 0,
  preco_venda_vista REAL DEFAULT 0,
  preco_venda_prazo REAL DEFAULT 0,
  preco_venda_minimo REAL DEFAULT 0,
  preco_venda_diferenciado REAL DEFAULT 0,
  margem_lucro_preco_vista REAL DEFAULT 0,
  margem_lucro_preco_prazo REAL DEFAULT 0,
  markup_vista REAL DEFAULT 0,
  markup_prazo REAL DEFAULT 0,
  -- Fiscal
  ncm TEXT,
  codigo_cest TEXT,
  codigo_anp TEXT,
  cfop_cfe TEXT DEFAULT '5405',
  cfop_nfe_no_estado TEXT,
  cfop_nfe_fora_estado TEXT,
  cst_icms TEXT,
  aliquota_icms REAL DEFAULT 0,
  cst_pis TEXT,
  aliquota_pis REAL DEFAULT 0,
  cst_cofins TEXT,
  aliquota_cofins REAL DEFAULT 0,
  codigo_enquadramento TEXT,
  origem_mercadoria TEXT DEFAULT '0',
  -- IBPT
  ibpt_percentual_nacional REAL DEFAULT 0,
  ibpt_percentual_importado REAL DEFAULT 0,
  ibpt_percentual_estadual REAL DEFAULT 0,
  ibpt_percentual_municipal REAL DEFAULT 0,
  -- Pesos
  peso_bruto REAL DEFAULT 0,
  peso_liquido REAL DEFAULT 0,
  -- Fornecedores (últimas compras)
  codigo_fornecedor_padrao TEXT,
  data_ultima_alteracao_preco TEXT,
  data_ultima_venda TEXT,
  quantidade_vendas REAL DEFAULT 0,
  quantidade_entradas REAL DEFAULT 0,
  -- Auditoria
  usuario TEXT,
  data_atualizacao TEXT,
  hora_atualizacao TEXT,
  status_registro TEXT DEFAULT 'A'
);

-- ============================================================
-- TABELA: vendas (Orlasoft chama de Orcamento)
-- ============================================================
CREATE TABLE IF NOT EXISTS vendas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orcamento TEXT UNIQUE NOT NULL,        -- Número do orçamento/venda
  codigo_cliente TEXT NOT NULL,
  data TEXT NOT NULL,
  tipo_venda TEXT DEFAULT 'V',           -- V=Vista C=Convênio
  situacao TEXT DEFAULT 'N',             -- N=Normal C=Cancelado
  observacao TEXT,
  observacao2 TEXT,
  valor_total REAL DEFAULT 0,
  valor_descontos_itens REAL DEFAULT 0,
  valor_acrescimo REAL DEFAULT 0,
  valor_desconto_final REAL DEFAULT 0,
  valor_entrada REAL DEFAULT 0,
  valor_restante REAL DEFAULT 0,
  valor_troco REAL DEFAULT 0,
  valor_produtos REAL DEFAULT 0,
  -- Formas de pagamento
  codigo_forma_pagamento1 TEXT,
  codigo_forma_pagamento2 TEXT,
  codigo_forma_pagamento3 TEXT,
  valor_pago_dinheiro REAL DEFAULT 0,
  valor_pago_cartao_credito REAL DEFAULT 0,
  valor_pago_cartao_debito REAL DEFAULT 0,
  valor_pago_cheque REAL DEFAULT 0,
  valor_pago_haver REAL DEFAULT 0,
  valor_deixado_em_haver REAL DEFAULT 0,
  valor_pago_contas_receber REAL DEFAULT 0,
  -- Parcelas (até 15)
  qtde_parcelas1 INTEGER DEFAULT 0,
  qtde_parcelas2 INTEGER DEFAULT 0,
  qtde_parcelas_entrada INTEGER DEFAULT 0,
  qtde_parcelas_restante INTEGER DEFAULT 0,
  -- NF-e / SAT
  numero_nfe TEXT,
  chave_consulta_sat TEXT,
  numero_serie_ecf TEXT,
  coo TEXT,
  -- Info cliente na venda
  inf_nome TEXT,
  inf_cpf TEXT,
  inf_cgc TEXT,
  -- Entrega
  entrega_domicilio TEXT DEFAULT 'N',
  entrega_futura TEXT DEFAULT 'N',
  taxa_entrega REAL DEFAULT 0,
  motorista TEXT,
  -- Cancelamento
  usuario_cancelamento TEXT,
  data_cancelamento TEXT,
  motivo_cancelamento TEXT,
  -- Vendedor / Caixa
  codigo_vendedor TEXT,
  numero_turno TEXT,
  numero_caixa TEXT,
  codigo_tipo_venda TEXT,
  -- Auditoria
  usuario_cadastro TEXT,
  data_cadastro TEXT,
  hora_cadastro TEXT
);

-- ============================================================
-- TABELA: vendas_itens
-- ============================================================
CREATE TABLE IF NOT EXISTS vendas_itens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orcamento TEXT NOT NULL,               -- FK -> vendas.orcamento
  codigo_produto TEXT NOT NULL,
  descricao TEXT,
  quantidade REAL DEFAULT 1,
  unidade TEXT,
  preco_unitario REAL DEFAULT 0,
  preco_custo REAL DEFAULT 0,
  valor_desconto REAL DEFAULT 0,
  valor_acrescimo REAL DEFAULT 0,
  valor_total REAL DEFAULT 0,
  FOREIGN KEY (orcamento) REFERENCES vendas(orcamento)
);

-- ============================================================
-- TABELA: contas_receber
-- ============================================================
CREATE TABLE IF NOT EXISTS contas_receber (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nro_docto TEXT NOT NULL,
  tipo_docto TEXT,                       -- ex: VD, CR, NF
  seq_docto TEXT,
  codigo_cliente TEXT NOT NULL,
  data_docto TEXT NOT NULL,
  data_vencimento TEXT,
  data_pagamento TEXT,
  valor_docto REAL DEFAULT 0,
  valor_pagamento REAL DEFAULT 0,
  valor_desconto REAL DEFAULT 0,
  valor_acrescimo REAL DEFAULT 0,
  valor_juros REAL DEFAULT 0,
  valor_original REAL DEFAULT 0,
  valor_recibo REAL DEFAULT 0,
  situacao_docto TEXT DEFAULT 'A',       -- A=Aberto P=Pago C=Cancelado
  dias_atraso INTEGER DEFAULT 0,
  numero_turno TEXT,
  numero_caixa TEXT,
  emitiu_boleto TEXT DEFAULT 'N',
  nr_boleto TEXT,
  emitiu_recibo TEXT DEFAULT 'N',
  emitiu_fatura TEXT DEFAULT 'N',
  nr_fatura TEXT,
  emitiu_carne TEXT DEFAULT 'N',
  numero_carne TEXT,
  codigo_plano_conta TEXT,
  id_boleto TEXT,
  id_renegociacao TEXT,
  numero_nfe TEXT,
  observacao TEXT,
  usuario TEXT,
  data_atualizacao TEXT,
  hora_atualizacao TEXT,
  codigo_tipo_venda TEXT,
  codigo_vendedor TEXT
);

-- ============================================================
-- TABELA: contas_pagar
-- ============================================================
CREATE TABLE IF NOT EXISTS contas_pagar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_conta_pagar TEXT UNIQUE,
  codigo_fornecedor TEXT NOT NULL,
  codigo_historico TEXT,
  codigo_plano_conta TEXT,
  nro_docto TEXT,
  tipo_docto TEXT,
  chave_nfe TEXT,
  numero_nfe TEXT,
  nr_boleto TEXT,
  nr_duplicata TEXT,
  despesa_fixa TEXT DEFAULT 'N',
  despesa_fornecedor TEXT DEFAULT 'N',
  documento_origem TEXT,
  tipo_origem TEXT,
  restrito TEXT DEFAULT 'N',
  data_docto TEXT,
  data_vencimento TEXT,
  data_pagamento TEXT,
  valor_docto REAL DEFAULT 0,
  valor_pagamento REAL DEFAULT 0,
  valor_desconto REAL DEFAULT 0,
  valor_acrescimo REAL DEFAULT 0,
  situacao_docto TEXT DEFAULT 'A',       -- A=Aberto P=Pago C=Cancelado
  codigo_banco TEXT,
  codigo_forma_pagamento TEXT,
  entra_caixa TEXT DEFAULT 'N',
  valor_caixa REAL DEFAULT 0,
  numero_turno_pagamento TEXT,
  numero_caixa_pagamento TEXT,
  codigo_conta_analitica TEXT,
  pago_com_cheque TEXT DEFAULT 'N',
  id_cheque TEXT,
  observacao TEXT,
  usuario TEXT,
  data_atualizacao TEXT,
  hora_atualizacao TEXT,
  possui_cheque_devolvido TEXT DEFAULT 'N',
  tipo_contas_pagar TEXT
);

-- ============================================================
-- TABELA: caixas
-- ============================================================
CREATE TABLE IF NOT EXISTS caixas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  descricao TEXT,
  data_hora_cadastro TEXT,
  usuario_cadastro TEXT,
  data_hora_atualizacao TEXT,
  usuario_atualizacao TEXT
);

-- ============================================================
-- TABELA: movimentos_caixa
-- ============================================================
CREATE TABLE IF NOT EXISTS movimentos_caixa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_caixa TEXT NOT NULL,
  numero_turno TEXT,
  data_abertura TEXT,
  hora_abertura TEXT,
  data_fechamento TEXT,
  hora_fechamento TEXT,
  usuario_abertura TEXT,
  usuario_fechamento TEXT,
  valor_abertura REAL DEFAULT 0,
  valor_fechamento REAL DEFAULT 0,
  valor_dinheiro REAL DEFAULT 0,
  valor_cheque REAL DEFAULT 0,
  valor_cartao_credito REAL DEFAULT 0,
  valor_cartao_debito REAL DEFAULT 0,
  valor_outros REAL DEFAULT 0,
  situacao TEXT DEFAULT 'A'              -- A=Aberto F=Fechado
);

-- ============================================================
-- TABELA: fornecedores
-- ============================================================
CREATE TABLE IF NOT EXISTS fornecedores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  cpf TEXT,
  ie TEXT,
  endereco TEXT,
  numero TEXT,
  bairro TEXT,
  complemento TEXT,
  codigo_cidade TEXT,
  cep TEXT,
  telefone TEXT,
  celular TEXT,
  email TEXT,
  contato TEXT,
  observacao TEXT,
  situacao TEXT DEFAULT 'A',
  usuario TEXT,
  data_atualizacao TEXT
);

-- ============================================================
-- TABELA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,                   -- hash bcrypt
  nome TEXT,
  nivel INTEGER DEFAULT 1,              -- 1=operador 2=gerente 250=super
  super_usuario TEXT DEFAULT 'N',
  codigo_vendedor TEXT,
  ativo TEXT DEFAULT 'S',
  ultima_saida TEXT,
  data_atualizacao TEXT
);

-- ============================================================
-- TABELA: grupos_produtos
-- ============================================================
CREATE TABLE IF NOT EXISTS grupos_produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  descricao TEXT NOT NULL,
  codigo_linha TEXT,
  status TEXT DEFAULT 'A'
);

-- ============================================================
-- TABELA: linhas_produtos
-- ============================================================
CREATE TABLE IF NOT EXISTS linhas_produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  descricao TEXT NOT NULL,
  status TEXT DEFAULT 'A'
);

-- ============================================================
-- TABELA: cidades
-- ============================================================
CREATE TABLE IF NOT EXISTS cidades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  uf TEXT,
  codigo_ibge TEXT
);

-- ============================================================
-- TABELA: configuracoes
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chave TEXT UNIQUE NOT NULL,
  valor TEXT,
  descricao TEXT
);

-- ============================================================
-- DADOS INICIAIS — Configurações da empresa
-- ============================================================
INSERT OR IGNORE INTO configuracoes (chave, valor, descricao) VALUES
  ('empresa_razao_social', 'ELTER GOLLINO', 'Razão Social'),
  ('empresa_nome_fantasia', 'GOLLINO M.E', 'Nome Fantasia'),
  ('empresa_cnpj', '01.748.720/0001-00', 'CNPJ'),
  ('empresa_regime', 'Simples Nacional', 'Regime Tributário'),
  ('empresa_cidade', 'Orlândia', 'Cidade'),
  ('empresa_uf', 'SP', 'UF'),
  ('sistema_versao', '1.0.0', 'Versão do Sistema'),
  ('caixa_aberto', 'N', 'Status do Caixa');

-- ============================================================
-- DADOS INICIAIS — Usuários
-- ============================================================
INSERT OR IGNORE INTO usuarios (usuario, senha, nome, nivel, super_usuario) VALUES
  ('admin', 'SENHA_ROTACIONADA_REMOVIDA_DO_HISTORICO', 'Administrador', 250, 'S'),
  ('elter', 'SENHA_ROTACIONADA_REMOVIDA_DO_HISTORICO', 'Elter Gollino', 2, 'N'),
  ('rosangela', 'SENHA_ROTACIONADA_REMOVIDA_DO_HISTORICO', 'Rosangela', 1, 'N');

-- ============================================================
-- DADOS INICIAIS — Caixa padrão
-- ============================================================
INSERT OR IGNORE INTO caixas (codigo, descricao) VALUES
  ('001', 'Caixa Principal');

-- ============================================================
-- DADOS INICIAIS — Linhas de produtos (do Orlasoft)
-- ============================================================
INSERT OR IGNORE INTO linhas_produtos (codigo, descricao) VALUES
  ('001', 'CHAPAS'),
  ('002', 'GERAL'),
  ('003', 'ARAMES'),
  ('004', 'SELANTES');

-- ============================================================
-- TABELA: pre_vendas
-- ============================================================
CREATE TABLE IF NOT EXISTS pre_vendas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT UNIQUE NOT NULL,
  tipo TEXT DEFAULT 'CONDICIONAL',       -- CONDICIONAL, ORCAMENTO, PEDIDO
  codigo_cliente TEXT DEFAULT '',
  nome_cliente TEXT DEFAULT 'Consumidor a vista',
  vendedor TEXT DEFAULT 'Geral',
  observacao TEXT,
  valor_total REAL DEFAULT 0,
  qtde_itens REAL DEFAULT 0,
  situacao TEXT DEFAULT 'ABERTA',        -- ABERTA, BAIXADA, CANCELADA
  data TEXT NOT NULL,
  hora TEXT,
  usuario TEXT,
  data_atualizacao TEXT,
  hora_atualizacao TEXT
);

-- ============================================================
-- TABELA: pre_vendas_itens
-- ============================================================
CREATE TABLE IF NOT EXISTS pre_vendas_itens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT NOT NULL,
  codigo_produto TEXT NOT NULL,
  descricao TEXT,
  quantidade REAL DEFAULT 1,
  preco_unitario REAL DEFAULT 0,
  total REAL DEFAULT 0,
  FOREIGN KEY (numero) REFERENCES pre_vendas(numero)
);

-- ============================================================
-- TABELA: movimentos_estoque
-- ============================================================
CREATE TABLE IF NOT EXISTS movimentos_estoque (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,                    -- ENTRADA, SAIDA, ACERTO
  produto_id TEXT NOT NULL,
  produto TEXT NOT NULL,
  quantidade REAL DEFAULT 0,
  valor_unitario REAL DEFAULT 0,
  total REAL DEFAULT 0,
  data TEXT NOT NULL,
  fornecedor TEXT,
  obs TEXT,
  usuario TEXT,
  data_atualizacao TEXT,
  hora_atualizacao TEXT
);

-- ============================================================
-- TABELA: pedidos_compra
-- ============================================================
CREATE TABLE IF NOT EXISTS pedidos_compra (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT UNIQUE NOT NULL,
  fornecedor TEXT NOT NULL,
  data TEXT NOT NULL,
  data_previsao TEXT,
  situacao TEXT DEFAULT 'ABERTO',  -- ABERTO RECEBIDO CANCELADO
  valor_total REAL DEFAULT 0,
  observacao TEXT,
  usuario TEXT,
  data_atualizacao TEXT,
  hora_atualizacao TEXT
);

CREATE TABLE IF NOT EXISTS pedidos_compra_itens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT NOT NULL,
  codigo_produto TEXT NOT NULL,
  descricao TEXT,
  quantidade REAL DEFAULT 1,
  preco_unitario REAL DEFAULT 0,
  total REAL DEFAULT 0
);

-- ============================================================
-- TABELA: cheques
-- ============================================================
CREATE TABLE IF NOT EXISTS cheques (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,           -- R=Receber P=Pagar
  numero TEXT,
  banco TEXT,
  valor REAL DEFAULT 0,
  data_emissao TEXT,
  data_vencimento TEXT,
  data_compensacao TEXT,
  codigo_pessoa TEXT,
  nome_pessoa TEXT,
  nro_docto TEXT,
  situacao TEXT DEFAULT 'A',    -- A=Aberto C=Compensado D=Devolvido
  observacao TEXT,
  usuario TEXT,
  data_atualizacao TEXT,
  hora_atualizacao TEXT
);

-- ============================================================
-- TABELA: lancamentos_extras (vales, outras receitas, despesas)
-- ============================================================
CREATE TABLE IF NOT EXISTS lancamentos_extras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,           -- RECEITA DESPESA VALE
  descricao TEXT NOT NULL,
  valor REAL DEFAULT 0,
  data TEXT NOT NULL,
  nome_pessoa TEXT,
  forma_pagamento TEXT,
  situacao TEXT DEFAULT 'A',    -- A=Pendente P=Pago C=Cancelado
  data_pagamento TEXT,
  observacao TEXT,
  usuario TEXT,
  data_atualizacao TEXT,
  hora_atualizacao TEXT
);

-- ============================================================
-- TABELA: reajustes_preco (histórico de reajustes)
-- ============================================================
CREATE TABLE IF NOT EXISTS reajustes_preco (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_produto TEXT NOT NULL,
  produto TEXT NOT NULL,
  preco_anterior REAL DEFAULT 0,
  preco_novo REAL DEFAULT 0,
  percentual REAL DEFAULT 0,
  data TEXT NOT NULL,
  usuario TEXT
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_cgc ON clientes(cgc);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
CREATE INDEX IF NOT EXISTS idx_produtos_descricao ON produtos(descricao);
CREATE INDEX IF NOT EXISTS idx_produtos_ean ON produtos(ean);
CREATE INDEX IF NOT EXISTS idx_produtos_grupo ON produtos(codigo_grupo);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON vendas(codigo_cliente);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data);
CREATE INDEX IF NOT EXISTS idx_vendas_situacao ON vendas(situacao);
CREATE INDEX IF NOT EXISTS idx_vendas_itens_orcamento ON vendas_itens(orcamento);
CREATE INDEX IF NOT EXISTS idx_cr_cliente ON contas_receber(codigo_cliente);
CREATE INDEX IF NOT EXISTS idx_cr_vencimento ON contas_receber(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_cr_situacao ON contas_receber(situacao_docto);
CREATE INDEX IF NOT EXISTS idx_cp_fornecedor ON contas_pagar(codigo_fornecedor);
CREATE INDEX IF NOT EXISTS idx_cp_vencimento ON contas_pagar(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_cp_situacao ON contas_pagar(situacao_docto);
CREATE INDEX IF NOT EXISTS idx_pv_situacao ON pre_vendas(situacao);
CREATE INDEX IF NOT EXISTS idx_pv_data ON pre_vendas(data);
CREATE INDEX IF NOT EXISTS idx_pvi_numero ON pre_vendas_itens(numero);
CREATE INDEX IF NOT EXISTS idx_me_produto ON movimentos_estoque(produto_id);
CREATE INDEX IF NOT EXISTS idx_me_data ON movimentos_estoque(data);
CREATE INDEX IF NOT EXISTS idx_me_tipo ON movimentos_estoque(tipo);
CREATE INDEX IF NOT EXISTS idx_cr_nro_docto ON contas_receber(nro_docto);
CREATE INDEX IF NOT EXISTS idx_cr_tipo_situacao ON contas_receber(tipo_docto, situacao_docto);
CREATE INDEX IF NOT EXISTS idx_movimentos_caixa_situacao ON movimentos_caixa(situacao);
CREATE INDEX IF NOT EXISTS idx_usuarios_login ON usuarios(usuario, ativo);
CREATE INDEX IF NOT EXISTS idx_vendas_itens_codigo_produto ON vendas_itens(codigo_produto);
CREATE INDEX IF NOT EXISTS idx_pedidos_compra_itens_numero ON pedidos_compra_itens(numero);
CREATE INDEX IF NOT EXISTS idx_lancamentos_extras_tipo_situacao ON lancamentos_extras(tipo, situacao);
