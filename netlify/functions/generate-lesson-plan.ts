import type { Handler } from "@netlify/functions"
import { callAzureChat, azureConfigured } from "./lib/azureOpenAI"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
}

const MAX_COMPLETION_TOKENS = 8000

export const handler: Handler = async (event) => {
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

  try {
    const body = JSON.parse(event.body || "{}")
    const { tema, objetivos, metodologia, recursos, avaliacao } = body

    const prompt = `
Gere um plano de aula claro e estruturado em português.
Tema: ${tema || "(não informado)"}
Objetivos: ${objetivos || "(não informado)"}
Metodologia/Atividades: ${metodologia || "(não informado)"}
Recursos: ${recursos || "(não informado)"}
Avaliação: ${avaliacao || "(não informado)"}

Entregue no formato:
1. Título
2. Objetivos
3. Metodologia (etapas com tempo sugerido)
4. Recursos
5. Avaliação
6. Tarefas/Extensão opcional
`

    const text = await callAzureChat(
      [
        { role: "system", content: "Você é um assistente pedagógico do AvaliaPro. Responda em português do Brasil, de forma clara e estruturada." },
        { role: "user", content: prompt },
      ],
      { maxCompletionTokens: MAX_COMPLETION_TOKENS }
    )

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ plan: text }),
    }
  } catch (err: any) {
    console.error("[generate-lesson-plan]", err?.message || err)
    const status = Number(err?.status) || 500
    return {
      statusCode: status >= 400 && status < 600 ? status : 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err?.message || "Falha ao gerar o plano de aula." }),
    }
  }
}
