import { useMemo, useState } from "react"
import { auditEvent, useAuth } from "../../hooks/useAuth"
import { useNarratedLoading } from "../../hooks/useNarratedLoading"
import { useToast } from "../../hooks/useToast"
import { FileUpload } from "../components/ui/FileUpload"
import { generateText, type FileContent } from "../services/ai"
import { getSupabase } from "../services/supabaseClient"

export default function CreateAdaptedAssessment() {
  const supabase = useMemo(() => getSupabase(), [])
  const { user } = useAuth()
  const { showToast } = useToast()
  const { message, running, start, stop } = useNarratedLoading([
    "Lendo necessidades do estudante…",
    "Adaptando instruções…",
    "Finalizando avaliação inclusiva…",
  ])

  const [subject, setSubject] = useState("")
  const [needs, setNeeds] = useState("Transtorno do Espectro Autista (TEA)")
  const [adaptations, setAdaptations] = useState("")
  const [files, setFiles] = useState<FileContent[]>([])
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const onGenerate = async () => {
    if (!subject) {
      showToast("Informe a disciplina ou tema da avaliação.", "info")
      return
    }

    setLoading(true)
    start()
    try {
      const system =
        "Você é um especialista em educação inclusiva. Adapte avaliações para garantir linguagem simples, apoio visual e diferentes formas de resposta, mantendo os objetivos pedagógicos."
      const prompt = [
        `Disciplina/tema principal: ${subject}`,
        `Necessidades específicas: ${needs}`,
        adaptations ? `Acomodações adicionais desejadas: ${adaptations}` : null,
        "Crie uma avaliação adaptada com instruções claras, recursos de apoio, tempo estimado e critérios de avaliação.",
        "Inclua gabarito orientando como considerar respostas adaptadas.",
      ]
        .filter(Boolean)
        .join("\n")

      const text = await generateText(prompt, files, system)
      setResult(text.trim())
      await auditEvent("adapted_assessment_ai_generated", { subject, needs })
      showToast("Avaliação adaptada gerada!", "success")
    } catch (error: any) {
      console.error(error)
      showToast(error?.message ?? "Não foi possível gerar a avaliação adaptada.", "error")
    } finally {
      stop()
      setLoading(false)
    }
  }

  const onSave = async () => {
    if (!result) {
      showToast("Gere uma avaliação antes de salvar.", "info")
      return
    }

    setSaving(true)
    start(["Salvando no Supabase…", "Registrando avaliação…", "Incluindo adaptações…"])
    try {
      const { error } = await supabase.from("templates").insert({
        disciplina: subject,
        titulo: `Avaliação adaptada - ${subject}`,
        corpo: { type: "adapted_assessment_ai", needs, content: result },
        user_id: user?.id ?? null,
      })
      if (error) throw error
      await auditEvent("adapted_assessment_template_saved", { subject, needs })
      showToast("Avaliação adaptada salva!", "success")
    } catch (error: any) {
      console.error(error)
      showToast(error?.message ?? "Erro ao salvar", "error")
    } finally {
      stop()
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <h1 className="text-2xl font-semibold">Avaliação Adaptada com IA</h1>
      <input
        className="input"
        placeholder="Disciplina ou tema"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
      />
      <select className="input" value={needs} onChange={(event) => setNeeds(event.target.value)}>
        <option>Transtorno do Espectro Autista (TEA)</option>
        <option>Deficiência intelectual</option>
        <option>Altas habilidades/superdotação</option>
        <option>Transtorno de Déficit de Atenção e Hiperatividade (TDAH)</option>
        <option>Deficiência visual</option>
        <option>Deficiência auditiva</option>
      </select>
      <textarea
        className="textarea"
        placeholder="Observações ou adaptações adicionais (opcional)"
        value={adaptations}
        onChange={(event) => setAdaptations(event.target.value)}
      />

      <FileUpload onFilesChange={setFiles} />

      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" onClick={onGenerate} disabled={loading || !subject}>
          {loading ? "Gerando..." : "Gerar avaliação adaptada"}
        </button>
        <button className="btn-primary" onClick={onSave} disabled={!result || saving}>
          {saving ? "Salvando..." : "Salvar no Supabase"}
        </button>
      </div>

      {running && message ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 shadow">
          {message}
        </div>
      ) : null}

      {result ? <div className="card whitespace-pre-wrap text-sm text-gray-800">{result}</div> : null}
    </div>
  )
}
