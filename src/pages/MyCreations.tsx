import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { useToast } from "../../hooks/useToast"
import { getSupabase } from "../services/supabaseClient"

type TabKey = "assessments" | "rubrics" | "plans" | "slides"

type AssessmentRecord = {
  id: string
  titulo: string
  disciplina?: string | null
  tema?: string | null
  serie?: string | null
  created_at?: string
}

type RubricRecord = {
  id: string
  titulo: string
  created_at?: string
}

type TemplateRecord = {
  id: string
  titulo: string
  disciplina?: string | null
  corpo: { type?: string }
  created_at?: string
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "assessments", label: "Avaliações" },
  { key: "rubrics", label: "Rubricas" },
  { key: "plans", label: "Planos" },
  { key: "slides", label: "Apresentações" },
]

export default function MyCreations() {
  const supabase = useMemo(() => getSupabase(), [])
  const { user } = useAuth()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState<TabKey>("assessments")
  const [search, setSearch] = useState("")
  const [disciplineFilter, setDisciplineFilter] = useState("")
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([])
  const [rubrics, setRubrics] = useState<RubricRecord[]>([])
  const [plans, setPlans] = useState<TemplateRecord[]>([])
  const [slides, setSlides] = useState<TemplateRecord[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      try {
        const [assessmentsRes, rubricsRes, templatesRes] = await Promise.all([
          supabase
            .from("assessments")
            .select("id,titulo,disciplina,tema,serie,created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("rubrics")
            .select("id,titulo,created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("templates")
            .select("id,titulo,disciplina,corpo,created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ])

        if (assessmentsRes.error) throw assessmentsRes.error
        if (rubricsRes.error) throw rubricsRes.error
        if (templatesRes.error) throw templatesRes.error

        setAssessments((assessmentsRes.data as AssessmentRecord[]) ?? [])
        setRubrics((rubricsRes.data as RubricRecord[]) ?? [])
        const templateData = (templatesRes.data as TemplateRecord[]) ?? []
        setPlans(templateData.filter((item) => item.corpo?.type === "lesson_plan_ai"))
        setSlides(templateData.filter((item) => item.corpo?.type === "slides_outline"))
      } catch (error: any) {
        console.error(error)
        showToast(error?.message ?? "Não foi possível carregar suas criações", "error")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [showToast, supabase, user])

  const filteredData = () => {
    const term = search.trim().toLowerCase()
    const discipline = disciplineFilter.trim().toLowerCase()

    const applyFilter = <T extends { titulo: string; disciplina?: string | null; tema?: string | null }>(
      list: T[]
    ) =>
      list.filter((item) => {
        const inSearch =
          !term ||
          item.titulo.toLowerCase().includes(term) ||
          (item.tema ?? "").toLowerCase().includes(term)
        const inDiscipline =
          !discipline || (item.disciplina ?? "").toLowerCase().includes(discipline)
        return inSearch && inDiscipline
      })

    switch (activeTab) {
      case "assessments":
        return applyFilter(assessments)
      case "rubrics":
        return rubrics.filter((item) => item.titulo.toLowerCase().includes(term))
      case "plans":
        return applyFilter(plans)
      case "slides":
        return applyFilter(slides)
      default:
        return []
    }
  }

  const handleAction = (action: string, label: string) => {
    showToast(`${action} (${label}) em desenvolvimento`, "info")
  }

  const data = filteredData()

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <h1 className="text-3xl font-semibold text-gray-900">Minhas criações</h1>
        <p className="text-sm text-gray-600">
          Faça login para acessar suas avaliações, rubricas e planos salvos.
        </p>
        <Link
          to="/login"
          className="inline-flex w-fit items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Entrar
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-gray-900">Minhas criações</h1>
        <p className="text-sm text-gray-600">
          Gerencie avaliações, rubricas, planos e apresentações gerados com a IA.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          className="input"
          placeholder="Busca por título ou tema"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <input
          className="input"
          placeholder="Filtrar por disciplina"
          value={disciplineFilter}
          onChange={(event) => setDisciplineFilter(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-700 shadow">
          Carregando suas criações...
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-600 shadow">
          Nenhum item encontrado. Gere uma criação para vê-la aqui.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((item: any) => (
            <div key={item.id} className="space-y-3 rounded-2xl border bg-white p-5 shadow">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{item.titulo}</h2>
                {item.disciplina ? (
                  <p className="text-sm text-gray-500">Disciplina: {item.disciplina}</p>
                ) : null}
                {item.tema ? <p className="text-sm text-gray-500">Tema: {item.tema}</p> : null}
                <p className="text-xs text-gray-400">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString("pt-BR")
                    : "Sem data"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  className="btn-primary px-3 py-2"
                  onClick={() => handleAction("Abrir", item.titulo)}
                >
                  Abrir
                </button>
                <button
                  className="btn-primary px-3 py-2"
                  onClick={() => handleAction("Editar", item.titulo)}
                >
                  Editar
                </button>
                <button
                  className="btn-primary px-3 py-2"
                  onClick={() => handleAction("Exportar", item.titulo)}
                >
                  Exportar
                </button>
                <button
                  className="btn-primary px-3 py-2"
                  onClick={() => handleAction("Duplicar", item.titulo)}
                >
                  Duplicar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
