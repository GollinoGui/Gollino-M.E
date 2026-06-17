-- ============================================================
-- SCHEMA POSTGRES — Gollino M.E
-- Convertido a partir do schema.sql (SQLite) para uso no Supabase
-- ============================================================

-- ============================================================
-- TABELA: clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  cpf TEXT,
  rg TEXT,
  cgc TEXT,
  ie TEXT,
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
  haver DOUBLE PRECISION DEFAULT 0,
  saldo DOUBLE PRECISION DEFAULT 0,
  codigo_situacao_cliente TEXT DEFAULT 'A',
  tipo_preco TEXT,
  tipo_venda TEXT,
  limite_credito DOUBLE PRECISION DEFAULT 0,
  credito_rotativo TEXT,
  tabela_preco TEXT,
  forma_pagamento TEXT,
  percentual_desconto_padrao DOUBLE PRECISION DEFAULT 0,
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
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  descricao TEXT NOT NULL,
  descricao_menor TEXT,
  referencia TEXT,
  nro_original TEXT,
  codigo_grupo TEXT,
  codigo_linha TEXT,
  unidade TEXT,
  revenda_consumo TEXT,
  cor TEXT,
  tamanho TEXT,
  localizacao TEXT,
  ean TEXT,
  codigo_fabricante TEXT,
  caminho_foto TEXT,
  observacao TEXT,
  situacao_produto TEXT DEFAULT 'A',
  estoque_atual DOUBLE PRECISION DEFAULT 0,
  estoque_minimo DOUBLE PRECISION DEFAULT 0,
  estoque_condicional DOUBLE PRECISION DEFAULT 0,
  estoque_requisicao DOUBLE PRECISION DEFAULT 0,
  controla_estoque TEXT DEFAULT 'S',
  custo_preco_unitario DOUBLE PRECISION DEFAULT 0,
  preco_custo_atual DOUBLE PRECISION DEFAULT 0,
  preco_custo_diferenciado DOUBLE PRECISION DEFAULT 0,
  preco_venda_vista DOUBLE PRECISION DEFAULT 0,
  preco_venda_prazo DOUBLE PRECISION DEFAULT 0,
  preco_venda_minimo DOUBLE PRECISION DEFAULT 0,
  preco_venda_diferenciado DOUBLE PRECISION DEFAULT 0,
  margem_lucro_preco_vista DOUBLE PRECISION DEFAULT 0,
  margem_lucro_preco_prazo DOUBLE PRECISION DEFAULT 0,
  markup_vista DOUBLE PRECISION DEFAULT 0,
  markup_prazo DOUBLE PRECISION DEFAULT 0,
  ncm TEXT,
  codigo_cest TEXT,
  codigo_anp TEXT,
  cfop_cfe TEXT DEFAULT '5405',
  cfop_nfe_no_estado TEXT,
  cfop_nfe_fora_estado TEXT,
  cst_icms TEXT,
  aliquota_icms DOUBLE PRECISION DEFAULT 0,
  cst_pis TEXT,
  aliquota_pis DOUBLE PRECISION DEFAULT 0,
  cst_cofins TEXT,
  aliquota_cofins DOUBLE PRECISION DEFAULT 0,
  codigo_enquadramento TEXT,
  origem_mercadoria TEXT DEFAULT '0',
  ibpt_percentual_nacional DOUBLE PRECISION DEFAULT 0,
  ibpt_percentual_importado DOUBLE PRECISION DEFAULT 0,
  ibpt_percentual_estadual DOUBLE PRECISION DEFAULT 0,
  ibpt_percentual_municipal DOUBLE PRECISION DEFAULT 0,
  peso_bruto DOUBLE PRECISION DEFAULT 0,
  peso_liquido DOUBLE PRECISION DEFAULT 0,
  codigo_fornecedor_padrao TEXT,
  data_ultima_alteracao_preco TEXT,
  data_ultima_venda TEXT,
  quantidade_vendas DOUBLE PRECISION DEFAULT 0,
  quantidade_entradas DOUBLE PRECISION DEFAULT 0,
  usuario TEXT,
  data_atualizacao TEXT,
  hora_atualizacao TEXT,
  status_registro TEXT DEFAULT 'A'
);

-- ============================================================
-- TABELA: vendas (Orlasoft chama de Orcamento)
-- ============================================================
CREATE TABLE IF NOT EXISTS vendas (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  orcamento TEXT UNIQUE NOT NULL,
  codigo_cliente TEXT NOT NULL,
  data TEXT NOT NULL,
  tipo_venda TEXT DEFAULT 'V',
  situacao TEXT DEFAULT 'N',
  observacao TEXT,
  observacao2 TEXT,
  valor_total DOUBLE PRECISION DEFAULT 0,
  valor_descontos_itens DOUBLE PRECISION DEFAULT 0,
  valor_acrescimo DOUBLE PRECISION DEFAULT 0,
  valor_desconto_final DOUBLE PRECISION DEFAULT 0,
  valor_entrada DOUBLE PRECISION DEFAULT 0,
  valor_restante DOUBLE PRECISION DEFAULT 0,
  valor_troco DOUBLE PRECISION DEFAULT 0,
  valor_produtos DOUBLE PRECISION DEFAULT 0,
  codigo_forma_pagamento1 TEXT,
  codigo_forma_pagamento2 TEXT,
  codigo_forma_pagamento3 TEXT,
  valor_pago_dinheiro DOUBLE PRECISION DEFAULT 0,
  valor_pago_cartao_credito DOUBLE PRECISION DEFAULT 0,
  valor_pago_cartao_debito DOUBLE PRECISION DEFAULT 0,
  valor_pago_cheque DOUBLE PRECISION DEFAULT 0,
  valor_pago_haver DOUBLE PRECISION DEFAULT 0,
  valor_deixado_em_haver DOUBLE PRECISION DEFAULT 0,
  valor_pago_contas_receber DOUBLE PRECISION DEFAULT 0,
  qtde_parcelas1 INTEGER DEFAULT 0,
  qtde_parcelas2 INTEGER DEFAULT 0,
  qtde_parcelas_entrada INTEGER DEFAULT 0,
  qtde_parcelas_restante INTEGER DEFAULT 0,
  numero_nfe TEXT,
  chave_consulta_sat TEXT,
  numero_serie_ecf TEXT,
  coo TEXT,
  inf_nome TEXT,
  inf_cpf TEXT,
  inf_cgc TEXT,
  entrega_domicilio TEXT DEFAULT 'N',
  entrega_futura TEXT DEFAULT 'N',
  taxa_entrega DOUBLE PRECISION DEFAULT 0,
  motorista TEXT,
  usuario_cancelamento TEXT,
  data_cancelamento TEXT,
  motivo_cancelamento TEXT,
  codigo_vendedor TEXT,
  numero_turno TEXT,
  numero_caixa TEXT,
  codigo_tipo_venda TEXT,
  usuario_cadastro TEXT,
  data_cadastro TEXT,
  hora_cadastro TEXT
);

-- ============================================================
-- TABELA: vendas_itens
-- ============================================================
CREATE TABLE IF NOT EXISTS vendas_itens (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  orcamento TEXT NOT NULL,
  codigo_produto TEXT NOT NULL,
  descricao TEXT,
  quantidade DOUBLE PRECISION DEFAULT 1,
  unidade TEXT,
  preco_unitario DOUBLE PRECISION DEFAULT 0,
  preco_custo DOUBLE PRECISION DEFAULT 0,
  valor_desconto DOUBLE PRECISION DEFAULT 0,
  valor_acrescimo DOUBLE PRECISION DEFAULT 0,
  valor_total DOUBLE PRECISION DEFAULT 0,
  FOREIGN KEY (orcamento) REFERENCES vendas(orcamento)
);

-- ============================================================
-- TABELA: contas_receber
-- ============================================================
CREATE TABLE IF NOT EXISTS contas_receber (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nro_docto TEXT NOT NULL,
  tipo_docto TEXT,
  seq_docto TEXT,
  codigo_cliente TEXT NOT NULL,
  data_docto TEXT NOT NULL,
  data_vencimento TEXT,
  data_pagamento TEXT,
  valor_docto DOUBLE PRECISION DEFAULT 0,
  valor_pagamento DOUBLE PRECISION DEFAULT 0,
  valor_desconto DOUBLE PRECISION DEFAULT 0,
  valor_acrescimo DOUBLE PRECISION DEFAULT 0,
  valor_juros DOUBLE PRECISION DEFAULT 0,
  valor_original DOUBLE PRECISION DEFAULT 0,
  valor_recibo DOUBLE PRECISION DEFAULT 0,
  situacao_docto TEXT DEFAULT 'A',
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
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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
  valor_docto DOUBLE PRECISION DEFAULT 0,
  valor_pagamento DOUBLE PRECISION DEFAULT 0,
  valor_desconto DOUBLE PRECISION DEFAULT 0,
  valor_acrescimo DOUBLE PRECISION DEFAULT 0,
  situacao_docto TEXT DEFAULT 'A',
  codigo_banco TEXT,
  codigo_forma_pagamento TEXT,
  entra_caixa TEXT DEFAULT 'N',
  valor_caixa DOUBLE PRECISION DEFAULT 0,
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
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero_caixa TEXT NOT NULL,
  numero_turno TEXT,
  data_abertura TEXT,
  hora_abertura TEXT,
  data_fechamento TEXT,
  hora_fechamento TEXT,
  usuario_abertura TEXT,
  usuario_fechamento TEXT,
  valor_abertura DOUBLE PRECISION DEFAULT 0,
  valor_fechamento DOUBLE PRECISION DEFAULT 0,
  valor_dinheiro DOUBLE PRECISION DEFAULT 0,
  valor_cheque DOUBLE PRECISION DEFAULT 0,
  valor_cartao_credito DOUBLE PRECISION DEFAULT 0,
  valor_cartao_debito DOUBLE PRECISION DEFAULT 0,
  valor_outros DOUBLE PRECISION DEFAULT 0,
  situacao TEXT DEFAULT 'A'
);

-- ============================================================
-- TABELA: fornecedores
-- ============================================================
CREATE TABLE IF NOT EXISTS fornecedores (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  nome TEXT,
  nivel INTEGER DEFAULT 1,
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
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  descricao TEXT NOT NULL,
  codigo_linha TEXT,
  status TEXT DEFAULT 'A'
);

-- ============================================================
-- TABELA: linhas_produtos
-- ============================================================
CREATE TABLE IF NOT EXISTS linhas_produtos (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  descricao TEXT NOT NULL,
  status TEXT DEFAULT 'A'
);

-- ============================================================
-- TABELA: cidades
-- ============================================================
CREATE TABLE IF NOT EXISTS cidades (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  uf TEXT,
  codigo_ibge TEXT
);

-- ============================================================
-- TABELA: configuracoes
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracoes (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chave TEXT UNIQUE NOT NULL,
  valor TEXT,
  descricao TEXT
);

-- ============================================================
-- TABELA: numeradores (geração atômica de números de documento)
-- ============================================================
CREATE TABLE IF NOT EXISTS numeradores (
  chave TEXT PRIMARY KEY,
  valor INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- DADOS INICIAIS — Configurações da empresa
-- ============================================================
INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('empresa_razao_social', 'ELTER GOLLINO', 'Razão Social'),
  ('empresa_nome_fantasia', 'GOLLINO M.E', 'Nome Fantasia'),
  ('empresa_cnpj', '01.748.720/0001-00', 'CNPJ'),
  ('empresa_regime', 'Simples Nacional', 'Regime Tributário'),
  ('empresa_cidade', 'Orlândia', 'Cidade'),
  ('empresa_uf', 'SP', 'UF'),
  ('sistema_versao', '1.0.0', 'Versão do Sistema'),
  ('caixa_aberto', 'N', 'Status do Caixa')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================
-- USUÁRIOS — sem seed de senha aqui de propósito (este arquivo é público).
-- O primeiro usuário admin deve ser criado manualmente, direto no banco,
-- com uma senha forte gerada fora do controle de versão.
-- ============================================================

-- ============================================================
-- DADOS INICIAIS — Caixa padrão
-- ============================================================
INSERT INTO caixas (codigo, descricao) VALUES
  ('001', 'Caixa Principal')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- DADOS INICIAIS — Linhas de produtos (do Orlasoft)
-- ============================================================
INSERT INTO linhas_produtos (codigo, descricao) VALUES
  ('001', 'CHAPAS'),
  ('002', 'GERAL'),
  ('003', 'ARAMES'),
  ('004', 'SELANTES')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- TABELA: pre_vendas
-- ============================================================
CREATE TABLE IF NOT EXISTS pre_vendas (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero TEXT UNIQUE NOT NULL,
  tipo TEXT DEFAULT 'CONDICIONAL',
  codigo_cliente TEXT DEFAULT '',
  nome_cliente TEXT DEFAULT 'Consumidor a vista',
  vendedor TEXT DEFAULT 'Geral',
  observacao TEXT,
  valor_total DOUBLE PRECISION DEFAULT 0,
  qtde_itens DOUBLE PRECISION DEFAULT 0,
  situacao TEXT DEFAULT 'ABERTA',
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
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero TEXT NOT NULL,
  codigo_produto TEXT NOT NULL,
  descricao TEXT,
  quantidade DOUBLE PRECISION DEFAULT 1,
  preco_unitario DOUBLE PRECISION DEFAULT 0,
  total DOUBLE PRECISION DEFAULT 0,
  FOREIGN KEY (numero) REFERENCES pre_vendas(numero)
);

-- ============================================================
-- TABELA: movimentos_estoque
-- ============================================================
CREATE TABLE IF NOT EXISTS movimentos_estoque (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo TEXT NOT NULL,
  produto_id TEXT NOT NULL,
  produto TEXT NOT NULL,
  quantidade DOUBLE PRECISION DEFAULT 0,
  valor_unitario DOUBLE PRECISION DEFAULT 0,
  total DOUBLE PRECISION DEFAULT 0,
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
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero TEXT UNIQUE NOT NULL,
  fornecedor TEXT NOT NULL,
  data TEXT NOT NULL,
  data_previsao TEXT,
  situacao TEXT DEFAULT 'ABERTO',
  valor_total DOUBLE PRECISION DEFAULT 0,
  observacao TEXT,
  usuario TEXT,
  data_atualizacao TEXT,
  hora_atualizacao TEXT
);

CREATE TABLE IF NOT EXISTS pedidos_compra_itens (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero TEXT NOT NULL,
  codigo_produto TEXT NOT NULL,
  descricao TEXT,
  quantidade DOUBLE PRECISION DEFAULT 1,
  preco_unitario DOUBLE PRECISION DEFAULT 0,
  total DOUBLE PRECISION DEFAULT 0
);

-- ============================================================
-- TABELA: cheques
-- ============================================================
CREATE TABLE IF NOT EXISTS cheques (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo TEXT NOT NULL,
  numero TEXT,
  banco TEXT,
  valor DOUBLE PRECISION DEFAULT 0,
  data_emissao TEXT,
  data_vencimento TEXT,
  data_compensacao TEXT,
  codigo_pessoa TEXT,
  nome_pessoa TEXT,
  nro_docto TEXT,
  situacao TEXT DEFAULT 'A',
  observacao TEXT,
  usuario TEXT,
  data_atualizacao TEXT,
  hora_atualizacao TEXT
);

-- ============================================================
-- TABELA: lancamentos_extras (vales, outras receitas, despesas)
-- ============================================================
CREATE TABLE IF NOT EXISTS lancamentos_extras (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor DOUBLE PRECISION DEFAULT 0,
  data TEXT NOT NULL,
  nome_pessoa TEXT,
  forma_pagamento TEXT,
  situacao TEXT DEFAULT 'A',
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
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo_produto TEXT NOT NULL,
  produto TEXT NOT NULL,
  preco_anterior DOUBLE PRECISION DEFAULT 0,
  preco_novo DOUBLE PRECISION DEFAULT 0,
  percentual DOUBLE PRECISION DEFAULT 0,
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
