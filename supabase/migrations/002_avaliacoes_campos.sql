-- ============================================================
-- AvaliaPro — Migration 002
-- Campos extras em avaliacoes/questoes usados pelo formulário
-- de criação de provas (NovaAvaliacao.tsx).
-- ============================================================

ALTER TABLE avaliacoes
  ADD COLUMN IF NOT EXISTS nivel           text,
  ADD COLUMN IF NOT EXISTS dificuldade     text,
  ADD COLUMN IF NOT EXISTS tipo            text,
  ADD COLUMN IF NOT EXISTS enunciado_geral text,
  ADD COLUMN IF NOT EXISTS valor_total     numeric(6,2);

-- ordem é importante para exibir/corrigir as questões na sequência certa
ALTER TABLE questoes
  ADD COLUMN IF NOT EXISTS ordem int NOT NULL DEFAULT 1;
