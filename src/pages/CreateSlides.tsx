import { useMemo, useState } from "react"
import { auditEvent, useAuth } from "../../hooks/useAuth"
import { useNarratedLoading } from "../../hooks/useNarratedLoading"
import { useToast } from "../../hooks/useToast"
import { FileUpload } from "../components/ui/FileUpload"
import { generateSlidesOutline, type FileContent } from "../services/ai"
import { getSupabase } from "../services/supabaseClient"

export default function CreateSlides() {
  const supabase = useMemo(() => getSupabase(), [])
  const { user } = useAuth()
  const { showToast } = useToast()
  const { message, running, start, stop } = useNarratedLoading([
    "Analisando seu material…",
    "Criando a narrativa…",
    "Finalizando os slides…",
  ])

  const [topic, setTopic] = useState("")
  const [audience, setAudience] = useState("Ensino Fundamental")
  const [files, setFiles] = useState<FileContent[]>([])
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const onGenerate = async () => {
    if (!topic) {
      showToast("Informe um tema para gerar os slides.", "info")
      return
    }

    setLoading(true)
    start()
    try {
      const system = `Você é um especialista em educação. Gere um outline de slides objetivos, com títulos e bullets curtos, apropriados para ${audience}.`
      const text = await generateSlidesOutline(
        `Tema: ${topic}\nCrie de 8 a 12 slides. Use os arquivos enviados como fonte (quando houver).`,
        files,
        system
      )
      setResult(text.trim())
      await auditEvent("slides_outline_generated", { topic, audience })
      showToast("Outline gerado com sucesso!", "success")
    } catch (error: any) {
      console.error(error)
      showToast(error?.message ?? "Não foi possível gerar os slides. Tente novamente.", "error")
    } finally {
      stop()
      setLoading(false)
    }
  }

  const onSave = async () => {
    if (!result) {
      showToast("Gere um outline antes de salvar.", "info")
      return
    }

    setSaving(true)
    start(["Salvando no Supabase…", "Registrando a apresentação…", "Pronto!"])
    try {
      const { error } = await supabase.from("templates").insert({
        disciplina: topic,
        titulo: `Slides - ${topic}`,
        corpo: { type: "slides_outline", audience, outline: result },
        user_id: user?.id ?? null,
      })
      if (error) throw error
      await auditEvent("slides_template_saved", { topic, audience })
      showToast("Outline salvo no Supabase!", "success")
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
      <h1 className="text-2xl font-semibold">Criar Slides com IA</h1>
      <input
        className="input"
        placeholder="Tema (ex.: Revolução Industrial)"
        value={topic}
        onChange={(event) => setTopic(event.target.value)}
      />
      <select className="input" value={audience} onChange={(event) => setAudience(event.target.value)}>
        <option>Ensino Fundamental</option>
        <option>Ensino Médio</option>
        <option>Educação Infantil</option>
        <option>Educação de Jovens e Adultos</option>
      </select>

      <FileUpload onFilesChange={setFiles} />

      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" onClick={onGenerate} disabled={loading || !topic}>
          {loading ? "Gerando..." : "Gerar outline"}
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
