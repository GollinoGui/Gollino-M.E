-- AINDA NÃO aplicada — cole este SQL completo no Supabase Studio (Database >
-- SQL Editor) e rode antes de usar o botão "Completar entrada"/"Solicitar
-- complemento" no app.
--
-- Permite a um usuário nível 250 (super/admin) reabrir uma entrada de
-- mercadoria JÁ CONFIRMADA e adicionar os itens/faturas que ficaram de fora
-- (ex.: secretária confirmou a entrada #081 com só 1 dos 5 itens da nota,
-- sem fatura nenhuma). Só ADICIONA — nunca edita/remove o que já foi
-- confirmado, porque reverter custo médio já aplicado é arriscado se já
-- houve venda do produto depois.
--
-- A lógica de custo médio ponderado, atualização de preço e o formato do
-- INSERT em contas_pagar são copiados literalmente de
-- entrada_mercadoria_confirmar (colado pelo usuário em 2026-08-24) — só o
-- cabeçalho muda de INSERT (nota nova) pra UPDATE incremental (soma aos
-- totais já existentes), e a validação de "faturas batem com itens" passa a
-- conferir o total ACUMULADO da entrada (existente + o que está sendo
-- adicionado agora), não só o desta chamada — assim dá pra completar os
-- itens numa chamada e a fatura noutra, sem forçar as duas a baterem sozinhas.

ALTER TABLE entradas_mercadoria
  ADD COLUMN IF NOT EXISTS editado_por TEXT,
  ADD COLUMN IF NOT EXISTS editado_em TEXT;

CREATE OR REPLACE FUNCTION public.entrada_mercadoria_completar(
  p_numero text,
  p_itens jsonb,
  p_faturas jsonb,
  p_usuario text
)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_entrada record;
  v_data text := to_char(now(), 'YYYY-MM-DD');
  v_hora text := to_char(now(), 'HH24:MI:SS');
  v_item jsonb;
  v_fatura jsonb;
  v_qty numeric;
  v_custo numeric;
  v_venda_vista numeric;
  v_venda_prazo numeric;
  v_rateio numeric;
  v_itens_novo numeric := 0;
  v_faturas_novo numeric := 0;
  v_previsao_novo numeric := 0;
BEGIN
  IF nivel_atual() < 250 THEN
    RAISE EXCEPTION 'Nível de acesso insuficiente para completar entrada de mercadoria.';
  END IF;

  SELECT * INTO v_entrada FROM entradas_mercadoria WHERE numero = p_numero FOR UPDATE;
  IF v_entrada IS NULL THEN
    RAISE EXCEPTION 'Entrada de mercadoria % não encontrada.', p_numero;
  END IF;

  IF (p_itens IS NULL OR jsonb_array_length(p_itens) = 0)
     AND (p_faturas IS NULL OR jsonb_array_length(p_faturas) = 0) THEN
    RAISE EXCEPTION 'Informe ao menos um item ou fatura para completar a entrada.';
  END IF;

  -- Passo 1: soma o que está sendo adicionado agora (não confia no que o
  -- front somou — mesmo espírito de entrada_mercadoria_confirmar).
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_itens, '[]'::jsonb)) LOOP
    v_qty := (v_item->>'quantidade')::numeric;
    v_custo := COALESCE((v_item->>'preco_custo')::numeric, 0);
    v_rateio := COALESCE((v_item->>'rateio_despesas')::numeric, 0);
    v_venda_vista := COALESCE((v_item->>'preco_venda_vista')::numeric, 0);
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Item "%" com quantidade inválida.', COALESCE(v_item->>'descricao', v_item->>'codigo_produto');
    END IF;
    v_itens_novo := v_itens_novo + (v_qty * v_custo) + v_rateio;
    v_previsao_novo := v_previsao_novo + ((v_venda_vista - v_custo) * v_qty);
  END LOOP;

  FOR v_fatura IN SELECT * FROM jsonb_array_elements(COALESCE(p_faturas, '[]'::jsonb)) LOOP
    v_faturas_novo := v_faturas_novo + COALESCE((v_fatura->>'valor_docto')::numeric, 0);
  END LOOP;

  -- Passo 2: concilia contra o total ACUMULADO da entrada (já lançado + o
  -- que está entrando agora), só quando alguma fatura está sendo adicionada
  -- nesta chamada.
  IF (p_faturas IS NOT NULL AND jsonb_array_length(p_faturas) > 0)
     AND abs((v_entrada.valor_total_itens + v_itens_novo) - (v_entrada.valor_total_faturas + v_faturas_novo)) > 0.01 THEN
    RAISE EXCEPTION 'Total das faturas da entrada (%) não bate com o total dos itens da entrada (%).',
      (v_entrada.valor_total_faturas + v_faturas_novo), (v_entrada.valor_total_itens + v_itens_novo);
  END IF;

  -- Passo 3: aplica os itens novos (mesma lógica de custo médio/estoque/preço
  -- de entrada_mercadoria_confirmar).
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_itens, '[]'::jsonb)) LOOP
    v_qty := (v_item->>'quantidade')::numeric;
    v_custo := COALESCE((v_item->>'preco_custo')::numeric, 0);
    v_rateio := COALESCE((v_item->>'rateio_despesas')::numeric, 0);
    v_venda_vista := COALESCE((v_item->>'preco_venda_vista')::numeric, 0);
    v_venda_prazo := COALESCE((v_item->>'preco_venda_prazo')::numeric, 0);

    INSERT INTO entradas_mercadoria_itens (
      numero, codigo_produto, descricao, tipo, quantidade, rateio_despesas,
      preco_custo, preco_venda_vista, preco_venda_prazo, margem_vista, margem_prazo, valor_total
    ) VALUES (
      p_numero, v_item->>'codigo_produto', v_item->>'descricao', v_item->>'tipo', v_qty, v_rateio,
      v_custo, v_venda_vista, v_venda_prazo,
      COALESCE((v_item->>'margem_vista')::numeric, 0), COALESCE((v_item->>'margem_prazo')::numeric, 0),
      (v_qty * v_custo) + v_rateio
    );

    UPDATE produtos SET
      preco_custo_atual = CASE
        WHEN (v_custo + CASE WHEN v_qty > 0 THEN v_rateio / v_qty ELSE 0 END) > 0 AND (GREATEST(estoque_atual,0) + v_qty) > 0
          THEN (GREATEST(estoque_atual,0) * COALESCE(preco_custo_atual,0) + v_qty * (v_custo + CASE WHEN v_qty > 0 THEN v_rateio / v_qty ELSE 0 END)) / (GREATEST(estoque_atual,0) + v_qty)
        ELSE preco_custo_atual
      END,
      preco_venda_vista = CASE WHEN v_venda_vista > 0 THEN v_venda_vista ELSE preco_venda_vista END,
      preco_venda_prazo = CASE WHEN v_venda_prazo > 0 THEN v_venda_prazo ELSE preco_venda_prazo END,
      margem_lucro_preco_vista = CASE WHEN v_venda_vista > 0 THEN COALESCE((v_item->>'margem_vista')::numeric, margem_lucro_preco_vista) ELSE margem_lucro_preco_vista END,
      margem_lucro_preco_prazo = CASE WHEN v_venda_prazo > 0 THEN COALESCE((v_item->>'margem_prazo')::numeric, margem_lucro_preco_prazo) ELSE margem_lucro_preco_prazo END,
      data_ultima_alteracao_preco = CASE WHEN v_custo > 0 OR v_venda_vista > 0 THEN v_data ELSE data_ultima_alteracao_preco END,
      quantidade_entradas = COALESCE(quantidade_entradas,0) + v_qty,
      estoque_atual = estoque_atual + v_qty
    WHERE codigo = v_item->>'codigo_produto';

    INSERT INTO movimentos_estoque (
      tipo, produto_id, produto, quantidade, valor_unitario, total, data, fornecedor, obs,
      usuario, data_atualizacao, hora_atualizacao
    ) VALUES (
      'ENTRADA', v_item->>'codigo_produto', COALESCE(v_item->>'descricao', v_item->>'codigo_produto'), v_qty,
      v_custo, (v_qty * v_custo) + v_rateio, COALESCE(v_entrada.data_entrada, v_data),
      v_entrada.codigo_fornecedor, 'Complemento da entrada de mercadoria #' || p_numero,
      COALESCE(p_usuario, ''), v_data, v_hora
    );
  END LOOP;

  -- Passo 4: aplica as faturas novas (mesmo formato de INSERT em contas_pagar
  -- de entrada_mercadoria_confirmar).
  FOR v_fatura IN SELECT * FROM jsonb_array_elements(COALESCE(p_faturas, '[]'::jsonb)) LOOP
    INSERT INTO contas_pagar (
      codigo_fornecedor, codigo_historico, codigo_plano_conta, nro_docto, tipo_docto,
      chave_nfe, numero_nfe, documento_origem, tipo_origem,
      data_docto, data_vencimento, valor_docto, situacao_docto,
      observacao, usuario, data_atualizacao, hora_atualizacao
    ) VALUES (
      v_entrada.codigo_fornecedor, v_fatura->>'codigo_historico', v_fatura->>'codigo_plano_conta',
      v_fatura->>'nro_docto', 'NF',
      v_entrada.chave_nfe, v_entrada.numero_nota, p_numero, 'ENTRADA_MERCADORIA',
      COALESCE(v_entrada.data_emissao, v_data), v_fatura->>'data_vencimento',
      COALESCE((v_fatura->>'valor_docto')::numeric, 0), 'A',
      v_fatura->>'observacao', COALESCE(p_usuario, ''), v_data, v_hora
    );
  END LOOP;

  -- Passo 5: soma os totais novos ao cabeçalho já existente (em vez de criar
  -- um cabeçalho novo) e marca quem/quando completou.
  UPDATE entradas_mercadoria SET
    valor_total_itens = valor_total_itens + v_itens_novo,
    valor_total_faturas = valor_total_faturas + v_faturas_novo,
    previsao_lucro = previsao_lucro + v_previsao_novo,
    editado_por = p_usuario,
    editado_em = v_data
  WHERE numero = p_numero;
END;
$function$
