# AvaliaPro — Guia para desenvolvedores e agentes de IA

> Leia este arquivo **antes** de mexer no projeto. Ele descreve a intenção do
> produto e o **estado real** do banco/código hoje — que difere do que o
> README histórico sugere.

## O que é o AvaliaPro

App web para **professores** criarem e **corrigirem** avaliações, além de gerar
**slides** e **planos de aula**. O objetivo é facilitar a rotina do professor:
deve rodar **liso, sem erros** e ser genuinamente útil no dia a dia.

Funções previstas no ciclo do professor:
1. **Criar** avaliações (com IA), planos de aula e slides — *parcialmente pronto*
2. **Aplicar** a prova a uma turma — *schema pronto, UI a fazer*
3. **Corrigir** provas manuscritas (objetivas + dissertativas) via **OCR/IA** — *em construção*
4. **Analisar** desempenho por turma/aluno — *a fazer*

## Stack

- **Front:** Vite + React 19 + TypeScript + TailwindCSS
- **Back:** Supabase (PostgreSQL + Auth + RLS) — projeto `mivwewweekxkawovceqx`
- **Serverless:** Netlify Functions (`netlify/functions/`)
- **IA:** **Azure OpenAI** — deployment `o4-mini` (recurso `avaliapro-openai`, região eastus). Usado para **gerar questões** e para o **OCR de correção** (o `o4-mini` lê imagem direto, então NÃO precisamos de Azure Document Intelligence). Acesso centralizado em `netlify/functions/lib/azureOpenAI.ts`.
  - ⚠️ `o4-mini` é modelo de raciocínio: **não** aceita `temperature`/`top_p` e o raciocínio consome tokens — use `max_completion_tokens` folgado (correção: 16000; geração: 8000).
  - Migrado do Google Gemini em 2026-06-29. `GEMINI_API_KEY`/`VITE_GEMINI_MODEL` não são mais usados pelo código.
- **Deploy:** Netlify. Variáveis ficam no painel do Netlify, **não** no repositório:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — front
  - `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY` (secret), `AZURE_OPENAI_DEPLOYMENT` (`o4-mini`), `AZURE_OPENAI_API_VERSION` (`2024-12-01-preview`) — geração de questões e correção OCR. **Nunca** com prefixo `VITE_`.
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — **usadas pela função `corrigir-prova`** para ler Storage e gravar correção ignorando RLS. A service role key vem de Supabase → Settings → API → `service_role`. **Nunca** exponha essa key no front.

## ⚠️ Estado atual — leia com atenção

O banco passou por mais de uma iteração e tem **~28 tabelas**, várias delas
duplicadas/abandonadas (nomes em português E inglês para a mesma coisa). Em
**2026-06-29** decidimos consolidar e padronizar:

### Modelo de dados canônico (USE ESTE)

Português, ownership por **professor individual** (`criado_por = auth.uid()`):

```
avaliacoes ──< questoes
turmas ──< alunos
avaliacoes + turmas ──< aplicacoes ──< submissoes ──< respostas_aluno
```

| Tabela | Papel |
|---|---|
| `avaliacoes` | Avaliação/prova criada pelo professor (dono = `criado_por`) |
| `questoes` | Questões da avaliação. Tem `resposta_correta` por questão — base da correção |
| `turmas` | Turmas do professor (dono = `criado_por`) |
| `alunos` | Alunos de uma turma (ownership via `turma_id`) |
| `aplicacoes` | Avaliação aplicada a uma turma (o "evento" da prova) |
| `submissoes` | Prova **escaneada** de um aluno (URLs no Storage, status do OCR, nota) |
| `respostas_aluno` | Resultado do OCR questão a questão (resposta lida, acerto, pontos, confiança, feedback) |

Todas com **RLS ligado** — o professor só enxerga o que é dele. Ver as regras em
`supabase/migrations/001_schema_inicial.sql`.

### DEPRECADO (NÃO use, NÃO crie código novo apontando pra cá)

- `assessments`, `assessment_items`, `assessment_keys` (modelo inglês antigo)
- `avaliacoes`/`questoes` substituem esses. Não apague ainda (pode haver dados),
  mas todo código novo deve usar o modelo canônico acima.

### Estado do fluxo de criação

`src/pages/avaliacoes/NovaAvaliacao.tsx` já **salva em `avaliacoes` + `questoes`**
(migrado em 2026-06-29). O `criado_por` é setado com `user.id` (necessário pro
RLS) e objetivas exigem alternativa correta marcada antes de salvar. Geração de
questões com IA e exportação PDF continuam iguais.

## Convenções

- **Nomes em português** no modelo canônico: colunas `criado_por` (uuid do dono),
  `criado_em` (timestamptz).
- **Ownership** sempre por `criado_por = auth.uid()` (ou via relação, ex.: aluno
  herda da turma). Nunca por escola — `escola_id` existe mas é opcional/legado.
- Toda tabela nova nasce com **RLS habilitado** e policy de dono.

## Roadmap do OCR (correção de provas)

1. ✅ Schema (`aplicacoes`/`submissoes`/`respostas_aluno`) — migrations 001/002
2. ✅ Migrar criação de prova para `avaliacoes`/`questoes`
3. ✅ Bucket `provas-escaneadas` no Storage (privado, pasta `auth.uid()/`) — migration 003
4. ✅ Netlify Function `corrigir-prova` (`netlify/functions/corrigir-prova.ts`): recebe `submissao_id` → baixa imagens do Storage, manda gabarito + imagens ao Gemini Vision, grava `respostas_aluno` e fecha a `submissao` (nota/status). **Requer `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` no Netlify.**
5. ✅ UI de correção (ciclo completo):
   - Turmas/alunos (`src/pages/turmas/TurmasPage.tsx`, `/turmas`)
   - Aplicar avaliação (`src/pages/aplicacoes/AplicacoesPage.tsx`, `/aplicacoes`) → cria `aplicacao`
   - Correção (`src/pages/correcao/CorrecaoPage.tsx`, `/correcao/:aplicacaoId`): por aluno, upload de foto → Storage `{uid}/{aplicacao}/{aluno}/` → cria `submissao` → chama `corrigir-prova` (via `src/services/correcao.ts`) → mostra nota e resultado por questão.
6. ⬜ Dashboard de desempenho por turma/aluno

> **Para testar o OCR de verdade é preciso DEPLOY (push no `main`).** A função
> `corrigir-prova` só existe no Netlify após o push, e a `SUPABASE_SERVICE_ROLE_KEY`
> está só nos contextos não-dev — então `netlify dev` local não corrige (só a UI,
> turmas, upload pro Storage funcionam local). A correção roda em produção.

## Onde olhar

- Migrations / schema: `supabase/migrations/`
- Detalhes de arquitetura e decisões: `docs/ARQUITETURA.md`
- Geração com IA: `services/ai.ts` e `netlify/functions/generate-*.ts`
