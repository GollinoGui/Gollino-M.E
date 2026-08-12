-- Rodar uma única vez no SQL Editor do Supabase (Dashboard > SQL Editor).
-- Cria a tabela de gastos operacionais mensais (fixos + variáveis) usada
-- pelo simulador de Ponto de Equilíbrio em Lucro Real. Gastos FIXO valem
-- todo mês até serem editados/removidos (mes_referencia fica NULL); gastos
-- VARIAVEL são lançados mês a mês (mes_referencia = 'YYYY-MM').

CREATE TABLE IF NOT EXISTS gastos_operacionais (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('FIXO', 'VARIAVEL')),
  descricao TEXT NOT NULL,
  valor DOUBLE PRECISION NOT NULL DEFAULT 0,
  mes_referencia TEXT,
  situacao TEXT NOT NULL DEFAULT 'A',
  usuario TEXT,
  data_atualizacao TEXT,
  hora_atualizacao TEXT
);

CREATE INDEX IF NOT EXISTS idx_gastos_operacionais_tipo_mes ON gastos_operacionais(tipo, mes_referencia, situacao);

ALTER TABLE gastos_operacionais ENABLE ROW LEVEL SECURITY;

-- Gateado direto na RLS (não só na tela) porque a tabela guarda valor de
-- aluguel/salário/meta de lucro — dado sensível que não deve ficar visível
-- pra nível operacional mesmo que alguém acesse a API diretamente.
CREATE POLICY "gastos_operacionais_nivel_alto" ON gastos_operacionais
  FOR ALL TO authenticated
  USING (nivel_atual() >= 250)
  WITH CHECK (nivel_atual() >= 250);
