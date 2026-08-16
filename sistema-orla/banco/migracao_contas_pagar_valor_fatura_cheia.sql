-- Campo opcional de referência: quando uma conta a pagar é só a fatia da
-- loja numa fatura dividida com outra pessoa (ex: internet/celular
-- compartilhados com o Fábio Jr, cada um paga a sua parte direto), este
-- campo guarda o valor cheio da fatura pra conferência. valor_docto
-- continua sendo só o que a loja realmente paga — o caixa nunca é afetado
-- por este campo, é puramente informativo.
ALTER TABLE contas_pagar ADD COLUMN IF NOT EXISTS valor_fatura_cheia DOUBLE PRECISION;
