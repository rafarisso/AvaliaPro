import { useEffect, useRef, useState } from "react"
import { useAuth } from "../../../hooks/useAuth"
import { getSupabase } from "../../services/supabaseClient"
import { generateQuestionsWithAI, type GeneratedQuestion } from "../../services/ai"
import {
  exportAssessmentToPdf,
  exportAnswerKeyToPdf,
  type AssessmentForPdf,
  type AssessmentKeyForPdf,
} from "../../utils/exportAssessmentPdf"

type Questao = GeneratedQuestion & {
  alternativas: string[]
}

const NIVEIS = ["Fundamental I", "Fundamental II", "Ensino Médio"] as const
const DIFICULDADES = ["Fácil", "Médio", "Difícil"] as const

const DISCIPLINAS_POR_NIVEL: Record<(typeof NIVEIS)[number], string[]> = {
  "Fundamental I": [
    "Português",
    "Matemática",
    "Ciências",
    "História",
    "Geografia",
    "Artes",
    "Educação Física",
  ],
  "Fundamental II": [
    "Português",
    "Matemática",
    "História",
    "Geografia",
    "Ciências",
    "Inglês",
    "Educação Física",
    "Artes",
    "Espanhol",
  ],
  "Ensino Médio": [
    "Língua Portuguesa",
    "Literatura",
    "Matemática",
    "Biologia",
    "Física",
    "Química",
    "História",
    "Geografia",
    "Sociologia",
    "Filosofia",
    "Inglês",
    "Espanhol",
  ],
}

const TIPOS = ["Prova", "Lista de exercícios", "Atividade avaliativa", "Simulado"]

const DEFAULT_ALTERNATIVAS = ["", "", "", ""]
const MAX_DESCRICAO = 400
const MAX_FILES = 10
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export default function NovaAvaliacao() {
  const supabase = getSupabase()
  const { user } = useAuth()

  const [nivel, setNivel] = useState<(typeof NIVEIS)[number]>("Ensino Médio")
  const [disciplina, setDisciplina] = useState(DISCIPLINAS_POR_NIVEL["Ensino Médio"][0])
  const [titulo, setTitulo] = useState("")
  const [serie, setSerie] = useState("")
  const [tipo, setTipo] = useState(TIPOS[0])
  const [qtdObjetivas, setQtdObjetivas] = useState<number>(3)
  const [qtdDissertativas, setQtdDissertativas] = useState<number>(2)
  const [totalQuestoes, setTotalQuestoes] = useState<number>(5)
  const [valorTotal, setValorTotal] = useState<number>(10)
  const [dificuldade, setDificuldade] = useState<(typeof DIFICULDADES)[number]>("Médio")
  const [descricao, setDescricao] = useState("")
  const [descricaoErro, setDescricaoErro] = useState<string | null>(null)
  const [enunciadoGeral, setEnunciadoGeral] = useState("")

  const [temaIA, setTemaIA] = useState("")
  const [arquivos, setArquivos] = useState<File[]>([])
  const [anexosIA, setAnexosIA] = useState<{ name: string; type: string; data: string }[]>([])
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const [questoes, setQuestoes] = useState<Questao[]>([])

  const [loadingIA, setLoadingIA] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return
      const uid = data.user?.id
      if (uid) {
        await supabase.from("user_events").insert({ user_id: uid, event: "assessment_new_view" })
      }
    })
    return () => {
      active = false
    }
  }, [supabase])

  useEffect(() => {
    setDisciplina(DISCIPLINAS_POR_NIVEL[nivel][0])
  }, [nivel])

  const distribuirPontos = (total: number, quantidade: number) => {
    if (quantidade <= 0) return 1
    const valor = Number((total / quantidade).toFixed(2))
    setQuestoes((prev) => prev.map((q) => ({ ...q, valor })))
  }

  useEffect(() => {
    if (questoes.length) distribuirPontos(valorTotal, totalQuestoes || questoes.length)
  }, [valorTotal, totalQuestoes, questoes.length])

  const handleTotalChange = (val: number) => {
    setTotalQuestoes(val)
    setQtdDissertativas(Math.max(0, val - qtdObjetivas))
  }

  const handleObjetivasChange = (val: number) => {
    setQtdObjetivas(val)
    setTotalQuestoes(val + qtdDissertativas)
  }

  const handleDissertativasChange = (val: number) => {
    setQtdDissertativas(val)
    setTotalQuestoes(qtdObjetivas + val)
  }

  const fileToAttachment = (file: File): Promise<{ name: string; type: string; data: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(",")[1] || ""
        resolve({ name: file.name, type: file.type || "application/octet-stream", data: base64 })
      }
      reader.onerror = () => reject(new Error("Erro ao ler arquivo."))
      reader.readAsDataURL(file)
    })
  }

  const processFiles = async (incoming: File[]) => {
    if (!incoming.length) return
    setErro(null)
    const merged = [...arquivos, ...incoming]
    const limited = merged.slice(0, MAX_FILES)
    if (merged.length > MAX_FILES) {
      setErro(`Limite de ${MAX_FILES} arquivos. Somente os primeiros foram considerados.`)
    }

    const imageFiles = limited.filter((f) => f.type.startsWith("image/"))
    const allowedImages = imageFiles.filter((f) => f.size <= MAX_IMAGE_BYTES)
    if (allowedImages.length < imageFiles.length) {
      setErro(`Imagens acima de 5MB foram ignoradas.`)
    }

    try {
      const attachments = await Promise.all(allowedImages.map(fileToAttachment))
      setAnexosIA(attachments)
    } catch (e) {
      setErro("Nao foi possivel ler os arquivos de imagem. Tente novamente.")
    }

    setArquivos(limited)
  }

  const handleUploadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    void processFiles(files)
  }

  const handleCameraChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    void processFiles(files)
  }

  const handleDescricaoChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value
    if (value.length > MAX_DESCRICAO) {
      setDescricao(value.slice(0, MAX_DESCRICAO))
      setDescricaoErro(`Máximo de ${MAX_DESCRICAO} caracteres.`)
    } else {
      setDescricao(value)
      setDescricaoErro(null)
    }
  }

  const handleGerarIA = async () => {
    setErro(null)
    setMensagem(null)
    if (!temaIA.trim()) {
      setErro("Informe um tema para gerar sugestões.")
      return
    }
    try {
      setLoadingIA(true)
      const anexosNomes = arquivos.map((f) => f.name)
      const questoesGeradas = await generateQuestionsWithAI({
        tema: temaIA,
        disciplina,
        serieAno: serie,
        quantidade: totalQuestoes,
        objetivos: enunciadoGeral || descricao, // objetivo pedagógico ajuda a IA
        qtdObjetivas,
        qtdDissertativas,
        nivel,
        anexos: anexosNomes,
        attachments: anexosIA,
        valorTotal,
      })

      const questoesNormalizadas: Questao[] = questoesGeradas.map((q) => ({
        tipo: q.tipo,
        enunciado: q.enunciado,
        alternativas: q.alternativas && q.alternativas.length ? q.alternativas : [...DEFAULT_ALTERNATIVAS],
        resposta_correta: q.resposta_correta,
        valor: q.valor,
      }))

      setQuestoes(questoesNormalizadas)
      setMensagem("Sugestões geradas com sucesso. Edite antes de salvar.")
    } catch (error: any) {
      console.error("[IA]", error)
      const msg = String(error?.message || "")
      if (msg.includes("404")) setErro("Erro ao conectar à API do Gemini (modelo não encontrado). Ajuste o modelo ou tente novamente.")
      else if (msg.includes("401") || msg.includes("403")) setErro("Chave de API inválida ou sem permissão. Verifique VITE_GEMINI_API_KEY.")
      else if (msg.includes("429")) setErro("Limite de requisições atingido. Tente novamente em alguns minutos.")
      else setErro("Erro ao conectar à API do Gemini. Verifique a chave e tente novamente.")
    } finally {
      setLoadingIA(false)
    }
  }

  const handleSalvar = async () => {
    setErro(null)
    setMensagem(null)
    if (!titulo.trim()) return setErro("Título é obrigatório.")
    if (!disciplina.trim()) return setErro("Disciplina é obrigatória.")
    if (!questoes.length) return setErro("Inclua ao menos 1 questão antes de salvar.")
    if (totalQuestoes !== questoes.length) {
      return setErro("A soma de objetivas + discursivas deve bater com o total de questões.")
    }

    try {
      setSaving(true)
      const { data: inserted, error } = await supabase
        .from("assessments")
        .insert({
          titulo,
          disciplina,
          serie,
          tipo,
          descricao,
          valor_total: valorTotal,
          qtd_objetivas: qtdObjetivas,
          qtd_dissertativas: qtdDissertativas,
          user_id: user?.id ?? null,
          nivel,
          dificuldade,
          enunciado_geral: enunciadoGeral,
        })
        .select("id")
        .single()

      if (error) throw error
      const assessmentId = inserted?.id
      if (!assessmentId) throw new Error("Não foi possível obter o ID da avaliação.")

      const itemsPayload = questoes.map((q, index) => ({
        assessment_id: assessmentId,
        ordem: index + 1,
        tipo: q.tipo,
        enunciado: q.enunciado,
        alternativas: q.tipo === "objetiva" ? q.alternativas : null,
        resposta_correta: q.tipo === "objetiva" ? q.resposta_correta : q.resposta_correta || q.enunciado,
        valor: q.valor,
        tags: [disciplina, serie, nivel, dificuldade].filter(Boolean),
      }))

      const { error: itemsError } = await supabase.from("assessment_items").insert(itemsPayload)
      if (itemsError) throw itemsError

      setMensagem("Avaliação salva com sucesso.")
    } catch (error: any) {
      console.error("[Salvar]", error)
      setErro(error?.message ?? "Não foi possível salvar a avaliação.")
    } finally {
      setSaving(false)
    }
  }

  const atualizarQuestao = (index: number, changes: Partial<Questao>) => {
    setQuestoes((prev) => {
      const copia = [...prev]
      copia[index] = { ...copia[index], ...changes }
      return copia
    })
  }

  const atualizarAlternativa = (qIndex: number, altIndex: number, valor: string) => {
    setQuestoes((prev) => {
      const copia = [...prev]
      const q = copia[qIndex]
      const alternativas = [...(q.alternativas || DEFAULT_ALTERNATIVAS)]
      alternativas[altIndex] = valor
      copia[qIndex] = { ...q, alternativas }
      return copia
    })
  }

  const removerQuestao = (index: number) => {
    setQuestoes((prev) => prev.filter((_, i) => i !== index))
  }

  const adicionarQuestaoVazia = (tipo: "objetiva" | "discursiva") => {
    const novos: Questao = {
      tipo,
      enunciado: "",
      alternativas: tipo === "objetiva" ? [...DEFAULT_ALTERNATIVAS] : [],
      resposta_correta: "",
      pontos: 1,
      valor: 1,
    }
    setQuestoes((prev) => [...prev, novos])
  }

  const moverQuestao = (index: number, direcao: "up" | "down") => {
    setQuestoes((prev) => {
      const copia = [...prev]
      const target = direcao === "up" ? index - 1 : index + 1
      if (target < 0 || target >= copia.length) return prev
      const temp = copia[target]
      copia[target] = copia[index]
      copia[index] = temp
      return copia
    })
  }

  const disciplinas = DISCIPLINAS_POR_NIVEL[nivel]

  
  const handleExportPdf = () => {
    if (!questoes.length) {
      alert("Gere ou adicione questoes antes de exportar o PDF.")
      return
    }
    const payload: AssessmentForPdf = {
      titulo,
      disciplina,
      nivel,
      serie,
      tipo,
      enunciadoGeral,
      questoes: questoes.map((q) => ({
        tipo: q.tipo,
        enunciado: q.enunciado,
        alternativas: q.tipo === "objetiva" ? q.alternativas : undefined,
        valor: q.valor,
      })),
    }
    try {
      exportAssessmentToPdf(payload)
    } catch (error: any) {
      console.error("[PDF]", error)
      alert(error?.message ?? "Nao foi possivel gerar o PDF.")
    }
  }

  const handleExportAnswerKeyPdf = () => {
    if (!questoes.length) {
      alert("Gere ou adicione questoes antes de exportar o gabarito.")
      return
    }
    const payload: AssessmentKeyForPdf = {
      titulo,
      disciplina,
      nivel,
      serie,
      tipo,
      questoes: questoes.map((q) => ({
        tipo: q.tipo,
        enunciado: q.enunciado,
        alternativas: q.tipo === "objetiva" ? q.alternativas : undefined,
        resposta_correta: q.resposta_correta,
        valor: q.valor,
      })),
    }
    try {
      exportAnswerKeyToPdf(payload)
    } catch (error: any) {
      console.error("[PDF-Gabarito]", error)
      alert(error?.message ?? "Nao foi possivel gerar o gabarito em PDF.")
    }
  }
return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Criar avaliação</h1>
        <p className="text-gray-600">
          Monte avaliações em minutos. Sugira questões com IA e ajuste antes de salvar.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* BLOCO PRINCIPAL */}
          <div className="rounded-2xl bg-white p-5 shadow">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="titulo">
                  Título da avaliação
                </label>
                <input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex.: Prova bimestral - Revolução Industrial"
                  required
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="nivel">
                    Nível de ensino
                  </label>
                  <select
                    id="nivel"
                    value={nivel}
                    onChange={(e) => setNivel(e.target.value as (typeof NIVEIS)[number])}
                    className="mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {NIVEIS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="disciplina">
                    Disciplina
                  </label>
                  <select
                    id="disciplina"
                    value={disciplina}
                    onChange={(e) => setDisciplina(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {disciplinas.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="serie">
                    Série/Ano
                  </label>
                  <input
                    id="serie"
                    value={serie}
                    onChange={(e) => setSerie(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ex.: 8º ano A"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="tipo">
                    Tipo de avaliação
                  </label>
                  <select
                    id="tipo"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="quantidade">
                    Total de questões
                  </label>
                  <input
                    id="quantidade"
                    type="number"
                    min={1}
                    max={50}
                    value={totalQuestoes}
                    onChange={(e) => handleTotalChange(parseInt(e.target.value || "0", 10))}
                    className="mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="objetivas">
                    Questões objetivas
                  </label>
                  <input
                    id="objetivas"
                    type="number"
                    min={0}
                    max={50}
                    value={qtdObjetivas}
                    onChange={(e) => handleObjetivasChange(parseInt(e.target.value || "0", 10))}
                    className="mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="dissertativas">
                    Questões dissertativas
                  </label>
                  <input
                    id="dissertativas"
                    type="number"
                    min={0}
                    max={50}
                    value={qtdDissertativas}
                    onChange={(e) => handleDissertativasChange(parseInt(e.target.value || "0", 10))}
                    className="mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="valorTotal">
                    Valor total da prova/atividade
                  </label>
                  <input
                    id="valorTotal"
                    type="number"
                    min={0}
                    step={0.5}
                    value={valorTotal}
                    onChange={(e) => setValorTotal(parseFloat(e.target.value || "0"))}
                    className="mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="dificuldade">
                    Nível de dificuldade
                  </label>
                  <select
                    id="dificuldade"
                    value={dificuldade}
                    onChange={(e) => setDificuldade(e.target.value as (typeof DIFICULDADES)[number])}
                    className="mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {DIFICULDADES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="enunciadoGeral">
                  Enunciado geral / instruções ao aluno
                </label>
                <textarea
                  id="enunciadoGeral"
                  value={enunciadoGeral}
                  onChange={(e) => setEnunciadoGeral(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                  placeholder="Instruções gerais para a prova (opcional)"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="descricao">
                  Descrição / objetivo da avaliação
                </label>
                <textarea
                  id="descricao"
                  value={descricao}
                  onChange={handleDescricaoChange}
                  className="mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Ex.: Avaliar o conhecimento dos alunos sobre rochas e minerais, identificando se reconhecem tipos de rochas, processos de formação e interpretação de mapas."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Descreva em poucas frases o que você quer avaliar (conteúdos, habilidades, competências).
                  Isso ajuda a IA a sugerir questões melhores. Máx. {MAX_DESCRICAO} caracteres.
                </p>
                {descricaoErro && (
                  <p className="mt-1 text-xs text-red-500">
                    {descricaoErro}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* BLOCO IA */}
          <div className="rounded-2xl bg-white p-5 shadow space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Gerar com IA</h3>
                <p className="text-sm text-gray-600">Descreva o tema, anexe material e receba sugestões.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => adicionarQuestaoVazia("objetiva")}
                  className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  + Objetiva
                </button>
                <button
                  type="button"
                  onClick={() => adicionarQuestaoVazia("discursiva")}
                  className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  + Discursiva
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Enviar material (imagens, ate 10)</label>
              <div className="flex flex-wrap gap-2">
                <label className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50 cursor-pointer">
                  Selecionar arquivos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUploadChange}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Tirar foto
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleCameraChange}
                  className="hidden"
                />
              </div>
              {arquivos.length > 0 && (
                <ul className="text-sm text-gray-600 space-y-1">
                  {arquivos.map((file, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      {file.name}
                    </li>
                  ))}
                </ul>
              )}
              {/* Para conectar a um upload real, suba os arquivos para Supabase Storage e passe as URLs no prompt/metadata. */}
            </div>

            <textarea
              value={temaIA}
              onChange={(e) => setTemaIA(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Ex.: Revolução Industrial — 2º ano EM"
            />

            <button
              type="button"
              onClick={handleGerarIA}
              disabled={loadingIA}
              className="rounded-xl bg-blue-600 px-4 py-2 text-white text-sm font-medium transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loadingIA ? "Gerando..." : "Sugerir questões com IA"}
            </button>
          </div>

          {/* BLOCO QUESTÕES */}
          <div className="rounded-2xl bg-white p-5 shadow space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Questões</h3>
              <span className="text-sm text-gray-500">{questoes.length} item(s)</span>
            </div>

            {questoes.length === 0 && (
              <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-gray-500 space-y-2">
                <p>Gere com IA ou adicione manualmente as questões aqui.</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => adicionarQuestaoVazia("objetiva")}
                    className="rounded-xl border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                  >
                    + Objetiva
                  </button>
                  <button
                    type="button"
                    onClick={() => adicionarQuestaoVazia("discursiva")}
                    className="rounded-xl border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                  >
                    + Discursiva
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {questoes.map((q, index) => (
                <div key={index} className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      Questão {index + 1} · {q.tipo === "objetiva" ? "Objetiva" : "Discursiva"}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => moverQuestao(index, "up")}
                        className="text-xs text-gray-600 hover:underline"
                      >
                        Subir
                      </button>
                      <button
                        type="button"
                        onClick={() => moverQuestao(index, "down")}
                        className="text-xs text-gray-600 hover:underline"
                      >
                        Descer
                      </button>
                      <button
                        type="button"
                        onClick={() => removerQuestao(index)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Enunciado</label>
                      <textarea
                        value={q.enunciado}
                        onChange={(e) => atualizarQuestao(index, { enunciado: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Pontos</label>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={q.valor}
                        onChange={(e) => atualizarQuestao(index, { valor: Number(e.target.value || 0) })}
                        className="w-28 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <label className="mt-3 block text-sm font-medium text-gray-700">Tipo</label>
                      <select
                        value={q.tipo}
                        onChange={(e) => atualizarQuestao(index, { tipo: e.target.value as Questao["tipo"] })}
                        className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="objetiva">Objetiva</option>
                        <option value="discursiva">Discursiva</option>
                      </select>
                    </div>
                  </div>

                  {q.tipo === "objetiva" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Alternativas</label>
                      <div className="grid gap-2 md:grid-cols-2">
                        {q.alternativas.map((alt, altIdx) => (
                          <div key={altIdx} className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-600 w-5">
                              {String.fromCharCode(65 + altIdx)}.
                            </span>
                            <input
                              value={alt}
                              onChange={(e) => atualizarAlternativa(index, altIdx, e.target.value)}
                              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <input
                              type="radio"
                              name={`correct-${index}`}
                              checked={q.resposta_correta === String.fromCharCode(65 + altIdx)}
                              onChange={() =>
                                atualizarQuestao(index, { resposta_correta: String.fromCharCode(65 + altIdx) })
                              }
                            />
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-green-700">
                        Gabarito:{" "}
                        {q.resposta_correta
                          ? `${q.resposta_correta} ${
                              q.alternativas?.[q.resposta_correta.charCodeAt(0) - 65] || ""
                            }`.trim()
                          : "—"}
                      </div>
                    </div>
                  )}

                  {q.tipo === "discursiva" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Gabarito / Resumo da resposta</label>
                      <textarea
                        value={q.resposta_correta || ""}
                        onChange={(e) => atualizarQuestao(index, { resposta_correta: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={2}
                      />
                      <div className="text-xs text-green-700">
                        Resposta esperada: {q.resposta_correta || "—"}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* botões extras para adicionar questão no final da página */}
            {questoes.length > 0 && (
              <div className="flex justify-end gap-2 pt-3 border-t mt-2">
                <button
                  type="button"
                  onClick={() => adicionarQuestaoVazia("objetiva")}
                  className="rounded-xl border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                >
                  + Objetiva
                </button>
                <button
                  type="button"
                  onClick={() => adicionarQuestaoVazia("discursiva")}
                  className="rounded-xl border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                >
                  + Discursiva
                </button>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA RESUMO / AÇÕES */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow space-y-3">
            <h3 className="text-lg font-semibold">Resumo</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                <strong>Disciplina:</strong> {disciplina}
              </li>
              <li>
                <strong>Nível:</strong> {nivel}
              </li>
              <li>
                <strong>Série/ano:</strong> {serie || "Não informado"}
              </li>
              <li>
                <strong>Tipo:</strong> {tipo}
              </li>
              <li>
                <strong>Questões:</strong> {questoes.length}
              </li>
              <li>
                <strong>Valor total:</strong> {valorTotal}
              </li>
              <li>
                <strong>Obj/Dis:</strong> {qtdObjetivas} / {qtdDissertativas}
              </li>
              <li>
                <strong>Dificuldade:</strong> {dificuldade}
              </li>
            </ul>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="w-full rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Pré-visualizar prova
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="w-full rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Baixar prova em PDF
              </button>
              <button
                type="button"
                onClick={handleExportAnswerKeyPdf}
                className="w-full rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Baixar gabarito em PDF
              </button>
              <button
                type="button"
                onClick={handleSalvar}
                disabled={saving}
                className="w-full rounded-xl bg-blue-600 px-4 py-2 text-white text-sm font-medium transition hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar avaliação"}
              </button>
            </div>
            {mensagem && <p className="text-sm text-green-600">{mensagem}</p>}
            {erro && <p className="text-sm text-red-600 whitespace-pre-wrap">{erro}</p>}
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Pré-visualização da prova</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
              >
                Fechar
              </button>
            </div>
            {enunciadoGeral && (
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{enunciadoGeral}</div>
            )}
            <div className="space-y-3">
              {questoes.map((q, index) => (
                <div key={`prev-${index}`} className="space-y-2 rounded-lg border p-3">
                  <div className="text-sm font-semibold text-gray-700">
                    {index + 1}. {q.enunciado}
                  </div>
                  {q.tipo === "objetiva" && (
                    <ul className="space-y-1 text-sm text-gray-700">
                      {q.alternativas.map((alt, altIdx) => (
                        <li key={altIdx}>
                          <span className="font-semibold">
                            {String.fromCharCode(65 + altIdx)}.
                          </span>{" "}
                          {alt}
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.tipo === "objetiva" && (
                    <div className="text-xs text-green-700">
                      Gabarito:{" "}
                      {q.resposta_correta
                        ? `${q.resposta_correta} ${
                            q.alternativas?.[q.resposta_correta.charCodeAt(0) - 65] || ""
                          }`.trim()
                        : "—"}
                    </div>
                  )}
                  {q.tipo === "discursiva" && (
                    <>
                      <div className="text-sm text-gray-600 italic">
                        Resposta esperada: {q.resposta_correta || "—"}
                      </div>
                      {/* linhas visuais para o aluno responder na visualização */}
                      <div className="mt-2 space-y-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="border-b border-dashed border-gray-300" />
                        ))}
                      </div>
                    </>
                  )}
                  <div className="text-xs text-gray-500">Valor: {q.valor} ponto(s)</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
