# Arquitetura & decisões — AvaliaPro

Documento de referência do estado do banco e das decisões tomadas. Atualizado em
**2026-06-29**.

## Visão de produto

AvaliaPro ajuda professores a **criar e corrigir** avaliações, e a gerar
**slides** e **planos de aula**. Meta: rodar sem erros e economizar tempo do
professor. O diferencial em construção é a **correção automática de provas
manuscritas** (objetivas e dissertativas) por OCR + IA (Gemini Vision).

## O problema dos dois modelos de dados

O banco Supabase (`mivwewweekxkawovceqx`) acumulou ~28 tabelas de iterações
diferentes, com **dois modelos paralelos** para a mesma coisa:

| Conceito | Modelo PT (escolhido) | Modelo EN (deprecado) |
|---|---|---|
| Prova | `avaliacoes` | `assessments` |
| Questão | `questoes` | `assessment_items` (questões num blob `json`) |
| Gabarito | `questoes.resposta_correta` (por questão) | `assessment_keys` (jsonb) |
| Aluno | `alunos` (via `turma_id`) | `students` (via `user_id`) |
| Escola | `escolas` | `schools` |
| Usuário | `usuarios` | `profiles` |

### Decisão (2026-06-29)

- **Consolidar no modelo PT (`avaliacoes`/`questoes`)**. Motivo: é mais completo
  e normalizado, e `questoes` já tem `resposta_correta` por questão — exatamente
  o que a correção por OCR precisa. O modelo EN guardava questões num blob `json`,
  ruim para comparar respostas.
- **Ownership por professor individual**: `criado_por = auth.uid()`. (A opção
  "por escola" via `escola_id` foi descartada; a coluna continua existindo, mas
  opcional/legada.)
- Tabelas EN ficam **deprecadas** — não remover ainda (podem ter dados), mas
  nenhum código novo deve usá-las.

## Schema canônico

### Tabelas existentes (reaproveitadas)

**`avaliacoes`** — `id, titulo, disciplina, serie, tema, total_questoes,
objetivas, dissertativas, valor_questao, frase_incentivo, assinatura_professor,
escola_id (opcional), criado_por, arquivo_docx, arquivo_pdf, arquivo_gabarito,
criado_em`

**`questoes`** — `id, avaliacao_id, tipo, enunciado, alternativas (jsonb),
resposta_correta, valor, escola_id (opcional)`

**`turmas`** — `id, nome, serie, escola_id (opcional), criado_por, criado_em`

**`alunos`** — `id, nome, turma_id, escola_id (opcional), matricula, criado_em`

### Tabelas novas (ciclo de correção/OCR) — migration 001

**`aplicacoes`** — avaliação aplicada a uma turma (evento da prova).
`id, avaliacao_id, turma_id, criado_por, data_aplicacao, criado_em`.
Único por `(avaliacao_id, turma_id)`.

**`submissoes`** — prova escaneada de um aluno.
`id, aplicacao_id, aluno_id, imagens_urls (text[]), status, nota_final,
ocr_raw (jsonb), corrigido_em, criado_em`.
`status ∈ {pendente, processando, corrigida, erro}`.
`imagens_urls` aponta para o Storage; `ocr_raw` guarda a resposta bruta do
Gemini para auditoria.

**`respostas_aluno`** — resultado da correção, questão a questão.
`id, submissao_id, questao_id, resposta_extraida, correta, pontos_obtidos,
confianca, feedback_ia, criado_em`. Único por `(submissao_id, questao_id)`.

### Relações

```
avaliacoes 1──N questoes
turmas     1──N alunos
avaliacoes 1──N aplicacoes   N──1 turmas
aplicacoes 1──N submissoes   N──1 alunos
submissoes 1──N respostas_aluno N──1 questoes
```

## Segurança (RLS)

Todas as tabelas do modelo canônico têm **RLS habilitado**, com política `FOR ALL`
(leitura e escrita) baseada no dono:

- `avaliacoes`, `turmas`, `aplicacoes`: `criado_por = auth.uid()`
- `questoes`: via `avaliacao_id` → `avaliacoes.criado_por`
- `alunos`: via `turma_id` → `turmas.criado_por`
- `submissoes`: via `aplicacao_id` → `aplicacoes.criado_por`
- `respostas_aluno`: via `submissao_id` → `submissoes` → `aplicacoes.criado_por`

A correção (Netlify Function) deve usar a **service role key** para escrever em
`submissoes`/`respostas_aluno` (a service role ignora RLS). O professor lê esses
dados no app via as políticas acima.

> Observação: ao ligar o RLS, linhas antigas com `criado_por` nulo deixam de
> aparecer no app. Aceitável — eram dados de teste de iterações anteriores.

## Implantação do OCR — plano

1. ✅ **Migrar criação de prova** (`NovaAvaliacao.tsx`) de `assessments` para
   `avaliacoes` + `questoes` — feito em 2026-06-29. Objetivas exigem gabarito
   marcado; `criado_por = user.id`.
2. ✅ **Storage**: bucket privado `provas-escaneadas`, upload restrito à pasta
   `auth.uid()/` (migration 003).
3. ✅ **Netlify Function `corrigir-prova`** (`netlify/functions/corrigir-prova.ts`):
   - Entrada: `{ submissao_id }`.
   - Carrega `submissoes` → `aplicacoes` → `questoes` da avaliação.
   - Baixa as imagens do Storage (service role) e manda + gabarito ao Gemini
     Vision com prompt de extração estruturada (JSON por questão: resposta lida,
     acerto, pontos, confiança, feedback; dissertativas com nota parcial).
   - Grava `respostas_aluno` (upsert) e atualiza `submissoes` (`nota_final`,
     `status='corrigida'`, `ocr_raw`, `corrigido_em`). Em falha, `status='erro'`.
   - **Env necessárias no Netlify:** `GEMINI_API_KEY`, `SUPABASE_URL`,
     `SUPABASE_SERVICE_ROLE_KEY`.
4. ✅ **UI de correção** (ciclo completo, 2026-06-29):
   - `src/pages/turmas/TurmasPage.tsx` (`/turmas`) — turmas e alunos.
   - `src/pages/aplicacoes/AplicacoesPage.tsx` (`/aplicacoes`) — cria `aplicacao`
     (avaliação × turma).
   - `src/pages/correcao/CorrecaoPage.tsx` (`/correcao/:aplicacaoId`) — por aluno:
     upload de foto(s) ao Storage, cria `submissao`, chama `corrigir-prova`
     (`src/services/correcao.ts`), exibe nota e correção por questão.
   - ⚠️ A correção real exige o app **publicado** (push no `main`): a função e a
     service role só estão disponíveis em produção.
5. ⬜ **Dashboard de desempenho** por turma/aluno/questão.

## Histórico de migrations

- `supabase/migrations/001_schema_inicial.sql` — consolidação no modelo PT,
  ownership por professor, RLS, e tabelas `aplicacoes`/`submissoes`/
  `respostas_aluno`. Aplicada em 2026-06-29.
- `supabase/migrations/002_avaliacoes_campos.sql` — colunas extras em
  `avaliacoes` (`nivel`, `dificuldade`, `tipo`, `enunciado_geral`, `valor_total`)
  e `questoes.ordem`, usadas pelo formulário de criação. Aplicada em 2026-06-29.
- `supabase/migrations/003_storage_provas.sql` — bucket privado
  `provas-escaneadas` + policies de Storage por professor. Aplicada em 2026-06-29.
