-- Rodar uma única vez no SQL Editor do Supabase (Dashboard > SQL Editor).
--
-- 1) valor_fatura_cheia: mesmo campo de referência criado em contas_pagar
--    (ver migracao_contas_pagar_valor_fatura_cheia.sql), agora também no
--    gasto fixo do Ponto de Equilíbrio — pra contas divididas com outra
--    pessoa (internet/celular), "valor" continua sendo só a fatia real da
--    loja (o que entra na conta de equilíbrio), e este campo guarda o valor
--    cheio da fatura só pra conferência. Não afeta nenhum cálculo.
--
-- 2) gastos_operacionais_pagamentos: confirmação manual de pagamento por
--    mês. Gasto FIXO não tem mes_referencia (vale todo mês), então "pago"
--    precisa ser um registro por mês, não um campo único no gasto. Serve de
--    alternativa/complemento à reconciliação automática com Contas a Pagar
--    (que só funciona pra gasto vinculado a um fornecedor com conta lançada
--    naquele mês) — pra gasto sem fornecedor, ou pago por fora do sistema
--    (dinheiro, PIX direto), um administrador confirma manualmente aqui.

ALTER TABLE gastos_operacionais ADD COLUMN IF NOT EXISTS valor_fatura_cheia DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS gastos_operacionais_pagamentos (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  gasto_id INTEGER NOT NULL REFERENCES gastos_operacionais(id) ON DELETE CASCADE,
  mes_referencia TEXT NOT NULL,
  data_pagamento TEXT NOT NULL,
  usuario TEXT,
  UNIQUE (gasto_id, mes_referencia)
);

CREATE INDEX IF NOT EXISTS idx_gastos_operacionais_pagamentos_mes ON gastos_operacionais_pagamentos(mes_referencia);

ALTER TABLE gastos_operacionais_pagamentos ENABLE ROW LEVEL SECURITY;

-- Mesma régua de acesso do gasto operacional em si (dado sensível de
-- fixo/salário) — só nível admin (250) mexe aqui.
CREATE POLICY "gastos_operacionais_pagamentos_nivel_alto" ON gastos_operacionais_pagamentos
  FOR ALL TO authenticated
  USING (nivel_atual() >= 250)
  WITH CHECK (nivel_atual() >= 250);
