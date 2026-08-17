-- Já aplicada em produção via MCP do Supabase em 2026-08-16 — este arquivo é
-- só o registro em versionamento, não precisa rodar de novo.
--
-- contas_pagar_pagar passa a aceitar nível 1 (Rosângela), não só nível 2+
-- (Elter/admin). Decisão deliberada e escopada: ela ganha só a ação de
-- CONFIRMAR pagamento de uma conta já lançada (inclusive pagamento parcial
-- com "a outra parte pagou", ver ModalConfirmarPagamento em ContasPagar.jsx)
-- — não ganha nível 2 de verdade, então continua sem acesso a Lucro Real
-- (financeiro_lucro_periodo/financeiro_historico_mensal), sem poder aprovar
-- baixa de dívida incobrável (contas_receber_baixar_prejuizo), sem poder
-- criar/editar/excluir conta a pagar direto (RLS tier2_write/update/delete
-- continuam em nível 2) e sem acesso a cheques a pagar. Ver front-end:
-- podeCriarConta (nível 2, inalterado) vs podePagarConta (nível 1, novo).
CREATE OR REPLACE FUNCTION public.contas_pagar_pagar(p_id integer, p_valor_pagamento numeric, p_valor_desconto numeric DEFAULT 0, p_forma text DEFAULT NULL::text, p_data_pagamento text DEFAULT NULL::text, p_usuario text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_conta record;
  v_total_pago numeric;
  v_saldo_aberto numeric;
  v_nova_situacao text;
  v_data text := to_char(now(), 'YYYY-MM-DD');
  v_hora text := to_char(now(), 'HH24:MI:SS');
begin
  if nivel_atual() < 1 then
    raise exception 'Nível de acesso insuficiente para registrar pagamentos.';
  end if;

  select * into v_conta from contas_pagar where id = p_id for update;
  if v_conta is null then
    raise exception 'Conta a pagar não encontrada.';
  end if;
  if v_conta.situacao_docto <> 'A' then
    raise exception 'Esta conta já foi processada (situação atual: %).', v_conta.situacao_docto;
  end if;
  if p_valor_pagamento is null or p_valor_pagamento <= 0 then
    raise exception 'Valor de pagamento deve ser maior que zero.';
  end if;

  v_saldo_aberto := v_conta.valor_docto - coalesce(v_conta.valor_pagamento, 0);
  if p_valor_pagamento > v_saldo_aberto + coalesce(p_valor_desconto, 0) + 0.01 then
    raise exception 'Valor pago (%) maior que o saldo em aberto (%).', p_valor_pagamento, v_saldo_aberto;
  end if;

  v_total_pago := coalesce(v_conta.valor_pagamento, 0) + p_valor_pagamento;
  v_nova_situacao := case when v_total_pago + coalesce(p_valor_desconto, 0) >= v_conta.valor_docto - 0.01 then 'P' else 'A' end;

  update contas_pagar set
    situacao_docto = v_nova_situacao,
    data_pagamento = coalesce(p_data_pagamento, v_data),
    valor_pagamento = v_total_pago,
    valor_desconto = coalesce(v_conta.valor_desconto, 0) + coalesce(p_valor_desconto, 0),
    codigo_forma_pagamento = coalesce(p_forma, v_conta.codigo_forma_pagamento),
    usuario = p_usuario,
    data_atualizacao = v_data,
    hora_atualizacao = v_hora
  where id = p_id;
end;
$function$
