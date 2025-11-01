import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import Header from "../components/Header"
import PrototypeBanner from "../components/PrototypeBanner"
import { BILLING_ENABLED, SHOW_PROTOTYPE_BANNER } from "../flags"
import { auditEvent, useAuth } from "@/hooks/useAuth"
import { getSupabase } from "@/services/supabaseClient"
import { listMyAssessments } from "@/services/assessments"
import { listMyLessonPlans } from "@/services/lessonPlans"
import { listMySlideDecks } from "@/services/slides"

type RecentEvent = {
  id: string
  event: string
  created_at: string
  meta?: Record<string, unknown> | null
}

export default function Dashboard() {
  const { user, profile, logout } = useAuth()
  const supabase = useMemo(() => getSupabase(), [])

  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [lastCreation, setLastCreation] = useState<{ label: string; href: string } | null>(null)
  const [assessments, setAssessments] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [decks, setDecks] = useState<any[]>([])

  useEffect(() => {
    void auditEvent("dashboard_view")
  }, [])

  useEffect(() => {
    if (!user) return

    const loadEvents = async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("id,event,created_at,meta")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12)

      if (error) {
        console.warn("[Dashboard] Falha ao carregar eventos:", error)
        return
      }

      const events = (data as RecentEvent[]) ?? []
      setRecentEvents(events)

      const last = events.find((evt) =>
        ["assessment_created", "rubric_created", "slides_template_saved", "lesson_plan_template_saved", "adapted_assessment_template_saved"].includes(
          evt.event
        )
      )

      if (!last) {
        setLastCreation(null)
        return
      }

      const mapping: Record<string, { label: string; href: string }> = {
        assessment_created: { label: "Avaliação", href: "/create/assessment" },
        rubric_created: { label: "Rubrica", href: "/create/rubric" },
        slides_template_saved: { label: "Slides", href: "/create/slides" },
        lesson_plan_template_saved: { label: "Plano de aula", href: "/create/lesson-plan" },
        adapted_assessment_template_saved: {
          label: "Avaliação adaptada",
          href: "/create/assessment/adapted",
        },
      }

      setLastCreation(mapping[last.event])
    }

    void loadEvents()
  }, [supabase, user])

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const [a, p, d] = await Promise.all([
          listMyAssessments(user.id),
          listMyLessonPlans(user.id),
          listMySlideDecks(user.id),
        ])
        setAssessments(a)
        setPlans(p)
        setDecks(d)
      } catch (error) {
        console.warn("[Dashboard] Falha ao carregar listas recentes:", error)
      }
    })()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      {SHOW_PROTOTYPE_BANNER ? <PrototypeBanner /> : null}
      <Header />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <header className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">AvaliaPro</p>
            <h1 className="text-3xl font-semibold text-gray-900">Modo protótipo liberado</h1>
            <p className="text-sm text-gray-600">
              Navegue por todos os recursos liberados. Nenhum bloqueio de assinatura ativo.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm text-gray-600">
            <span>
              Usuário logado: <strong>{user?.email ?? "visitante@avaliapro.com"}</strong>
            </span>
            {profile?.full_name ? <span>Nome: {profile.full_name}</span> : null}
            {user ? (
              <button
                onClick={logout}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Sair
              </button>
            ) : null}
          </div>
        </header>

        {BILLING_ENABLED ? (
          <section className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-6 text-sm text-blue-700 shadow-inner">
            Stripe desativado neste ambiente. Quando habilitarmos cobrança, um card com planos aparecerá aqui.
          </section>
        ) : (
          <section className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-blue-700 shadow">
            Protótipo aberto para testes — todo o conteúdo está liberado para exploração.
          </section>
        )}

        {lastCreation ? (
          <section className="rounded-2xl border bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">Continue de onde parou</h2>
            <p className="mt-2 text-sm text-gray-600">
              Retome sua última criação e finalize os ajustes.
            </p>
            <Link
              to={lastCreation.href}
              className="mt-4 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Abrir {lastCreation.label}
            </Link>
          </section>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Atalhos rápidos</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/avaliacoes/nova" className="block rounded-lg p-5 bg-white shadow hover:shadow-lg transition">
              Criar avaliação
            </Link>
            <Link to="/planos/nova" className="block rounded-lg p-5 bg-white shadow hover:shadow-lg transition">
              Plano de aula
            </Link>
            <Link to="/slides/novo" className="block rounded-lg p-5 bg-white shadow hover:shadow-lg transition">
              Gerar slides
            </Link>
            <Link to="/create/assessment/adapted" className="block rounded-lg p-5 bg-white shadow hover:shadow-lg transition">
              Avaliação adaptada
            </Link>
          </div>
        </section>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Minhas avaliações</h3>
            <ul className="text-sm space-y-1">
              {assessments.slice(0,3).map((a) => (
                <li key={a.id}>{a.title}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Planos de aula</h3>
            <ul className="text-sm space-y-1">
              {plans.slice(0,3).map((p) => (
                <li key={p.id}>{p.title}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Slides</h3>
            <ul className="text-sm space-y-1">
              {decks.slice(0,3).map((d) => (
                <li key={d.id}>{d.title}</li>
              ))}
            </ul>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Atividades recentes</h3>
            {recentEvents.length ? (
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                {recentEvents.slice(0, 6).map((event) => (
                  <li key={event.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{formatEventName(event.event)}</p>
                      {event.meta?.titulo ? (
                        <p className="text-xs text-gray-500">{String(event.meta.titulo)}</p>
                      ) : null}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(event.created_at).toLocaleString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                Suas atividades recentes aparecerão aqui após gerar ou salvar conteúdos.
              </p>
            )}
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

function formatEventName(event: string) {
  const mapping: Record<string, string> = {
    assessment_structured_generated: "Avaliação estruturada gerada",
    assessment_created: "Avaliação salva",
    rubric_generated: "Rubrica gerada",
    rubric_created: "Rubrica salva",
    slides_outline_generated: "Slides gerados",
    slides_template_saved: "Slides salvos",
    lesson_plan_ai_generated: "Plano de aula gerado",
    lesson_plan_template_saved: "Plano de aula salvo",
    adapted_assessment_ai_generated: "Avaliação adaptada gerada",
    adapted_assessment_template_saved: "Avaliação adaptada salva",
    tutor_answered: "Tutor IA consultado",
    students_imported: "Importação de alunos",
  }
  return mapping[event] ?? event
}
