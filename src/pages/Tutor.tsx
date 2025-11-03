import { useState } from "react"
import { auditEvent } from "../../hooks/useAuth"
import { useNarratedLoading } from "../../hooks/useNarratedLoading"
import { useToast } from "../../hooks/useToast"
import { FileUpload } from "../components/ui/FileUpload"
import { aiTutorQA, type FileContent } from "../services/ai"

export default function Tutor() {
  const { showToast } = useToast()
  const { message, running, start, stop } = useNarratedLoading([
    "Lendo seus materiais…",
    "Procurando respostas…",
    "Quase lá…",
  ])
  const [question, setQuestion] = useState("")
  const [files, setFiles] = useState<FileContent[]>([])
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)

  const askTutor = async () => {
    if (!question.trim()) {
      showToast("Digite uma pergunta para o Tutor IA.", "info")
      return
    }

    setLoading(true)
    start()
    try {
      const response = await aiTutorQA(question, files)
      const text =
        typeof response === "string"
          ? response
          : typeof response.answer === "string"
            ? response.answer
            : JSON.stringify(response)
      setAnswer(text.trim())
      await auditEvent("tutor_answered", { question })
    } catch (error: any) {
      console.error(error)
      showToast(error?.message ?? "Falha ao consultar o Tutor IA", "error")
    } finally {
      stop()
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-gray-900">Tutor IA</h1>
        <p className="text-sm text-gray-600">
          Envie materiais e faça perguntas. O Tutor responde com base nos arquivos anexados.
        </p>
      </header>

      <textarea
        className="textarea"
        rows={4}
        placeholder="Digite sua pergunta sobre o conteúdo..."
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
      />

      <FileUpload onFilesChange={setFiles} />

      <button className="btn-primary" onClick={askTutor} disabled={loading}>
        {loading ? "Consultando Tutor..." : "Perguntar"}
      </button>

      {running && message ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 shadow">
          {message}
        </div>
      ) : null}

      {answer ? (
        <div className="card whitespace-pre-wrap text-sm text-gray-800">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Resposta do Tutor</h2>
          {answer}
        </div>
      ) : null}
    </div>
  )
}
