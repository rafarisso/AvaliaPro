import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header"
import PrototypeBanner from "../components/PrototypeBanner"
import { useAuth } from "../../hooks/useAuth"
import { getSupabase } from "../services/supabaseClient"
import {
  ClipboardList,
  FileBarChart,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  NotebookPen,
  Presentation,
  Sparkles,
} from "lucide-react"

const quickActions = [
  {
    title: "Criar avaliação",
    description: "Monte em minutos",
    icon: ClipboardList,
    route: "/avaliacoes/nova",
    accent: "from-blue-500/20 via-blue-500/10 to-transparent text-blue-600",
  },
  {
    title: "Plano de aula",
    description: "Organize e compartilhe",
    icon: NotebookPen,
    route: "/plano-aula/novo",
    accent: "from-emerald-500/20 via-emerald-500/10 to-transparent text-emerald-600",
  },
  {
    title: "Modelos prontos",
    description: "Sugestões por disciplina",
    icon: Presentation,
    route: "/modelos",
    accent: "from-purple-500/20 via-purple-500/10 to-transparent text-purple-600",
  },
  {
    title: "Relatórios",
    description: "Acompanhe resultados",
    icon: FileBarChart,
    route: "/relatorios",
    accent: "from-amber-500/20 via-amber-500/10 to-transparent text-amber-600",
  },
]

const stats = [
  { label: "Avaliações criadas", value: "12", trend: "+3 este mês" },
  { label: "Planos ativos", value: "5", trend: "2 aguardando revisão" },
  { label: "Modelos favoritos", value: "8", trend: "+2 adicionados" },
]

const roadmap = [
  {
    title: "Integração com IA",
    description: "Sugestões inteligentes de questões alinhadas à BNCC.",
    icon: Sparkles,
    status: "Em teste",
  },
  {
    title: "Importação de notas",
    description: "Faça upload de planilhas e gere relatórios automaticamente.",
    icon: GraduationCap,
    status: "Planejado",
  },
  {
    title: "Relatórios em PDF",
    description: "Exporte resultados e compartilhe com a equipe pedagógica.",
    icon: Lightbulb,
    status: "Em validação",
  },
]

const quickHelp = [
  "Como estruturar uma avaliação equilibrada",
  "Sugestões de atividades por componente curricular",
  "Melhores práticas para reuniões pedagógicas",
]

export default function Dashboard() {
  const navigate = useNavigate()
  const supabase = getSupabase()
  const { user, logout } = useAuth()

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return
      const uid = data.user?.id
      if (uid) {
        await supabase.from("user_events").insert({ user_id: uid, event: "dashboard_view" })
      }
    })
    return () => {
      active = false
    }
  }, [supabase])

  return (
    <div className="min-h-screen bg-slate-950/5">
      <PrototypeBanner />
      <Header />

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 p-8 text-white shadow-xl">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 translate-x-16 bg-[radial-gradient(circle_at_top,_#ffffff1a,_transparent_65%)] lg:block" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">AvaliaPro</p>
              <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                Um painel inteligente para preparar experiências de aprendizagem memoráveis
              </h1>
              <p className="max-w-2xl text-sm text-blue-100">
                Explore os recursos do protótipo, organize suas turmas e encontre inspirações para avaliações,
                planos e relatórios em poucos cliques.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">Sessão ativa</span>
              <p className="mt-2 text-sm">
                Usuário logado: <strong>{user?.email ?? "visitante@avaliapro.com"}</strong>
              </p>
              {user && (
                <button
                  onClick={logout}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/30"
                >
                  Sair da conta
                </button>
              )}
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{stat.value}</p>
              <p className="mt-2 text-xs font-medium text-blue-600">{stat.trend}</p>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Atalhos rápidos</h2>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Acesso instantâneo</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map(({ icon: Icon, title, description, route, accent }) => (
              <button
                key={title}
                onClick={() => navigate(route)}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 transition group-hover:opacity-100`} />
                <div className="relative z-10 flex flex-col gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/70 text-blue-600 shadow group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <div className="text-base font-semibold text-slate-900">{title}</div>
                    <div className="text-sm text-slate-500">{description}</div>
                  </div>
                  <span className="text-sm font-medium text-blue-600 group-hover:underline">
                    Acessar agora
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Feedback em destaque</h3>
              <p className="mt-2 text-sm text-slate-500">
                Observações dos professores que estão nos ajudando a lapidar o produto.
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex gap-3 rounded-2xl bg-slate-50/80 p-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                  Professores querem mais modelos personalizados por disciplina.
                </li>
                <li className="flex gap-3 rounded-2xl bg-slate-50/80 p-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  Geração automática de avaliações teve ótima aceitação em turmas de Ensino Médio.
                </li>
                <li className="flex gap-3 rounded-2xl bg-slate-50/80 p-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                  Relatórios simplificados agilizam a preparação para reuniões pedagógicas.
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Próximos passos</h3>
                <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-blue-600">
                  <Sparkles className="h-4 w-4" /> Roadmap do protótipo
                </span>
              </div>
              <div className="mt-4 space-y-4">
                {roadmap.map(({ title, description, icon: Icon, status }) => (
                  <div key={title} className="flex gap-3 rounded-2xl border border-slate-100 p-4">
                    <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-blue-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                          {status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">Ajuda rápida</h3>
              </div>
              <p className="mt-2 text-sm text-slate-500">Conteúdos e materiais para você aproveitar o AvaliaPro.</p>
              <ul className="mt-4 space-y-3">
                {quickHelp.map((item) => (
                  <li
                    key={item}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 p-3 text-sm text-slate-600 transition hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-700"
                  >
                    {item}
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-500">Ver guia</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Próximos passos</h3>
              <p className="mt-2 text-sm text-slate-500">
                Organize suas ações para aproveitar o máximo do protótipo.
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>• Convide um colega para testar o gerador de avaliações.</li>
                <li>• Configure uma turma piloto e acompanhe o desempenho.</li>
                <li>• Compartilhe um relatório com a coordenação pedagógica.</li>
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}
