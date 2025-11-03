import { useMemo, useState } from "react"
import { auditEvent, useAuth } from "../../hooks/useAuth"
import { useNarratedLoading } from "../../hooks/useNarratedLoading"
import { useToast } from "../../hooks/useToast"
import { FileUpload } from "../components/ui/FileUpload"
import { generateText, type FileContent } from "../services/ai"
import { getSupabase } from "../services/supabaseClient"

export default function CreateLessonPlan() {
  const supabase = useMemo(() => getSupabase(), [])
  const { user } = useAuth()
  const { showToast } = useToast()
  const { message, running, start, stop } = useNarratedLoading([
    "Estudando o currículo…",
    "Definindo objetivos…",
    "Finalizando o plano…",
  ])

  const [subject, setSubject] = useState("")
  const [grade, setGrade] = useState("6º ano - Ensino Fundamental")
  const [duration, setDuration] = useState("50 minutos")
  const [skills, setSkills] = useState("")
  const [files, setFiles] = useState<FileContent[]>([])
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const onGenerate = async () => {
    if (!subject) {
      showToast("Informe a disciplina ou tema central.", "info")
      return
    }

    setLoading(true)
    start()
    try {
      const system =
        "Você é um professor especialista em currículo brasileiro e BNCC. Produza planos de aula com objetivos claros, habilidades relacionadas, metodologias ativas e avaliação formativa."
      const prompt = [
        `Disciplina/tema: ${subject}`,
        `Ano/série: ${grade}`,
        `Duração: ${duration}`,
        skills ? `Habilidades BNCC / Competências foco: ${skills}` : null,
        "Monte seções: Objetivos de aprendizagem, Habilidades BNCC, Materiais, Sequência didática (introdução, desenvolvimento, fechamento), Avaliação e extensões.",
      ]
        .filter(Boolean)
        .join("\n")

      const text = await generateText(prompt, files, system)
      setResult(text.trim())
      await auditEvent("lesson_plan_ai_generated", { subject, grade })
      showToast("Plano de aula gerado!", "success")
    } catch (error: any) {
      console.error(error)
      showToast(error?.message ?? "Não foi possível gerar o plano de aula.", "error")
    } finally {
      stop()
      setLoading(false)
    }
  }

  const onSave = async () => {
    if (!result) {
      showToast("Gere um plano antes de salvar.", "info")
      return
    }

    setSaving(true)
    start(["Salvando no Supabase…", "Registrando plano…", "Aula pronta!"])
    try {
      const { error } = await supabase.from("templates").insert({
        disciplina: subject,
        titulo: `Plano de aula - ${subject}`,
        corpo: { type: "lesson_plan_ai", grade, duration, skills, content: result },
        user_id: user?.id ?? null,
      })
      if (error) throw error
      await auditEvent("lesson_plan_template_saved", { subject, grade })
      showToast("Plano de aula salvo!", "success")
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
      <h1 className="text-2xl font-semibold">Criar Plano de Aula com IA</h1>
      <input
        className="input"
        placeholder="Disciplina ou tema central"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
      />
      <input
        className="input"
        placeholder="Ano/série"
        value={grade}
        onChange={(event) => setGrade(event.target.value)}
      />
      <input
        className="input"
        placeholder="Duração da aula"
        value={duration}
        onChange={(event) => setDuration(event.target.value)}
      />
      <textarea
        className="textarea"
        placeholder="Habilidades BNCC, competências ou objetivos específicos (opcional)"
        value={skills}
        onChange={(event) => setSkills(event.target.value)}
      />

      <FileUpload onFilesChange={setFiles} />

      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" onClick={onGenerate} disabled={loading || !subject}>
          {loading ? "Gerando..." : "Gerar plano"}
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
