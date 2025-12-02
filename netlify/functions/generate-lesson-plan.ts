import { GoogleGenerativeAI } from "@google/generative-ai"

const MODEL = process.env.VITE_GEMINI_MODEL || "gemini-2.0-flash"
const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY

export const handler = async (event) => {
  try {
    if (!API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing Gemini API key" }) }
    }

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
    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: MODEL })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return { statusCode: 200, body: JSON.stringify({ plan: text }) }
  } catch (err: any) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate plan" }) }
  }
}
