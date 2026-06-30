-- ============================================================
-- AvaliaPro — Migration 004
-- Marca de revisão do professor na submissão.
-- Diferencia "nota da IA" de "nota validada pelo professor".
-- ============================================================

ALTER TABLE submissoes ADD COLUMN IF NOT EXISTS revisado boolean NOT NULL DEFAULT false;
