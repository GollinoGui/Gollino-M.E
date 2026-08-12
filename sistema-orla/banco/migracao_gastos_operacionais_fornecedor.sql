-- Rodar uma única vez no SQL Editor do Supabase (Dashboard > SQL Editor).
-- Adiciona o link opcional entre um gasto FIXO e um fornecedor cadastrado,
-- pra reconciliar com Contas a Pagar no simulador de Ponto de Equilíbrio
-- (mostrar "pago"/"em aberto"/"não lançado" a partir do lançamento real).

ALTER TABLE gastos_operacionais ADD COLUMN IF NOT EXISTS codigo_fornecedor TEXT;
