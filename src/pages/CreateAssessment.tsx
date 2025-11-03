import { useCallback, useMemo, useState } from "react"
import { auditEvent, useAuth } from "../../hooks/useAuth"
import { useNarratedLoading } from "../../hooks/useNarratedLoading"
import { useToast } from "../../hooks/useToast"
import { FileUpload } from "../components/ui/FileUpload"
import { aiGenerateStructured, type FileContent } from "../services/ai"
import { getSupabase } from "../services/supabaseClient"
import type { AvaliacaoJSON, Questao, QuestaoObjetiva } from "../types/assessment"

type Metadata = {
  titulo: string
  disciplina: string
  tema: string
  serie: string
}

const defaultMetadata: Metadata = {
  titulo: "",
  disciplina: "",
  tema: "",
  serie: "",
}

function getInitialMetadata(draft: AvaliacaoJSON | null): Metadata {
  if (!draft) return defaultMetadata
  return {
    titulo: draft.titulo ?? "",
    disciplina: draft.disciplina ?? "",
    tema: draft.tema ?? "",
    serie: draft.serie ?? "",
  }
}

function makePrompt(metadata: Metadata): string {
  const parts = [
    `Título desejado: ${metadata.titulo || "Avaliação sem título"}`,
    metadata.disciplina ? `Disciplina: ${metadata.disciplina}` : null,
    metadata.tema ? `Tema central: ${metadata.tema}` : null,
    metadata.serie ? `Série/Ano: ${metadata.serie}` : null,
    "Gere entre 8 e 12 questões misturando objetiva e dissertativa, com níveis variados de dificuldade e indicando habilidades da BNCC quando pertinente.",
    "Inclua gabarito completo e considere os arquivos anexados como fonte de conteúdo (quando houver).",
  ]
  return parts.filter(Boolean).join("\n")
}

export default function CreateAssessment() {
  const supabase = useMemo(() => getSupabase(), [])
  const { user } = useAuth()
  const { showToast } = useToast()
  const { message, start, stop, running } = useNarratedLoading()

  const [metadata, setMetadata] = useState<Metadata>(defaultMetadata)
  const [files, setFiles] = useState<FileContent[]>([])
  const [draft, setDraft] = useState<AvaliacaoJSON | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const updateDraft = useCallback(
    (next: AvaliacaoJSON | null) => {
      setDraft(next)
      setMetadata(getInitialMetadata(next))
    },
    []
  )

  const handleMetaChange = useCallback(
    <K extends keyof Metadata>(key: K, value: Metadata[K]) => {
      setMetadata((prev) => ({ ...prev, [key]: value }))
      setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
    },
    []
  )

  const updateQuestion = useCallback(
    (index: number, updater: (question: Questao) => Questao) => {
      setDraft((current) => {
        if (!current) return current
        const nextQuestions = current.questoes.map((question, idx) =>
          idx === index ? updater(question) : question
        )
        return { ...current, questoes: nextQuestions }
      })
    },
    []
  )

  const handleAlternativeChange = useCallback(
    (qIndex: number, altIndex: number, value: string) => {
      updateQuestion(qIndex, (question) => {
        if (question.tipo !== "objetiva") return question
        const alternativas = [...question.alternativas]
        alternativas[altIndex] = value
        return { ...question, alternativas }
      })
    },
    [updateQuestion]
  )

  const addAlternative = useCallback(
    (qIndex: number) => {
      updateQuestion(qIndex, (question) => {
        if (question.tipo !== "objetiva") return question
        return { ...question, alternativas: [...question.alternativas, "Nova alternativa"] }
      })
    },
    [updateQuestion]
  )

  const removeAlternative = useCallback(
    (qIndex: number, altIndex: number) => {
      updateQuestion(qIndex, (question) => {
        if (question.tipo !== "objetiva") return question
        const alternativas = question.alternativas.filter((_, idx) => idx !== altIndex)
        return { ...question, alternativas }
      })
    },
    [updateQuestion]
  )

  const updateGabaritoEntry = useCallback((index: number, value: string) => {
    setDraft((current) => {
      if (!current) return current
      const gabarito = { ...(current.gabarito ?? {}) }
      gabarito[index] = value
      return { ...current, gabarito }
    })
  }, [])

  const onGenerate = useCallback(async () => {
    setIsGenerating(true)
    start()
    try {
      const response = await aiGenerateStructured("assessment", makePrompt(metadata), files)
      const structured = typeof response === "string" ? JSON.parse(response) : (response as AvaliacaoJSON)
      updateDraft(structured)
      await auditEvent("assessment_structured_generated", {
        titulo: structured.titulo,
        disciplina: structured.disciplina,
      })
      showToast("Avaliação gerada com sucesso!", "success")
    } catch (error: any) {
      console.error(error)
      showToast(error?.message ?? "Falha ao gerar avaliação", "error")
    } finally {
      stop()
      setIsGenerating(false)
    }
  }, [files, metadata, showToast, start, stop, updateDraft])

  const onSave = useCallback(async () => {
    if (!draft) {
      showToast("Gere uma avaliação antes de salvar.", "info")
      return
    }

    setIsSaving(true)
    start(["Salvando no banco…", "Registrando questões…", "Finalizando…"])
    try {
      const { data: assessment, error } = await supabase
        .from("assessments")
        .insert({
          titulo: draft.titulo,
          disciplina: draft.disciplina,
          tema: draft.tema,
          serie: draft.serie,
          user_id: user?.id ?? null,
        })
        .select("*")
        .single()

      if (error) throw error

      const items = draft.questoes.map((question, index) => ({
        assessment_id: assessment.id,
        idx: index,
        json: question,
        user_id: user?.id ?? null,
      }))

      if (items.length) {
        const { error: itemsError } = await supabase.from("assessment_items").insert(items)
        if (itemsError) throw itemsError
      }

      if (draft.gabarito) {
        const { error: keyError } = await supabase
          .from("assessment_keys")
          .insert({ assessment_id: assessment.id, key: draft.gabarito, user_id: user?.id ?? null })
        if (keyError) throw keyError
      }

      await auditEvent("assessment_created", {
        titulo: draft.titulo,
        disciplina: draft.disciplina,
      })

      showToast("Avaliação salva no Supabase!", "success")
    } catch (error: any) {
      console.error(error)
      showToast(error?.message ?? "Erro ao salvar avaliação", "error")
    } finally {
      stop()
      setIsSaving(false)
    }
  }, [draft, showToast, start, stop, supabase])

  const renderQuestion = (question: Questao, index: number) => {
    const header = (
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Questão {index + 1} — {question.tipo === "objetiva" ? "Objetiva" : "Dissertativa"}
        </h3>
      </header>
    )

    const enunciadoInput = (
      <textarea
        className="textarea"
        value={question.enunciado}
        onChange={(event) =>
          updateQuestion(index, (prev) => ({ ...prev, enunciado: event.target.value }))
        }
      />
    )

    if (question.tipo === "objetiva") {
      return (
        <div key={index} className="space-y-3 rounded-2xl border bg-white p-4 shadow">
          {header}
          <label className="text-sm font-medium text-gray-700">Enunciado</label>
          {enunciadoInput}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Alternativas</span>
              <button className="text-xs font-medium text-blue-600" onClick={() => addAlternative(index)}>
                Adicionar alternativa
              </button>
            </div>
            {question.alternativas.map((alt, altIdx) => (
              <div key={altIdx} className="flex gap-2">
                <input
                  className="input flex-1"
                  value={alt}
                  onChange={(event) => handleAlternativeChange(index, altIdx, event.target.value)}
                />
                <button
                  className="text-xs font-medium text-red-500"
                  onClick={() => removeAlternative(index, altIdx)}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>

          <label className="text-sm font-medium text-gray-700">Resposta correta</label>
          <input
            className="input"
            value={question.resposta_correta}
            onChange={(event) =>
              updateQuestion(index, (prev) => ({
                ...(prev as QuestaoObjetiva),
                resposta_correta: event.target.value,
              }))
            }
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Habilidade (opcional)</label>
              <input
                className="input"
                value={question.habilidade ?? ""}
                onChange={(event) =>
                  updateQuestion(index, (prev) => ({
                    ...(prev as QuestaoObjetiva),
                    habilidade: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Dificuldade</label>
              <select
                className="input"
                value={question.dificuldade ?? ""}
                onChange={(event) =>
                  updateQuestion(index, (prev) => ({
                    ...(prev as QuestaoObjetiva),
                    dificuldade: event.target.value as QuestaoObjetiva["dificuldade"],
                  }))
                }
              >
                <option value="">Selecione</option>
                <option value="fácil">Fácil</option>
                <option value="médio">Médio</option>
                <option value="difícil">Difícil</option>
              </select>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div key={index} className="space-y-3 rounded-2xl border bg-white p-4 shadow">
        {header}
        <label className="text-sm font-medium text-gray-700">Enunciado</label>
        {enunciadoInput}

        <label className="text-sm font-medium text-gray-700">Rubrica sugerida</label>
        <textarea
          className="textarea"
          value={JSON.stringify(question.rubrica_sugestao ?? [], null, 2)}
          onChange={(event) =>
            updateQuestion(index, (prev) => ({
              ...prev,
              rubrica_sugestao: (() => {
                try {
                  const parsed = JSON.parse(event.target.value)
                  return Array.isArray(parsed) ? parsed : prev.rubrica_sugestao
                } catch {
                  return prev.rubrica_sugestao
                }
              })(),
            }))
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-gray-900">Avaliações 2.0</h1>
        <p className="text-sm text-gray-600">
          Gere avaliações estruturadas em JSON, edite em tempo real e salve no Supabase.
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl border bg-white p-6 shadow md:grid-cols-2">
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Título</label>
          <input
            className="input"
            value={metadata.titulo}
            onChange={(event) => handleMetaChange("titulo", event.target.value)}
            placeholder="Avaliação de Matemática — Proporcionalidade"
          />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Disciplina</label>
          <input
            className="input"
            value={metadata.disciplina}
            onChange={(event) => handleMetaChange("disciplina", event.target.value)}
            placeholder="Matemática"
          />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Tema</label>
          <input
            className="input"
            value={metadata.tema}
            onChange={(event) => handleMetaChange("tema", event.target.value)}
            placeholder="Proporcionalidade e razão"
          />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Série/Ano</label>
          <input
            className="input"
            value={metadata.serie}
            onChange={(event) => handleMetaChange("serie", event.target.value)}
            placeholder="8º ano"
          />
        </div>
      </section>

      <FileUpload onFilesChange={setFiles} />

      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" onClick={onGenerate} disabled={isGenerating}>
          {isGenerating ? "Gerando avaliação..." : "Gerar avaliação (JSON)"}
        </button>
        <button className="btn-primary" onClick={onSave} disabled={!draft || isSaving}>
          {isSaving ? "Salvando..." : "Salvar no Supabase"}
        </button>
      </div>

      {running && message ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 shadow">
          {message}
        </div>
      ) : null}

      {draft ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Questões geradas</h2>
            <p className="text-sm text-gray-600">Edite enunciados, alternativas e habilidades conforme necessário.</p>
          </div>
          <div className="space-y-4">
            {draft.questoes.map((question, index) => renderQuestion(question, index))}
          </div>

          {draft.gabarito ? (
            <div className="rounded-2xl border bg-white p-4 shadow">
              <h3 className="text-lg font-semibold text-gray-900">Gabarito</h3>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {Object.entries(draft.gabarito).map(([idx, value]) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Questão {idx}</label>
                    <input
                      className="input"
                      value={value}
                      onChange={(event) => updateGabaritoEntry(Number(idx), event.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
