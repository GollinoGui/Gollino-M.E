-- Sazonalidade (Lucro Real): 3 RPCs somente-leitura, sem filtro de período —
-- sempre trazem o histórico inteiro (cardinalidade baixa: produto × mês, ou
-- só mês). Seguem o mesmo padrão de relatorio_itens_vendidos (LANGUAGE sql,
-- filtro vendas.situacao = 'N').
--
-- 1) relatorio_sazonalidade_produtos: venda por produto, mês a mês (YYYY-MM)
-- 2) relatorio_vendas_mensais: total de vendas da empresa, mês a mês
-- 3) relatorio_contas_receber_mensal: total de conta a receber GERADA, mês a mês
--    (data_docto — não é saldo em aberto histórico, é volume de crédito
--    concedido naquele mês; não existe snapshot de saldo antes de
--    fechamentos_patrimoniais)

CREATE OR REPLACE FUNCTION public.relatorio_sazonalidade_produtos()
RETURNS TABLE(codigo text, descricao text, unidade text, mes text, quantidade numeric, valor_venda numeric)
LANGUAGE sql
SET search_path TO 'public'
AS $function$
  SELECT vi.codigo_produto, vi.descricao, vi.unidade, substring(v.data, 1, 7) AS mes,
         SUM(vi.quantidade), SUM(vi.valor_total)
  FROM vendas_itens vi
  JOIN vendas v ON vi.orcamento = v.orcamento
  WHERE v.situacao = 'N'
  GROUP BY vi.codigo_produto, vi.descricao, vi.unidade, substring(v.data, 1, 7)
  ORDER BY vi.descricao, mes;
$function$;

CREATE OR REPLACE FUNCTION public.relatorio_vendas_mensais()
RETURNS TABLE(mes text, quantidade_vendas bigint, valor_total numeric)
LANGUAGE sql
SET search_path TO 'public'
AS $function$
  SELECT substring(data, 1, 7) AS mes, COUNT(*), SUM(valor_total)
  FROM vendas
  WHERE situacao = 'N'
  GROUP BY substring(data, 1, 7)
  ORDER BY mes;
$function$;

CREATE OR REPLACE FUNCTION public.relatorio_contas_receber_mensal()
RETURNS TABLE(mes text, quantidade bigint, valor_gerado numeric)
LANGUAGE sql
SET search_path TO 'public'
AS $function$
  SELECT substring(data_docto, 1, 7) AS mes, COUNT(*), SUM(valor_docto)
  FROM contas_receber
  GROUP BY substring(data_docto, 1, 7)
  ORDER BY mes;
$function$;
