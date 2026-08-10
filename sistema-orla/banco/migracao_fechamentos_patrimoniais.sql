-- Rodar uma única vez no SQL Editor do Supabase (Dashboard > SQL Editor).
-- Cria a tabela que guarda cada "fechamento do mês" (estoque, a receber,
-- a pagar, caixa/banco, patrimônio e o lucro real calculado por diferença
-- em relação ao fechamento anterior).

CREATE TABLE IF NOT EXISTS fechamentos_patrimoniais (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_fechamento TEXT NOT NULL UNIQUE,
  estoque_custo DOUBLE PRECISION DEFAULT 0,
  contas_receber_aberto DOUBLE PRECISION DEFAULT 0,
  contas_pagar_aberto DOUBLE PRECISION DEFAULT 0,
  caixa_banco DOUBLE PRECISION DEFAULT 0,
  patrimonio DOUBLE PRECISION DEFAULT 0,
  retiradas_socio DOUBLE PRECISION DEFAULT 0,
  aportes_socio DOUBLE PRECISION DEFAULT 0,
  lucro_periodo DOUBLE PRECISION,
  observacao TEXT,
  usuario TEXT,
  criado_em TEXT,
  criado_hora TEXT
);

ALTER TABLE fechamentos_patrimoniais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fechamentos_patrimoniais_authenticated_all" ON fechamentos_patrimoniais
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
