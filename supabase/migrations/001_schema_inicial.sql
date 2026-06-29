-- ============================================================
-- AvaliaPro — Migration 001 (final)
-- Consolidação no modelo avaliacoes/questoes
-- Ownership: professor individual (criado_por = auth.uid())
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Ajustes nas tabelas existentes
--    (escola_id deixa de ser obrigatório — dono é o professor)
-- ────────────────────────────────────────────────────────────

ALTER TABLE avaliacoes ALTER COLUMN escola_id DROP NOT NULL;
ALTER TABLE questoes   ALTER COLUMN escola_id DROP NOT NULL;
ALTER TABLE turmas     ALTER COLUMN escola_id DROP NOT NULL;
ALTER TABLE alunos     ALTER COLUMN escola_id DROP NOT NULL;

-- matrícula ajuda o OCR a identificar o aluno na folha
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS matricula text;

-- ────────────────────────────────────────────────────────────
-- 2. Tabelas novas do ciclo de correção / OCR
-- ────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS respostas_aluno CASCADE;
DROP TABLE IF EXISTS submissoes      CASCADE;
DROP TABLE IF EXISTS aplicacoes      CASCADE;

-- Avaliação aplicada a uma turma (o "evento" da prova)
CREATE TABLE aplicacoes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id   uuid NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,
  turma_id       uuid NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  criado_por     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  data_aplicacao date,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (avaliacao_id, turma_id)
);

-- Prova escaneada de um aluno
CREATE TABLE submissoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aplicacao_id  uuid NOT NULL REFERENCES aplicacoes(id) ON DELETE CASCADE,
  aluno_id      uuid REFERENCES alunos(id) ON DELETE SET NULL,
  imagens_urls  text[] NOT NULL DEFAULT '{}',   -- URLs no Storage (bucket provas-escaneadas)
  status        text NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente', 'processando', 'corrigida', 'erro')),
  nota_final    numeric(6,2),
  ocr_raw       jsonb,                          -- resposta bruta do Gemini Vision (auditoria)
  corrigido_em  timestamptz,
  criado_em     timestamptz NOT NULL DEFAULT now()
);

-- Resultado da correção, questão a questão
CREATE TABLE respostas_aluno (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submissao_id      uuid NOT NULL REFERENCES submissoes(id) ON DELETE CASCADE,
  questao_id        uuid NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
  resposta_extraida text,        -- o que o Gemini leu na imagem
  correta           boolean,
  pontos_obtidos    numeric(6,2),
  confianca         numeric(4,3), -- 0.000 a 1.000
  feedback_ia       text,         -- justificativa (dissertativas)
  criado_em         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submissao_id, questao_id)
);

-- ────────────────────────────────────────────────────────────
-- 3. Índices
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_questoes_avaliacao     ON questoes(avaliacao_id);
CREATE INDEX IF NOT EXISTS idx_alunos_turma           ON alunos(turma_id);
CREATE INDEX IF NOT EXISTS idx_aplicacoes_avaliacao   ON aplicacoes(avaliacao_id);
CREATE INDEX IF NOT EXISTS idx_aplicacoes_turma       ON aplicacoes(turma_id);
CREATE INDEX IF NOT EXISTS idx_submissoes_aplicacao   ON submissoes(aplicacao_id);
CREATE INDEX IF NOT EXISTS idx_submissoes_aluno       ON submissoes(aluno_id);
CREATE INDEX IF NOT EXISTS idx_respostas_submissao    ON respostas_aluno(submissao_id);

-- ────────────────────────────────────────────────────────────
-- 4. Row Level Security (dono = professor / criado_por)
-- ────────────────────────────────────────────────────────────

ALTER TABLE avaliacoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE questoes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE aplicacoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_aluno ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS avaliacoes_owner ON avaliacoes;
DROP POLICY IF EXISTS questoes_owner   ON questoes;
DROP POLICY IF EXISTS turmas_owner     ON turmas;
DROP POLICY IF EXISTS alunos_owner     ON alunos;
DROP POLICY IF EXISTS aplicacoes_owner ON aplicacoes;
DROP POLICY IF EXISTS submissoes_owner ON submissoes;
DROP POLICY IF EXISTS respostas_owner  ON respostas_aluno;

CREATE POLICY avaliacoes_owner ON avaliacoes
  FOR ALL
  USING (criado_por = auth.uid())
  WITH CHECK (criado_por = auth.uid());

CREATE POLICY questoes_owner ON questoes
  FOR ALL
  USING      (avaliacao_id IN (SELECT id FROM avaliacoes WHERE criado_por = auth.uid()))
  WITH CHECK (avaliacao_id IN (SELECT id FROM avaliacoes WHERE criado_por = auth.uid()));

CREATE POLICY turmas_owner ON turmas
  FOR ALL
  USING (criado_por = auth.uid())
  WITH CHECK (criado_por = auth.uid());

CREATE POLICY alunos_owner ON alunos
  FOR ALL
  USING      (turma_id IN (SELECT id FROM turmas WHERE criado_por = auth.uid()))
  WITH CHECK (turma_id IN (SELECT id FROM turmas WHERE criado_por = auth.uid()));

CREATE POLICY aplicacoes_owner ON aplicacoes
  FOR ALL
  USING (criado_por = auth.uid())
  WITH CHECK (criado_por = auth.uid());

CREATE POLICY submissoes_owner ON submissoes
  FOR ALL
  USING      (aplicacao_id IN (SELECT id FROM aplicacoes WHERE criado_por = auth.uid()))
  WITH CHECK (aplicacao_id IN (SELECT id FROM aplicacoes WHERE criado_por = auth.uid()));

CREATE POLICY respostas_owner ON respostas_aluno
  FOR ALL
  USING (
    submissao_id IN (
      SELECT s.id FROM submissoes s
      JOIN aplicacoes ap ON ap.id = s.aplicacao_id
      WHERE ap.criado_por = auth.uid()
    )
  )
  WITH CHECK (
    submissao_id IN (
      SELECT s.id FROM submissoes s
      JOIN aplicacoes ap ON ap.id = s.aplicacao_id
      WHERE ap.criado_por = auth.uid()
    )
  );
