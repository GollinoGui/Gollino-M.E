-- Trava otimista (versionamento) na edição de produtos.
--
-- Hoje `produtos.salvar` faz um upsert direto do navegador com a linha
-- inteira que estava carregada na tela. Se duas pessoas abrirem o mesmo
-- produto ao mesmo tempo — ou se uma editar o cadastro enquanto uma venda
-- desconta o estoque desse mesmo produto no meio do caminho — quem salvar
-- por último sobrescreve silenciosamente o que a outra operação gravou,
-- sem erro e sem aviso.
--
-- Esta RPC troca esse upsert por um UPDATE condicional: só grava se a
-- versão que a tela carregou (p_versao_esperada) ainda for a versão atual
-- no banco. Se não for, devolve {conflito: true} em vez de gravar por
-- cima — a tela recarrega os dados atuais e pede pro usuário refazer a
-- edição em cima do valor mais recente.
--
-- Só escreve os campos que a tela de cadastro realmente edita (ver
-- `formVazio` em Produtos.jsx). Campos operacionais que outras rotinas
-- possuem — estoque por venda (vendas_salvar), quantidade_vendas,
-- data_ultima_venda etc. — não fazem parte do SET, então um cadastro
-- salvo com o formulário desatualizado não pode mais pisar neles.
--
-- Limitação conhecida: a versão só é incrementada por esta RPC. Um
-- writer que não passa por aqui (ex: recalcularEstoqueMinimo, que ajusta
-- estoque_minimo direto em lote uma vez por mês) não bloqueia nem é
-- bloqueado por uma edição de cadastro concorrente sobre o mesmo campo —
-- essa é uma janela de colisão bem mais rara (processo em lote, não uso
-- interativo) e fica fora do escopo desta migração.

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS versao INTEGER NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION public.produtos_salvar(p_produto jsonb, p_versao_esperada integer DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_codigo text := p_produto->>'codigo';
  v_existe boolean;
  v_versao_nova integer;
BEGIN
  SELECT EXISTS(SELECT 1 FROM produtos WHERE codigo = v_codigo) INTO v_existe;

  IF v_existe THEN
    UPDATE produtos SET
      descricao = p_produto->>'descricao',
      descricao_menor = p_produto->>'descricao_menor',
      codigo_grupo = p_produto->>'codigo_grupo',
      codigo_linha = p_produto->>'codigo_linha',
      unidade = p_produto->>'unidade',
      ean = p_produto->>'ean',
      ncm = p_produto->>'ncm',
      codigo_cest = p_produto->>'codigo_cest',
      preco_venda_vista = COALESCE((p_produto->>'preco_venda_vista')::numeric, 0),
      preco_venda_prazo = COALESCE((p_produto->>'preco_venda_prazo')::numeric, 0),
      preco_custo_atual = COALESCE((p_produto->>'preco_custo_atual')::numeric, 0),
      estoque_atual = COALESCE((p_produto->>'estoque_atual')::numeric, 0),
      estoque_minimo = COALESCE((p_produto->>'estoque_minimo')::numeric, 0),
      cfop_cfe = COALESCE(p_produto->>'cfop_cfe', '5405'),
      csosn = p_produto->>'csosn',
      origem_mercadoria = COALESCE(p_produto->>'origem_mercadoria', '0'),
      aliquota_icms = COALESCE((p_produto->>'aliquota_icms')::numeric, 0),
      aliquota_pis = COALESCE((p_produto->>'aliquota_pis')::numeric, 0),
      aliquota_cofins = COALESCE((p_produto->>'aliquota_cofins')::numeric, 0),
      situacao_produto = COALESCE(p_produto->>'situacao_produto', 'A'),
      controla_estoque = COALESCE(p_produto->>'controla_estoque', 'S'),
      observacao = p_produto->>'observacao',
      versao = versao + 1,
      data_atualizacao = to_char(now(), 'YYYY-MM-DD'),
      hora_atualizacao = to_char(now(), 'HH24:MI:SS')
    WHERE codigo = v_codigo
      AND (p_versao_esperada IS NULL OR versao = p_versao_esperada)
    RETURNING versao INTO v_versao_nova;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('sucesso', false, 'conflito', true);
    END IF;
  ELSE
    v_versao_nova := 1;
    INSERT INTO produtos (
      codigo, descricao, descricao_menor, codigo_grupo, codigo_linha, unidade,
      ean, ncm, codigo_cest, preco_venda_vista, preco_venda_prazo, preco_custo_atual,
      estoque_atual, estoque_minimo, cfop_cfe, csosn, origem_mercadoria,
      aliquota_icms, aliquota_pis, aliquota_cofins, situacao_produto, controla_estoque,
      observacao, versao, data_atualizacao, hora_atualizacao
    ) VALUES (
      v_codigo, p_produto->>'descricao', p_produto->>'descricao_menor',
      p_produto->>'codigo_grupo', p_produto->>'codigo_linha', p_produto->>'unidade',
      p_produto->>'ean', p_produto->>'ncm', p_produto->>'codigo_cest',
      COALESCE((p_produto->>'preco_venda_vista')::numeric, 0),
      COALESCE((p_produto->>'preco_venda_prazo')::numeric, 0),
      COALESCE((p_produto->>'preco_custo_atual')::numeric, 0),
      COALESCE((p_produto->>'estoque_atual')::numeric, 0),
      COALESCE((p_produto->>'estoque_minimo')::numeric, 0),
      COALESCE(p_produto->>'cfop_cfe', '5405'),
      p_produto->>'csosn',
      COALESCE(p_produto->>'origem_mercadoria', '0'),
      COALESCE((p_produto->>'aliquota_icms')::numeric, 0),
      COALESCE((p_produto->>'aliquota_pis')::numeric, 0),
      COALESCE((p_produto->>'aliquota_cofins')::numeric, 0),
      COALESCE(p_produto->>'situacao_produto', 'A'),
      COALESCE(p_produto->>'controla_estoque', 'S'),
      p_produto->>'observacao',
      v_versao_nova,
      to_char(now(), 'YYYY-MM-DD'), to_char(now(), 'HH24:MI:SS')
    );
  END IF;

  RETURN jsonb_build_object('sucesso', true, 'conflito', false, 'versao', v_versao_nova);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.produtos_salvar(jsonb, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.produtos_salvar(jsonb, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.produtos_salvar(jsonb, integer) TO service_role;
