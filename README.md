# 📚 AvaliaPro

**App inteligente para professores**, projetado para facilitar a criação de avaliações, planos de aula, relatórios e atividades com auxílio de **Inteligência Artificial (Gemini AI)** e integração com **Supabase**.  
Desenvolvido em **React + TypeScript (Vite)** e totalmente preparado para deploy automático via **Netlify**.

---

## 🚀 Demonstração

🔗 [https://avaliapro.netlify.app](https://avaliapro.netlify.app)

*(Site em produção — integrado ao Google Gemini e Supabase para geração de conteúdo dinâmico.)*

---

## 🧠 Sobre o projeto

O **AvaliaPro** foi criado para ajudar professores e escolas a otimizar suas rotinas pedagógicas, utilizando recursos de IA para gerar e organizar conteúdos de forma simples e segura.  
Com arquitetura **multi-tenant**, cada escola pode ter seu próprio espaço de dados, mantendo privacidade e escalabilidade.

### ✨ Funcionalidades
- 🧩 Criação de **avaliações automáticas** via Gemini AI  
- 📝 Geração de **planos de aula inteligentes**  
- 📊 Armazenamento de dados e arquivos no **Supabase**  
- 👩‍🏫 Interface intuitiva voltada para **educadores**  
- ⚡ Deploy contínuo e hospedagem estática em **Netlify**

---

## 🛠️ Tecnologias utilizadas

| Categoria | Ferramenta |
|------------|-------------|
| Front-end | React + TypeScript (Vite) |
| Backend / Banco | Supabase |
| IA Generativa | Google Gemini API |
| Deploy | Netlify |
| UI / Estilo | CSS nativo + Poppins Font |
| Autenticação | Supabase Auth |
| Versionamento | Git + GitHub |

---

## 🧩 Estrutura do projeto

AvaliaPro/
├── public/ # Logos, favicon e arquivo _redirects
├── src/ # Código-fonte React + serviços
│ ├── components/ # Componentes reutilizáveis
│ ├── pages/ # Páginas principais
│ └── services/ # Integrações (Supabase, Gemini)
├── index.html # Ponto de entrada da aplicação
├── package.json # Dependências e scripts
├── vite.config.ts # Configuração do Vite
└── tsconfig.json # Tipagem do TypeScript


---

## ⚙️ Como rodar localmente

```bash
# 1. Clone o repositório
git clone https://github.com/rafarisso/AvaliaPro.git

# 2. Entre na pasta
cd AvaliaPro

# 3. Instale as dependências
npm install

# 4. Crie um arquivo .env.local com as chaves:
VITE_SUPABASE_URL=https://seuprojeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
GEMINI_API_KEY=sua_chave_google_ai

# 5. Rode em modo de desenvolvimento
npm run dev


Acesse no navegador:
👉 http://localhost:5173
