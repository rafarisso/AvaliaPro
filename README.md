# 🧠 AvaliaPro

**AvaliaPro** é uma plataforma web voltada a professores, que automatiza a
**criação e a correção** de avaliações, além de gerar **slides** e **planos de
aula**. O sistema usa **Inteligência Artificial** (Google Gemini) para gerar
conteúdos e para **corrigir provas manuscritas** — objetivas e dissertativas —
via OCR, otimizando o tempo do educador.

> O objetivo é uma ferramenta que rode **liso, sem erros**, e seja útil de fato
> na rotina do professor.

---

## 🚀 Tecnologias

- **Frontend:** [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilo:** [TailwindCSS](https://tailwindcss.com/)
- **Backend:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + RLS)
- **Deploy:** [Netlify](https://www.netlify.com/)
- **IA:** [Azure OpenAI](https://azure.microsoft.com/products/ai-services/openai-service) (deployment `o4-mini`) — geração de provas e correção (OCR via visão do próprio modelo)
- **Integrações futuras:** [Stripe](https://stripe.com/br) para assinatura mensal

---

## 🧰 Estrutura de Pastas

AvaliaPro/

├── public/

│ ├── AvaliaPro_logo.svg

│ ├── env.js # contém VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

│ └── _redirects # SPA redirect Netlify

├── src/

│ ├── pages/ # LandingPage, Dashboard, Login, Register, etc.

│ ├── hooks/ # useAuth, useAI, useSupabase

│ ├── services/ # ai.ts, supabaseClient.ts

│ ├── components/ # componentes reutilizáveis

│ └── types/ # definições TypeScript (Assessment, User, Rubric, etc.)

├── index.html

├── package.json

└── vite.config.ts



---

## 🧩 Banco de dados (Supabase)

> ⚠️ **Importante:** o banco tem tabelas duplicadas de iterações antigas. Em
> 2026-06-29 o projeto foi consolidado no **modelo em português**
> (`avaliacoes`/`questoes`), com ownership por **professor individual**
> (`criado_por = auth.uid()`) e RLS em tudo.
>
> Antes de mexer no schema ou no código de dados, leia **[`CLAUDE.md`](./CLAUDE.md)**
> e **[`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md)**.

### Modelo canônico (use este)

| Tabela | Função |
|--------|--------|
| **avaliacoes** | Avaliações/provas criadas pelo professor |
| **questoes** | Questões da avaliação (com `resposta_correta` por questão) |
| **turmas** | Turmas do professor |
| **alunos** | Alunos de cada turma |
| **aplicacoes** | Avaliação aplicada a uma turma (evento da prova) |
| **submissoes** | Prova escaneada de um aluno (Storage + status do OCR + nota) |
| **respostas_aluno** | Resultado do OCR questão a questão |
| **rubrics** | Rubricas de avaliação |

### Deprecado (não usar em código novo)

`assessments`, `assessment_items`, `assessment_keys`, `students` — substituídos
pelo modelo acima. Mantidos por ora para não perder dados.

> Migrations versionadas em `supabase/migrations/`.
