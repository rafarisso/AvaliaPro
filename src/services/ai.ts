// src/services/ai.ts
// Agora o front NÃO chama mais o Gemini diretamente.
// Ele chama a função serverless "/.netlify/functions/generate-questions".

export type GeneratedQuestion = {
  tipo: "objetiva" | "discursiva"
  enunciado: string
  alternativas?: string[]
  resposta_correta?: string
  valor: number
}

export type GenerateParams = {
  tema: string
  disciplina: string
  serieAno: string
  quantidade: number
  objetivos?: string
  qtdObjetivas?: number
  qtdDissertativas?: number
  nivel?: string
  anexos?: string[]
  valorTotal?: number
  attachments?: { name: string; type: string; data: string }[]
}

const FUNCTIONS_BASE =
  (typeof window !== "undefined" && (window as any).ENV?.VITE_FUNCTIONS_BASE_URL) ||
  import.meta.env.VITE_FUNCTIONS_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:8888/.netlify/functions" : "/.netlify/functions")

/**
 * Chama a função serverless que fala com o Gemini.
 */
export async function generateQuestionsWithAI(params: GenerateParams): Promise<GeneratedQuestion[]> {
  const base = FUNCTIONS_BASE.replace(/\/$/, "")
  const url = `${base}/generate-questions`

  let resp: Response
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
  } catch (error: any) {
    throw new Error(
      `Nao foi possivel acessar a funcao de IA. Verifique se o Netlify dev esta rodando (functions em ${url}) ou defina VITE_FUNCTIONS_BASE_URL apontando para o deploy.`
    )
  }

  if (!resp.ok) {
    let msg = "Erro ao chamar a IA. Tente novamente em alguns minutos."
    try {
      const data = await resp.json()
      if (data?.error) msg = data.error
    } catch {
      // ignora parse error
    }
    throw new Error(msg)
  }

  const data = await resp.json()

  if (!Array.isArray(data.questoes)) {
    throw new Error("Resposta inesperada da IA. Tente novamente.")
  }

  return data.questoes as GeneratedQuestion[]
}
