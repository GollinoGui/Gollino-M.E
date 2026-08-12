-- Renumera as vendas já existentes pra continuar um controle anterior que
-- parou em 126 (secretária pediu: primeira venda = 0127, daí em diante 1 a
-- 1). Isso é diferente da correção anterior (migracao_vendas_numeracao_
-- atomica.sql), que só evita furos NOVOS — esta aqui reescreve o número das
-- 36 vendas que já existem hoje (10 a 88) pra virarem 127 a 162, na mesma
-- ordem em que estão.
--
-- O registro "HIST-202607" (marcador de importação em lote de vendas
-- antigas, sem numeração individual) fica de fora — não é uma venda
-- numerada de verdade.
--
-- Atenção: se alguma dessas 36 vendas já teve recibo impresso em papel
-- entregue pro cliente, aquele papel vai mostrar um número diferente do que
-- passa a estar no sistema a partir daqui. Confirmado com o Elter antes de
-- rodar.

-- 1) Mapeamento antigo -> novo, na ordem em que os números já estão hoje.
CREATE TEMP TABLE mapa_renumeracao AS
SELECT orcamento AS antigo,
       lpad((126 + row_number() over (order by orcamento::int))::text, 8, '0') AS novo
FROM vendas
WHERE orcamento ~ '^\d+$';

-- 2) Solta a referência entre vendas_itens e vendas — sem isso não dá pra
--    atualizar as duas tabelas sem violar a referência no meio do caminho.
ALTER TABLE vendas_itens DROP CONSTRAINT vendas_itens_orcamento_fkey;

-- 3) Atualiza os itens primeiro...
UPDATE vendas_itens vi SET orcamento = m.novo
FROM mapa_renumeracao m WHERE vi.orcamento = m.antigo;

-- 4) ...depois as vendas.
UPDATE vendas v SET orcamento = m.novo
FROM mapa_renumeracao m WHERE v.orcamento = m.antigo;

-- 5) Recoloca a referência exatamente como estava.
ALTER TABLE vendas_itens ADD CONSTRAINT vendas_itens_orcamento_fkey
  FOREIGN KEY (orcamento) REFERENCES vendas(orcamento);

-- 6) Contas a receber geradas por essas vendas (venda a prazo / cartão de
--    crédito) — não tem FK de banco, mas precisa acompanhar pra continuar
--    rastreável.
UPDATE contas_receber cr SET nro_docto = m.novo
FROM mapa_renumeracao m
WHERE cr.nro_docto = m.antigo AND cr.tipo_docto IN ('VD','CC');

-- 7) Cheques recebidos como pagamento de venda.
UPDATE cheques ch SET nro_docto = m.novo
FROM mapa_renumeracao m
WHERE ch.nro_docto = m.antigo AND ch.tipo = 'R';

-- 8) Texto "Venda #X" / "Cancelamento venda #X" nos movimentos de estoque —
--    não é referência de banco, só texto solto, mas fica errado se não
--    acompanhar.
UPDATE movimentos_estoque me SET obs = 'Venda #' || m.novo
FROM mapa_renumeracao m
WHERE me.obs = 'Venda #' || m.antigo;

UPDATE movimentos_estoque me SET obs = 'Cancelamento venda #' || m.novo
FROM mapa_renumeracao m
WHERE me.obs = 'Cancelamento venda #' || m.antigo;

-- 9) Contador atômico pula pro novo topo — a próxima venda nova sai 163.
UPDATE numeradores SET valor = (SELECT max(novo::int) FROM mapa_renumeracao)
WHERE chave = 'vendas';

DROP TABLE mapa_renumeracao;
