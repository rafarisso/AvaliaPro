import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function PlanoDeAulaPage() {
  const navigate = useNavigate()
  const [tema, setTema] = useState("")
  const [objetivos, setObjetivos] = useState("")
  const [metodologia, setMetodologia] = useState("")
  const [recursos, setRecursos] = useState("")
  const [avaliacao, setAvaliacao] = useState("")

  const handleDownload = () => {
    const conteudo = [
      `Tema: ${tema}`,
      ``,
      `Objetivos:`,
      objetivos,
      ``,
      `Metodologia:`,
      metodologia,
      ``,
      `Recursos:`,
      recursos,
      ``,
      `Avaliação:`,
      avaliacao,
    ].join("\n")
    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" })
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
              Estruture objetivos, metodologia, recursos e avaliação em um fluxo simples.
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl bg-white p-6 shadow">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Tema</label>
            <input
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
              placeholder="Ex.: Revolução Industrial"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Objetivos</label>
            <textarea
              value={objetivos}
              onChange={(e) => setObjetivos(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
              placeholder="Liste os objetivos da aula..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Metodologia / Atividades</label>
            <textarea
              value={metodologia}
              onChange={(e) => setMetodologia(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
              placeholder="Descreva a sequência didática, dinâmicas e tempos..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Recursos</label>
            <textarea
              value={recursos}
              onChange={(e) => setRecursos(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
              placeholder="Livros, vídeos, slides, materiais..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Avaliação</label>
            <textarea
              value={avaliacao}
              onChange={(e) => setAvaliaçao(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
              placeholder="Critérios e instrumentos de avaliação..."
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={handleDownload}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Baixar plano (.txt)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
