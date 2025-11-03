import { useMemo, useState } from "react"
import { auditEvent, useAuth } from "../../hooks/useAuth"
import { useNarratedLoading } from "../../hooks/useNarratedLoading"
import { useToast } from "../../hooks/useToast"
import { FileUpload } from "../components/ui/FileUpload"
import { aiGenerateStructured, type FileContent } from "../services/ai"
import { getSupabase } from "../services/supabaseClient"

type RubricRow = {
  criterio: string
  niveis: string[]
  descricao_por_nivel?: string[]
}

type RubricDraft = {
  titulo: string
  criterios: RubricRow[]
}

export default function CreateRubric() {
  const supabase = useMemo(() => getSupabase(), [])
  const { user } = useAuth()
  const { showToast } = useToast()
  const { message, running, start, stop } = useNarratedLoading([
    "Entendendo a atividade…",
    "Gerando critérios e níveis…",
    "Finalizando a rubrica…",
  ])

  const [context, setContext] = useState("")
  const [levels, setLevels] = useState("Excelente, Bom, Precisa melhorar")
  const [files, setFiles] = useState<FileContent[]>([])
  const [draft, setDraft] = useState<RubricDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const onGenerate = async () => {
    setGenerating(true)
    start()
    try {
      const prompt = [
        "Crie uma rubrica avaliativa completa.",
        context ? `Contexto / atividade: ${context}` : null,
        `Níveis desejados: ${levels}`,
        "Descreva cada critério com frases objetivas e alinhadas ao contexto escolar.",
      ]
        .filter(Boolean)
        .join("\n")

      const response = await aiGenerateStructured("rubric", prompt, files)
      const parsed = typeof response === "string" ? JSON.parse(response) : (response as RubricDraft)
      setDraft(parsed)
      await auditEvent("rubric_generated", { titulo: parsed.titulo })
      showToast("Rubrica gerada!", "success")
    } catch (error: any) {
      console.error(error)
      showToast(error?.message ?? "Falha ao gerar rubrica", "error")
    } finally {
      stop()
      setGenerating(false)
    }
  }

  const onSave = async () => {
    if (!draft) {
      showToast("Gere uma rubrica antes de salvar.", "info")
      return
    }

    setSaving(true)
    start(["Salvando no Supabase…", "Registrando rubrica…", "Tudo pronto!"])
    try {
      const { error } = await supabase
        .from("rubrics")
        .insert({ titulo: draft.titulo, criterios: draft.criterios, user_id: user?.id ?? null })
      if (error) throw error
      await auditEvent("rubric_created", { titulo: draft.titulo })
      showToast("Rubrica salva com sucesso!", "success")
    } catch (error: any) {
      console.error(error)
      showToast(error?.message ?? "Erro ao salvar rubrica", "error")
    } finally {
      stop()
      setSaving(false)
    }
  }

  const updateCriterion = (index: number, updater: (row: RubricRow) => RubricRow) => {
    setDraft((current) => {
      if (!current) return current
      const next = current.criterios.map((row, idx) => (idx === index ? updater(row) : row))
      return { ...current, criterios: next }
    })
  }

  const addCriterion = () => {
    setDraft((current) => {
      const base: RubricDraft =
        current ?? {
          titulo: "Nova rubrica",
          criterios: [],
        }
      return {
        ...base,
        criterios: [
          ...base.criterios,
          {
            criterio: "Novo critério",
            niveis: levels.split(",").map((item) => item.trim()).filter(Boolean),
          },
        ],
      }
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-gray-900">Gerar rubrica com IA</h1>
        <p className="text-sm text-gray-600">
          Estruture critérios e níveis avaliativos com base nos arquivos enviados.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border bg-white p-6 shadow">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Descrição da atividade</label>
          <textarea
            className="textarea"
            placeholder="Ex.: Apresentação oral sobre sustentabilidade."
            value={context}
            onChange={(event) => setContext(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Níveis desejados</label>
          <input
            className="input"
            value={levels}
            onChange={(event) => setLevels(event.target.value)}
            placeholder="Excelente, Bom, Precisa melhorar"
          />
        </div>
      </section>

      <FileUpload onFilesChange={setFiles} />

      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" onClick={onGenerate} disabled={generating}>
          {generating ? "Gerando..." : "Gerar rubrica"}
        </button>
        <button className="btn-primary" onClick={onSave} disabled={!draft || saving}>
          {saving ? "Salvando..." : "Salvar no Supabase"}
        </button>
        <button className="btn-primary" type="button" onClick={addCriterion}>
          Adicionar critério
        </button>
      </div>

      {running && message ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 shadow">
          {message}
        </div>
      ) : null}

      {draft ? (
        <section className="space-y-4 rounded-2xl border bg-white p-6 shadow">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Título da rubrica</label>
            <input
              className="input"
              value={draft.titulo}
              onChange={(event) => setDraft({ ...draft, titulo: event.target.value })}
            />
          </div>

          <div className="space-y-4">
            {draft.criterios.map((criterio, index) => (
              <div key={index} className="space-y-3 rounded-xl border bg-gray-50 p-4">
                <input
                  className="input"
                  value={criterio.criterio}
                  onChange={(event) =>
                    updateCriterion(index, (row) => ({ ...row, criterio: event.target.value }))
                  }
                />
                <div className="overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr>
                        {criterio.niveis.map((nivel, nivelIdx) => (
                          <th key={nivelIdx} className="px-3 py-2 text-left font-medium text-gray-600">
                            <input
                              className="input"
                              value={nivel}
                              onChange={(event) =>
                                updateCriterion(index, (row) => {
                                  const niveis = [...row.niveis]
                                  niveis[nivelIdx] = event.target.value
                                  return { ...row, niveis }
                                })
                              }
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {criterio.niveis.map((_, nivelIdx) => (
                          <td key={nivelIdx} className="px-3 py-2 align-top">
                            <textarea
                              className="textarea"
                              value={criterio.descricao_por_nivel?.[nivelIdx] ?? ""}
                              onChange={(event) =>
                                updateCriterion(index, (row) => {
                                  const descricao = [...(row.descricao_por_nivel ?? [])]
                                  descricao[nivelIdx] = event.target.value
                                  return { ...row, descricao_por_nivel: descricao }
                                })
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
