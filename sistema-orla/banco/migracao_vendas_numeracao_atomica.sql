-- Faz o número da venda (orçamento) ser gerado só no momento em que a venda
-- é gravada de verdade, dentro da mesma transação de vendas_salvar — antes
-- ele era pego assim que a tela de Vendas abria (Vendas.jsx), então toda
-- vez que a tela era aberta e fechada sem finalizar a venda (ou o app
-- reiniciava no meio do caminho), aquele número era perdido pra sempre,
-- criando furos na numeração (ex: 10, 13, 16, 17...).
--
-- Como a chamada de proximo_numero_atomico('vendas') passa a acontecer
-- DEPOIS das validações (saldo em haver) e ANTES do INSERT, qualquer erro
-- na sequência (ex: "Estoque insuficiente", lançado mais abaixo) desfaz a
-- transação inteira — incluindo o incremento do contador — então o número
-- nunca fica "queimado" à toa.

-- RETURNS muda de void pra text (devolve o orçamento gerado), e o Postgres
-- não deixa trocar o tipo de retorno com CREATE OR REPLACE — precisa apagar
-- a versão antiga primeiro.
DROP FUNCTION IF EXISTS public.vendas_salvar(jsonb, jsonb);

CREATE OR REPLACE FUNCTION public.vendas_salvar(p_venda jsonb, p_itens jsonb DEFAULT '[]'::jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_existe boolean;
  v_orcamento text := NULLIF(p_venda->>'orcamento', '');
  v_item jsonb;
  v_prod record;
  v_data text := to_char(now(), 'YYYY-MM-DD');
  v_hora text := to_char(now(), 'HH24:MI:SS');
  v_cr_existe boolean;
  v_data_venc text;
  v_sessao record;
  v_haver_atual numeric;
  v_haver_solicitado numeric := COALESCE((p_venda->>'valor_pago_haver')::numeric, 0);
BEGIN
  IF v_orcamento IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM vendas WHERE orcamento = v_orcamento) INTO v_existe;
  ELSE
    v_existe := false;
  END IF;

  IF NOT v_existe THEN
    SELECT id, numero_caixa, numero_turno INTO v_sessao
    FROM movimentos_caixa WHERE situacao = 'A' ORDER BY id DESC LIMIT 1;

    IF v_haver_solicitado > 0 THEN
      SELECT haver INTO v_haver_atual FROM clientes WHERE codigo = p_venda->>'codigo_cliente';
      IF COALESCE(v_haver_atual, 0) < v_haver_solicitado THEN
        RAISE EXCEPTION 'Saldo em haver insuficiente para o cliente (disponível: %, solicitado: %)', COALESCE(v_haver_atual, 0), v_haver_solicitado;
      END IF;
    END IF;

    IF v_orcamento IS NULL THEN
      v_orcamento := lpad(proximo_numero_atomico('vendas')::text, 8, '0');
    END IF;
  END IF;

  IF v_existe THEN
    UPDATE vendas SET
      codigo_cliente = p_venda->>'codigo_cliente',
      data = p_venda->>'data',
      tipo_venda = COALESCE(p_venda->>'tipo_venda','V'),
      situacao = COALESCE(p_venda->>'situacao','N'),
      valor_total = (p_venda->>'valor_total')::numeric,
      valor_descontos_itens = COALESCE((p_venda->>'valor_descontos_itens')::numeric,0),
      valor_acrescimo = COALESCE((p_venda->>'valor_acrescimo')::numeric,0),
      valor_desconto_final = COALESCE((p_venda->>'valor_desconto_final')::numeric,0),
      valor_entrada = COALESCE((p_venda->>'valor_entrada')::numeric,0),
      valor_restante = COALESCE((p_venda->>'valor_restante')::numeric,0),
      codigo_forma_pagamento1 = p_venda->>'codigo_forma_pagamento1',
      valor_pago_dinheiro = COALESCE((p_venda->>'valor_pago_dinheiro')::numeric,0),
      valor_pago_cartao_credito = COALESCE((p_venda->>'valor_pago_cartao_credito')::numeric,0),
      valor_pago_cartao_debito = COALESCE((p_venda->>'valor_pago_cartao_debito')::numeric,0),
      valor_pago_cheque = COALESCE((p_venda->>'valor_pago_cheque')::numeric,0),
      valor_pago_pix = COALESCE((p_venda->>'valor_pago_pix')::numeric,0),
      qtde_parcelas1 = COALESCE((p_venda->>'qtde_parcelas1')::integer,0),
      usuario_cadastro = p_venda->>'usuario_cadastro',
      data_cadastro = v_data,
      hora_cadastro = v_hora
    WHERE orcamento = v_orcamento;

    DELETE FROM vendas_itens WHERE orcamento = v_orcamento;
  ELSE
    INSERT INTO vendas (orcamento, codigo_cliente, data, tipo_venda, situacao,
      valor_total, valor_descontos_itens, valor_acrescimo, valor_desconto_final,
      valor_entrada, valor_restante, codigo_forma_pagamento1, valor_pago_dinheiro,
      valor_pago_cartao_credito, valor_pago_cartao_debito, valor_pago_cheque, valor_pago_pix, valor_pago_haver,
      qtde_parcelas1,
      observacao, usuario_cadastro, data_cadastro, hora_cadastro,
      caixa_sessao_id, numero_caixa, numero_turno)
    VALUES (
      v_orcamento, p_venda->>'codigo_cliente', p_venda->>'data',
      COALESCE(p_venda->>'tipo_venda','V'), 'N',
      (p_venda->>'valor_total')::numeric,
      COALESCE((p_venda->>'valor_descontos_itens')::numeric,0),
      COALESCE((p_venda->>'valor_acrescimo')::numeric,0),
      COALESCE((p_venda->>'valor_desconto_final')::numeric,0),
      COALESCE((p_venda->>'valor_entrada')::numeric,0),
      COALESCE((p_venda->>'valor_restante')::numeric,0),
      p_venda->>'codigo_forma_pagamento1',
      COALESCE((p_venda->>'valor_pago_dinheiro')::numeric,0),
      COALESCE((p_venda->>'valor_pago_cartao_credito')::numeric,0),
      COALESCE((p_venda->>'valor_pago_cartao_debito')::numeric,0),
      COALESCE((p_venda->>'valor_pago_cheque')::numeric,0),
      COALESCE((p_venda->>'valor_pago_pix')::numeric,0),
      v_haver_solicitado,
      COALESCE((p_venda->>'qtde_parcelas1')::integer,0),
      COALESCE(p_venda->>'observacao',''),
      p_venda->>'usuario_cadastro', v_data, v_hora,
      v_sessao.id, COALESCE(v_sessao.numero_caixa, '001'), COALESCE(v_sessao.numero_turno, '1')
    );
  END IF;

  -- Checagem + desconto de estoque numa única passada por item, com a linha
  -- do produto travada (FOR UPDATE) — evita que duas vendas concorrentes do
  -- mesmo produto leiam estoque suficiente antes de qualquer uma decrementar.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    SELECT estoque_atual, controla_estoque, descricao INTO v_prod
    FROM produtos WHERE codigo = v_item->>'codigo_produto'
    FOR UPDATE;

    IF v_prod.controla_estoque = 'S' AND COALESCE(v_prod.estoque_atual,0) < (v_item->>'quantidade')::numeric THEN
      RAISE EXCEPTION 'Estoque insuficiente: "%" — disponível: %, solicitado: %', v_prod.descricao, v_prod.estoque_atual, v_item->>'quantidade';
    END IF;

    INSERT INTO vendas_itens (orcamento, codigo_produto, descricao, quantidade, unidade, preco_unitario, preco_custo, valor_desconto, valor_acrescimo, valor_total)
    VALUES (
      v_orcamento, v_item->>'codigo_produto', v_item->>'descricao',
      (v_item->>'quantidade')::numeric, v_item->>'unidade', (v_item->>'preco_unitario')::numeric,
      COALESCE((v_item->>'preco_custo')::numeric,0), COALESCE((v_item->>'valor_desconto')::numeric,0),
      COALESCE((v_item->>'valor_acrescimo')::numeric,0), (v_item->>'valor_total')::numeric
    );

    -- Só desconta estoque de produtos com controle ativo — antes o desconto
    -- rodava incondicionalmente mesmo quando a checagem acima era pulada.
    IF v_prod.controla_estoque = 'S' THEN
      UPDATE produtos SET estoque_atual = estoque_atual - (v_item->>'quantidade')::numeric WHERE codigo = v_item->>'codigo_produto';
    END IF;

    INSERT INTO movimentos_estoque (tipo, produto_id, produto, quantidade, valor_unitario, total, data, obs, usuario, data_atualizacao, hora_atualizacao)
    VALUES ('SAIDA', v_item->>'codigo_produto', v_item->>'descricao', (v_item->>'quantidade')::numeric,
      COALESCE((v_item->>'preco_unitario')::numeric,0), COALESCE((v_item->>'valor_total')::numeric,0),
      v_data, 'Venda #' || v_orcamento, COALESCE(p_venda->>'usuario_cadastro','sistema'), v_data, v_hora);
  END LOOP;

  IF NOT v_existe AND v_haver_solicitado > 0 THEN
    UPDATE clientes SET haver = haver - v_haver_solicitado WHERE codigo = p_venda->>'codigo_cliente';
  END IF;

  IF COALESCE((p_venda->>'valor_deixado_em_haver')::numeric,0) > 0 THEN
    UPDATE clientes SET haver = haver + (p_venda->>'valor_deixado_em_haver')::numeric WHERE codigo = p_venda->>'codigo_cliente';
  END IF;

  IF NOT v_existe AND COALESCE(p_venda->>'situacao','N') = 'N' THEN
    SELECT EXISTS(SELECT 1 FROM contas_receber WHERE nro_docto = v_orcamento AND tipo_docto='VD') INTO v_cr_existe;

    IF NOT v_cr_existe THEN
      IF p_venda->>'codigo_forma_pagamento1' = 'Convênio' THEN
        v_data_venc := to_char((now() + interval '30 days'), 'YYYY-MM-DD');
        INSERT INTO contas_receber (nro_docto, tipo_docto, seq_docto, codigo_cliente, data_docto, data_vencimento,
          valor_docto, valor_original, situacao_docto, numero_caixa, numero_turno, usuario, data_atualizacao, hora_atualizacao)
        VALUES (v_orcamento, 'VD', '001', p_venda->>'codigo_cliente', v_data, v_data_venc,
          (p_venda->>'valor_total')::numeric, (p_venda->>'valor_total')::numeric, 'A',
          COALESCE(p_venda->>'numero_caixa','001'), COALESCE(p_venda->>'numero_turno','1'),
          p_venda->>'usuario_cadastro', v_data, v_hora);
      ELSIF jsonb_array_length(COALESCE(p_venda->'parcelas','[]'::jsonb)) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_venda->'parcelas')
        LOOP
          INSERT INTO contas_receber (nro_docto, tipo_docto, seq_docto, codigo_cliente, data_docto, data_vencimento,
            valor_docto, valor_original, situacao_docto, numero_caixa, numero_turno, usuario, data_atualizacao, hora_atualizacao)
          VALUES (v_orcamento, 'VD', v_item->>'seq', p_venda->>'codigo_cliente', v_data, v_item->>'data_vencimento',
            (v_item->>'valor')::numeric, (v_item->>'valor')::numeric, 'A',
            COALESCE(p_venda->>'numero_caixa','001'), COALESCE(p_venda->>'numero_turno','1'),
            p_venda->>'usuario_cadastro', v_data, v_hora);
        END LOOP;
      END IF;
    END IF;

    -- Cartão de crédito: gera lançamento em Contas a Receber apenas para acompanhamento
    -- (o repasse é automático da operadora todo mês — não precisa de confirmação manual).
    IF COALESCE((p_venda->>'valor_pago_cartao_credito')::numeric,0) > 0 THEN
      INSERT INTO contas_receber (nro_docto, tipo_docto, seq_docto, codigo_cliente, data_docto, data_vencimento,
        valor_docto, valor_original, situacao_docto, numero_caixa, numero_turno, usuario, data_atualizacao, hora_atualizacao)
      VALUES (v_orcamento, 'CC', '001', p_venda->>'codigo_cliente', v_data,
        to_char((now() + interval '30 days'), 'YYYY-MM-DD'),
        (p_venda->>'valor_pago_cartao_credito')::numeric, (p_venda->>'valor_pago_cartao_credito')::numeric, 'A',
        COALESCE(p_venda->>'numero_caixa','001'), COALESCE(p_venda->>'numero_turno','1'),
        p_venda->>'usuario_cadastro', v_data, v_hora);
    END IF;
  END IF;

  RETURN v_orcamento;
END;
$function$;

-- DROP FUNCTION apaga os GRANTs junto — reaplica as mesmas permissões que a
-- função original já tinha (conferidas antes de rodar esta migração), senão
-- toda venda passa a falhar com "permission denied" depois da troca.
GRANT EXECUTE ON FUNCTION public.vendas_salvar(jsonb, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.vendas_salvar(jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vendas_salvar(jsonb, jsonb) TO service_role;
