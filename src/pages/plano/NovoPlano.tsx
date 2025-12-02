import { useState } from "react"
import { useNavigate } from "react-router-dom"

type PlanRequest = {
  tema: string
  objetivos: string
  metodologia: string
  recursos: string
  avaliacao: string
}

export default function NovoPlano() {
  const navigate = useNavigate()
  const [form, setForm] = useState<PlanRequest>({
    tema: "",
    objetivos: "",
    metodologia: "",
    recursos: "",
    avaliacao: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [planText, setPlanText] = useState("")

  const handleChange = (field: keyof PlanRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleGenerate = async () => {
    setIsLoading(true)
    setError("")
    setPlanText("")
    try {
      const resp = await fetch("/.netlify/functions/generate-lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!resp.ok) {
        throw new Error("Falha ao gerar plano")
      }
      const data = await resp.json()
      setPlanText(data.plan || "")
    } catch (e: any) {
      setError(e.message || "Erro ao gerar plano")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!planText) return
    const blob = new Blob([planText], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plano-de-aula.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
          >
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Novo plano de aula</h1>
            <p className="text-sm text-gray-600">
              Estruture objetivos, metodologia, recursos e avaliação em um fluxo simples. Use IA para gerar rapidamente.
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl bg-white p-6 shadow">
          <Field
            label="Tema"
            value={form.tema}
            onChange={(v) => handleChange("tema", v)}
            placeholder="Ex.: Revolução Industrial"
          />
          <Field
            label="Objetivos"
            value={form.objetivos}
            onChange={(v) => handleChange("objetivos", v)}
            placeholder="Liste objetivos da aula..."
            multiline
          />
          <Field
            label="Metodologia / Atividades"
            value={form.metodologia}
            onChange={(v) => handleChange("metodologia", v)}
            placeholder="Descreva a sequência didática, dinâmicas e tempos..."
            multiline
          />
          <Field
            label="Recursos"
            value={form.recursos}
            onChange={(v) => handleChange("recursos", v)}
            placeholder="Livros, vídeos, slides, materiais..."
            multiline
          />
          <Field
            label="Avaliação"
            value={form.avaliacao}
            onChange={(v) => handleChange("avaliacao", v)}
            placeholder="Critérios e instrumentos de avaliação..."
            multiline
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Gerando plano..." : "Gerar plano com IA"}
            </button>
            <button
              onClick={handleDownload}
              disabled={!planText}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              Baixar plano (.txt)
            </button>
          </div>

          {planText && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm whitespace-pre-wrap">
              {planText}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type FieldProps = {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
}

function Field({ label, value, onChange, placeholder, multiline }: FieldProps) {
  const common =
    "w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={common}
          placeholder={placeholder}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={common}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}
