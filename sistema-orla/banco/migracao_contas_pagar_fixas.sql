-- Rodar uma única vez no SQL Editor do Supabase (Dashboard > SQL Editor).
--
-- Contas fixas (aluguel, internet, contador etc.) até hoje precisavam ser
-- lançadas manualmente todo mês em Contas a Pagar — não existia nenhuma
-- automação de relançamento, apesar da coluna despesa_fixa já existir na
-- tabela (nunca foi usada por nenhuma tela). Isso reaproveita essa coluna
-- como o marcador "essa conta se repete todo mês" e adiciona a rotina que
-- gera sozinha o lançamento do mês novo.
--
-- id_conta_origem: aponta pra conta que deu origem ao clone automático —
-- é o rastro de "de onde veio" (quem/quando já vêm nas colunas usuario/
-- data_atualizacao/hora_atualizacao de sempre, preenchidas como
-- "<usuário> (relançamento automático)" pra diferenciar de lançamento manual).

ALTER TABLE contas_pagar ADD COLUMN IF NOT EXISTS id_conta_origem INTEGER REFERENCES contas_pagar(id);

CREATE INDEX IF NOT EXISTS idx_cp_fixa ON contas_pagar(codigo_fornecedor, codigo_plano_conta) WHERE despesa_fixa = 'S';

-- Gera o lançamento do mês corrente pra cada conta fixa que ainda não tem
-- uma cópia neste mês (mesmo fornecedor + mesmo plano de contas identificam
-- "a mesma conta fixa"; pega sempre o lançamento mais recente desse par como
-- modelo, então valor/forma de pagamento acompanham o último ajuste feito).
-- Idempotente: se já existe conta lançada nesse mês pra aquele par, pula —
-- pode chamar toda vez que a tela de Contas a Pagar abre sem duplicar.
--
-- SECURITY DEFINER porque nível 1 (Rosângela) também abre a tela e o
-- relançamento tem que acontecer independente de quem entrou primeiro no
-- mês novo — ela continua sem poder criar conta manualmente (RLS
-- tier2_write direto na tabela não muda), a exceção é só pra essa rotina
-- automática, igual já é feito em contas_pagar_pagar.
CREATE OR REPLACE FUNCTION public.contas_pagar_relancar_fixas(p_usuario text DEFAULT NULL::text)
 RETURNS SETOF contas_pagar
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_template contas_pagar%rowtype;
  v_mes_atual text := to_char(now(), 'YYYY-MM');
  v_dia integer;
  v_ultimo_dia integer;
  v_nova_data text;
begin
  if nivel_atual() < 1 then
    raise exception 'Nível de acesso insuficiente.';
  end if;

  for v_template in
    select distinct on (codigo_fornecedor, codigo_plano_conta) *
    from contas_pagar
    where despesa_fixa = 'S'
      and data_vencimento is not null
    order by codigo_fornecedor, codigo_plano_conta, id desc
  loop
    if exists (
      select 1 from contas_pagar cp
      where cp.codigo_fornecedor = v_template.codigo_fornecedor
        and coalesce(cp.codigo_plano_conta, '') = coalesce(v_template.codigo_plano_conta, '')
        and cp.data_vencimento is not null
        and to_char(to_date(cp.data_vencimento, 'YYYY-MM-DD'), 'YYYY-MM') = v_mes_atual
    ) then
      continue;
    end if;

    v_dia := extract(day from to_date(v_template.data_vencimento, 'YYYY-MM-DD'));
    v_ultimo_dia := extract(day from (date_trunc('month', now()) + interval '1 month - 1 day'));
    v_nova_data := to_char(date_trunc('month', now()) + (least(v_dia, v_ultimo_dia) - 1) * interval '1 day', 'YYYY-MM-DD');

    return query
      insert into contas_pagar (
        codigo_fornecedor, codigo_plano_conta, observacao, nro_docto, valor_docto,
        valor_fatura_cheia, codigo_forma_pagamento, despesa_fixa, data_docto,
        data_vencimento, situacao_docto, usuario, id_conta_origem,
        data_atualizacao, hora_atualizacao
      ) values (
        v_template.codigo_fornecedor, v_template.codigo_plano_conta, v_template.observacao, null,
        v_template.valor_docto, v_template.valor_fatura_cheia, v_template.codigo_forma_pagamento, 'S',
        to_char(now(), 'YYYY-MM-DD'), v_nova_data, 'A',
        coalesce(p_usuario, 'sistema') || ' (relançamento automático)', v_template.id,
        to_char(now(), 'YYYY-MM-DD'), to_char(now(), 'HH24:MI:SS')
      )
      returning *;
  end loop;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.contas_pagar_relancar_fixas(text) TO authenticated;
