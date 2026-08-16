-- Campo manual de % de imposto por venda, preenchido quando a nota fiscal
-- daquela venda é emitida (não há cálculo automático de imposto no sistema).
-- Usado na aba "Vendas Detalhadas" de Financeiro > Lucro Real.
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS imposto_percentual DOUBLE PRECISION;
