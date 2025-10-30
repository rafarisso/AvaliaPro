import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header"
import PrototypeBanner from "../components/PrototypeBanner"
import { useAuth } from "../../hooks/useAuth"
import { getSupabase } from "../services/supabaseClient"

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
    <div className="min-h-screen bg-gray-50">
      <PrototypeBanner />
      <Header />

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <header className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">AvaliaPro</p>
            <h1 className="text-3xl font-semibold text-gray-900">Seu painel de protótipo</h1>
            <p className="text-sm text-gray-600">
              Explore recursos, colete feedback dos professores e veja onde podemos melhorar.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm text-gray-600">
            <span>
              Usuário logado: <strong>{user?.email ?? "visitante@avaliapro.com"}</strong>
            </span>
            {user && (
              <button
                onClick={logout}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Sair
              </button>
            )}
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Atalhos rápidos</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => navigate("/avaliacoes/nova")}
              className="rounded-2xl bg-white px-4 py-6 text-left shadow transition hover:shadow-md"
            >
              <div className="text-lg font-medium text-gray-900">Criar avaliação</div>
              <div className="text-sm text-gray-500">em minutos</div>
            </button>
            <button
              onClick={() => navigate("/plano-aula/novo")}
              className="rounded-2xl bg-white px-4 py-6 text-left shadow transition hover:shadow-md"
            >
              <div className="text-lg font-medium text-gray-900">Plano de aula</div>
              <div className="text-sm text-gray-500">organize e compartilhe</div>
            </button>
            <button
              onClick={() => navigate("/modelos")}
              className="rounded-2xl bg-white px-4 py-6 text-left shadow transition hover:shadow-md"
            >
              <div className="text-lg font-medium text-gray-900">Modelos prontos</div>
              <div className="text-sm text-gray-500">por disciplina</div>
            </button>
            <button
              onClick={() => navigate("/relatorios")}
              className="rounded-2xl bg-white px-4 py-6 text-left shadow transition hover:shadow-md"
            >
              <div className="text-lg font-medium text-gray-900">Relatórios</div>
              <div className="text-sm text-gray-500">acompanhamento rápido</div>
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Feedback em destaque</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>• Professores querem mais modelos por disciplina.</li>
              <li>• Geração automática de avaliações teve ótima aceitação.</li>
              <li>• Relatórios simplificados ajudam na reunião pedagógica.</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Próximos passos</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>• Conectar IA para sugestões de questões.</li>
              <li>• Permitir importação de planilhas com notas.</li>
              <li>• Disponibilizar relatórios exportáveis em PDF.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}
