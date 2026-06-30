import type { Handler } from "@netlify/functions"
import { callAzureChat, azureConfigured, imagePart, textPart, type ChatPart } from "./lib/azureOpenAI"

type SlideRequest = {
  tema: string
  disciplina?: string
  serie?: string
  objetivos?: string
  attachments?: { name: string; type: string; data: string }[]
}

type Slide = {
  titulo: string
  topicos: string[]
  nota?: string
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
}

const MAX_ATTACHMENTS = 5
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024
const MAX_COMPLETION_TOKENS = 8000

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" }
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: "Metodo nao permitido." }) }
  }

  if (!azureConfigured()) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Azure OpenAI nao configurado no backend (AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY)." }),
    }
  }

  let payload: SlideRequest
  try {
    payload = JSON.parse(event.body || "{}")
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "JSON invalido." }) }
  }

  const { tema, disciplina, serie, objetivos, attachments } = payload || {}
  if (!tema) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Campo tema é obrigatório." }) }
  }

  const attList = Array.isArray(attachments) ? attachments.slice(0, MAX_ATTACHMENTS) : []
  const imageAttachments = attList
    .map((att) => ({
      name: att?.name || "",
      type: att?.type || "",
      data: att?.data || "",
    }))
    .filter((att) => att.data && att.type?.toLowerCase().startsWith("image/"))
    .filter((att) => {
      try {
        return Buffer.from(att.data, "base64").byteLength <= MAX_ATTACHMENT_BYTES
      } catch {
        return false
      }
    })

  try {
    const userPrompt = buildPrompt({ tema, disciplina, serie, objetivos })
    const userContent: ChatPart[] = [
      textPart(userPrompt),
      ...imageAttachments.map((att) => imagePart(att.data, att.type || "image/jpeg")),
    ]

    const text = await callAzureChat(
      [
        {
          role: "system",
          content: "Voce e o motor pedagogico do AvaliaPro. Cria roteiros de slides para aula em portugues do Brasil e responde sempre em JSON puro, sem markdown.",
        },
        { role: "user", content: userContent },
      ],
      { maxCompletionTokens: MAX_COMPLETION_TOKENS }
    )

    const slides = parseSlides(text)

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ slides }),
    }
  } catch (error: any) {
    console.error("[generate-slides]", error?.message || error)
    const status = Number(error?.status) || 500
    const message = error?.message || "Falha ao gerar slides."
    return { statusCode: status >= 400 && status < 600 ? status : 500, headers: corsHeaders, body: JSON.stringify({ error: message }) }
  }
}

export { handler }

function buildPrompt(args: { tema: string; disciplina?: string; serie?: string; objetivos?: string }) {
  const { tema, disciplina, serie, objetivos } = args
  return [
    "Gere um esquema de slides em JSON puro (sem markdown).",
    `Tema: ${tema}.`,
    disciplina ? `Disciplina: ${disciplina}.` : "",
    serie ? `Serie/ano: ${serie}.` : "",
    objetivos ? `Objetivo da aula: ${objetivos}.` : "",
    "Cada slide deve ter: titulo, topicos (3-5 bullets) e opcional nota.",
    "Formato JSON: {\"slides\":[{\"titulo\":\"...\",\"topicos\":[\"...\"],\"nota\":\"...\"}]}",
    "Use linguagem clara, concisa e coerente para aula.",
  ]
    .filter(Boolean)
    .join("\n")
}

function parseSlides(text: string): Slide[] {
  const jsonString = extractJson(text)
  const raw = JSON.parse(jsonString)
  const list = Array.isArray(raw?.slides) ? raw.slides : Array.isArray(raw) ? raw : []
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("Resposta sem slides.")
  }
  return list.map((s: any) => ({
    titulo: String(s?.titulo || s?.title || "").trim(),
    topicos: Array.isArray(s?.topicos) ? s.topicos.map((t: any) => String(t || "")).filter(Boolean) : [],
    nota: s?.nota ? String(s.nota) : s?.observacao ? String(s.observacao) : undefined,
  }))
}

function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}/)
  if (match) return match[0]
  const arrMatch = text.match(/\[[\s\S]*\]/)
  if (arrMatch) return `{"slides":${arrMatch[0]}}`
  return text.trim()
}
