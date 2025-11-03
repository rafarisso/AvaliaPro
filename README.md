# 🧠 AvaliaPro

**AvaliaPro** é uma plataforma web voltada a professores e escolas, que automatiza a criação, organização e análise de **avaliações, planos de aula e relatórios pedagógicos**.  
O sistema utiliza **Inteligência Artificial** para gerar conteúdos educativos, rubricas, slides e avaliações adaptadas, otimizando o tempo do educador.

---

## 🚀 Tecnologias

- **Frontend:** [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilo:** [TailwindCSS](https://tailwindcss.com/)
- **Backend:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + RLS)
- **Deploy:** [Netlify](https://www.netlify.com/)
- **Integrações futuras:** [Stripe](https://stripe.com/br) para assinatura mensal e IA via [Google Gemini](https://aistudio.google.com/)

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

## 🧩 Principais Tabelas no Supabase

| Tabela | Função |
|--------|--------|
| **users** | Usuários autenticados (professores) |
| **profiles** | Dados do usuário (nome, escola, disciplinas) |
| **assessments** | Avaliações criadas |
| **assessment_items** | Questões de cada avaliação |
| **assessment_keys** | Gabaritos automáticos |
| **rubrics** | Rubricas de avaliação |
| **students** | Lista de alunos importados |
| **lesson_plans** | Planos de aula gerados |
| **reports** | Relatórios pedagógicos |
| **notifications_queue** | Mensagens do sistema |
| **app_settings** | Configurações do app |
| **audit_logs** | Logs e auditorias automáticas |
| **metrics_dau** | Métricas de uso diário (Daily Active Users) |
| **next_best_action** | Sugestões automáticas de ação do sistema |
