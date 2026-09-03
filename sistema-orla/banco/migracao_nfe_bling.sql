-- Suporte à emissão automática de NF-e via API da Bling a partir da tela
-- Fiscal > NF-e. numero_nfe já existia (preenchido manualmente); os campos
-- abaixo guardam o rastro da emissão automática: id da nota lá na Bling
-- (necessário pra consultar status depois), o código de situação (1=Pendente,
-- 4=Rejeitada, 5=Autorizada, 9=Denegada, etc. — ver Bling), o link do DANFE
-- pra impressão, e o erro da última tentativa (se falhou), pra mostrar na tela
-- em vez de deixar a secretária sem explicação.
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS nfe_bling_id BIGINT;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS nfe_situacao INTEGER;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS nfe_link_danfe TEXT;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS nfe_erro TEXT;
