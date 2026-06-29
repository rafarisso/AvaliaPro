// Camada compartilhada de acesso ao Azure OpenAI (deployment o4-mini).
// Usada pelas funções serverless. NUNCA importar isto no frontend.
//
// Particularidades dos modelos da família "o" (raciocínio):
//  - NÃO aceitam temperature / top_p.
//  - O raciocínio consome o orçamento de tokens, então use max_completion_tokens
//    folgado (senão a resposta volta vazia com finish_reason "length").

const ENDPOINT = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/$/, "")
const API_KEY = process.env.AZURE_OPENAI_API_KEY || ""
const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || "o4-mini"
const API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-12-01-preview"

export type ChatPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string | ChatPart[] }

export function azureConfigured(): boolean {
  return Boolean(ENDPOINT && API_KEY)
}

export function azureDeployment(): string {
  return DEPLOYMENT
}

export function textPart(text: string): ChatPart {
  return { type: "text", text }
}

export function imagePart(base64: string, mimeType = "image/jpeg"): ChatPart {
  return { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } }
}

/**
 * Chama o endpoint de chat completions do Azure OpenAI e devolve o texto.
 * Lança erro com .status em caso de falha HTTP ou resposta vazia.
 */
export async function callAzureChat(
  messages: ChatMessage[],
  opts: { maxCompletionTokens?: number } = {}
): Promise<string> {
  if (!ENDPOINT || !API_KEY) {
    const err: any = new Error("Azure OpenAI não configurado: defina AZURE_OPENAI_ENDPOINT e AZURE_OPENAI_API_KEY.")
    err.status = 500
    throw err
  }

  const url = `${ENDPOINT}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": API_KEY },
    body: JSON.stringify({
      messages,
      // sem temperature/top_p — a família "o" não aceita
      max_completion_tokens: opts.maxCompletionTokens ?? 8000,
    }),
  })

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "")
    const err: any = new Error(traduzErroAzure(resp.status, detail))
    err.status = resp.status
    throw err
  }

  const data: any = await resp.json()
  const choice = data?.choices?.[0]
  const content = choice?.message?.content

  if (!content || (typeof content === "string" && !content.trim())) {
    const err: any = new Error(
      `Modelo retornou resposta vazia (finish_reason: ${choice?.finish_reason ?? "?"}). ` +
        "Pode ser limite de tokens — aumente max_completion_tokens."
    )
    err.status = 502
    throw err
  }

  return typeof content === "string" ? content : ""
}

function traduzErroAzure(status: number, detail: string): string {
  if (status === 401 || status === 403) return "Chave da Azure inválida ou sem permissão (verifique AZURE_OPENAI_API_KEY)."
  if (status === 404) return "Deployment não encontrado (verifique AZURE_OPENAI_DEPLOYMENT e a api-version)."
  if (status === 429) return "Limite de cota/requisições da Azure atingido. Tente novamente em instantes."
  const trecho = (detail || "").slice(0, 300)
  return `Erro Azure OpenAI ${status}${trecho ? `: ${trecho}` : "."}`
}
