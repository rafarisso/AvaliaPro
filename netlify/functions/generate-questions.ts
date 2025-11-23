import type { Handler } from "@netlify/functions"
import { GoogleGenerativeAI } from "@google/generative-ai"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
}

const RAW_MODEL = process.env.GEMINI_MODEL || process.env.VITE_GEMINI_MODEL || "gemini-2.0-flash"
const MODEL = RAW_MODEL.startsWith("models/") ? RAW_MODEL : `models/${RAW_MODEL}`

const API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GENAI_API_KEY ||
  process.env.VITE_GEMINI_API_KEY ||
  process.env.API_KEY

const MAX_ATTACHMENTS = 10
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024

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

  if (!API_KEY) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "GEMINI_API_KEY nao configurada no backend." }),
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
    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: MODEL })

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

    const parts = [{ text: userPrompt }, ...buildInlineParts(safeAttachments)]

    const response = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1200,
      },
    })

    const text = response.response.text()
    const parsed = parseQuestions(text, defaultValue, total)

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ questoes: parsed }),
    }
  } catch (error: any) {
    console.error("[generate-questions]", error)
    const message = error?.message || "Falha ao gerar questoes."
    return {
      statusCode: 500,
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
    "Formato obrigatorio da resposta:",
    `{"questoes":[{"tipo":"objetiva|discursiva","enunciado":"...","alternativas":["A","B","C","D"],"resposta_correta":"A","valor":1}]}`,
    "Sem markdown, sem ```.",
  ]
    .filter(Boolean)
    .join("\n")
}

function buildInlineParts(attList: Attachment[]) {
  return attList
    .filter((att) => att.data)
    .map((att) => ({
      inlineData: {
        data: att.data,
        mimeType: att.type || "application/octet-stream",
      },
    }))
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

  const resposta =
    value?.resposta_correta ||
    value?.gabarito ||
    (tipo === "objetiva" && alternativas.length ? "A" : "") ||
    ""

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
