import type { Handler } from "@netlify/functions"
import { callAzureChat, azureConfigured, imagePart, textPart, type ChatPart } from "./lib/azureOpenAI"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
}

const MAX_ATTACHMENTS = 10
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024
// o4-mini é modelo de raciocínio: orçamento folgado p/ reasoning + JSON
const MAX_COMPLETION_TOKENS = 8000

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" }
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Metodo nao permitido." }),
    }
  }

  if (!azureConfigured()) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Azure OpenAI nao configurado no backend (AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY)." }),
    }
  }

  let payload: any
  try {
    payload = JSON.parse(event.body || "{}")
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "JSON invalido." }),
    }
  }

  const {
    tema,
    disciplina,
    serieAno,
    quantidade,
    objetivos,
    qtdObjetivas,
    qtdDissertativas,
    nivel,
    anexos,
    valorTotal,
    attachments,
  } = payload || {}

  const total = Number(quantidade) || 0
  const totalObjetivas = qtdObjetivas !== undefined ? Number(qtdObjetivas) : undefined
  const totalDissertativas = qtdDissertativas !== undefined ? Number(qtdDissertativas) : undefined
  const valorTotalNumber = valorTotal !== undefined ? Number(valorTotal) : undefined
  const attachmentsList: Attachment[] = Array.isArray(attachments) ? attachments : []
  const limitedAttachments = attachmentsList.slice(0, MAX_ATTACHMENTS).map((att) => ({
    name: att?.name || "",
    type: att?.type || "",
    data: att?.data || "",
  }))
  const imageAttachments = limitedAttachments.filter(
    (att) => att.data && att.type?.toLowerCase().startsWith("image/")
  )
  const safeAttachments = imageAttachments.filter((att) => {
    try {
      const size = Buffer.from(att.data, "base64").byteLength
      return size <= MAX_ATTACHMENT_BYTES
    } catch {
      return false
    }
  })
  const anexosNomes = Array.isArray(anexos) ? anexos : []
  const anexosFromAttachments = safeAttachments.map((att) => att.name).filter(Boolean)
  const anexosCombinados = [...new Set([...anexosNomes, ...anexosFromAttachments])]

  if (!tema || !disciplina || !total) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Campos obrigatorios faltando (tema, disciplina ou quantidade).",
      }),
    }
  }

  try {
    const defaultValue =
      total && valorTotalNumber ? Number((valorTotalNumber / total).toFixed(2)) : 1

    const userPrompt = buildPrompt({
      tema,
      disciplina,
      serieAno,
      quantidade: total,
      objetivos,
      qtdObjetivas: totalObjetivas,
      qtdDissertativas: totalDissertativas,
      nivel,
      anexos: anexosCombinados,
      valorTotal: valorTotalNumber,
    })

    const userContent: ChatPart[] = [
      textPart(userPrompt),
      ...safeAttachments.map((att) => imagePart(att.data, att.type || "image/jpeg")),
    ]

    const text = await callAzureChat(
      [
        {
          role: "system",
          content:
            "Voce e o motor pedagogico do AvaliaPro. Gera avaliacoes escolares em portugues do Brasil e responde sempre em JSON puro, sem markdown.",
        },
        { role: "user", content: userContent },
      ],
      { maxCompletionTokens: MAX_COMPLETION_TOKENS }
    )

    const parsed = parseQuestions(text, defaultValue, total)

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ questoes: parsed }),
    }
  } catch (error: any) {
    console.error("[generate-questions]", error?.message || error)
    const message = error?.message || "Falha ao gerar questoes."
    const status = Number(error?.status) || 500
    return {
      statusCode: status >= 400 && status < 600 ? status : 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: message }),
    }
  }
}

export { handler }

type PromptArgs = {
  tema: string
  disciplina: string
  serieAno?: string
  quantidade: number
  objetivos?: string
  qtdObjetivas?: number
  qtdDissertativas?: number
  nivel?: string
  anexos?: string[]
  valorTotal?: number
}

type Attachment = {
  name: string
  type: string
  data: string
}

function buildPrompt(args: PromptArgs): string {
  const { tema, disciplina, serieAno, quantidade, objetivos, qtdObjetivas, qtdDissertativas, nivel, anexos, valorTotal } =
    args

  const foco = objetivos ? `Objetivo pedagogico: ${objetivos}.` : ""
  const anexosTxt =
    anexos && anexos.length ? `Considere estes anexos ou materiais citados: ${anexos.join(", ")}.` : ""
  const valorTxt = valorTotal ? `Distribua os valores para somar ${valorTotal} pontos no total.` : ""

  return [
    "Gere questoes para avaliacao escolar e devolva apenas JSON puro.",
    `Tema: ${tema}. Disciplina: ${disciplina}.`,
    nivel ? `Nivel/segmento: ${nivel}.` : "",
    serieAno ? `Serie/ano: ${serieAno}.` : "",
    foco,
    anexosTxt,
    `Quantidade total: ${quantidade}. Objetivas: ${qtdObjetivas ?? "livre"}. Dissertativas: ${qtdDissertativas ?? "livre"}.`,
    valorTxt,
    "",
    "Formato obrigatorio da resposta (JSON puro, sem markdown):",
    `{"questoes":[{"tipo":"objetiva|discursiva","enunciado":"...","alternativas":["A","B","C","D"],"resposta_correta":"A","valor":1}]}`,
    "Para discursivas, SEMPRE preencha resposta_correta com 1-3 frases de gabarito (nunca deixe vazio).",
    "Para objetivas, inclua sempre resposta_correta como letra (A, B, C ou D).",
  ]
    .filter(Boolean)
    .join("\n")
}

function parseQuestions(text: string, defaultValue: number, quantidade: number) {
  const jsonString = extractJson(text)
  const raw = JSON.parse(jsonString)

  const list = Array.isArray(raw?.questoes) ? raw.questoes : Array.isArray(raw) ? raw : []
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("Resposta sem questoes.")
  }

  return list.slice(0, quantidade).map((item, index) => normalizeQuestion(item, index, defaultValue))
}

function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}/)
  if (match) return match[0]
  const arrMatch = text.match(/\[[\s\S]*\]/)
  if (arrMatch) return `{"questoes":${arrMatch[0]}}`
  return text.trim()
}

function normalizeQuestion(value: any, index: number, defaultValue: number) {
  const tipoRaw = String(value?.tipo || value?.type || "").toLowerCase()
  const tipo = tipoRaw.includes("dis") ? "discursiva" : "objetiva"

  const enunciado = String(value?.enunciado || value?.pergunta || value?.titulo || "").trim()

  const alternativasBase = Array.isArray(value?.alternativas) ? value.alternativas : []
  const alternativas = tipo === "objetiva" ? alternativasBase.map((alt: any) => String(alt || "")).slice(0, 4) : []
  while (tipo === "objetiva" && alternativas.length < 4) {
    alternativas.push("")
  }

  let resposta =
    value?.resposta_correta ||
    value?.resposta ||
    value?.resposta_esperada ||
    value?.gabarito ||
    (tipo === "objetiva" && alternativas.length ? "A" : "") ||
    ""

  if (tipo === "discursiva" && !resposta) {
    resposta = "Resposta não informada."
  }

  const valor = Number(value?.valor ?? defaultValue ?? 1) || defaultValue || 1

  if (!enunciado) {
    throw new Error(`Questao ${index + 1} sem enunciado.`)
  }

  return {
    tipo,
    enunciado,
    alternativas: tipo === "objetiva" ? alternativas : undefined,
    resposta_correta: String(resposta || "").trim(),
    valor,
  }
}
