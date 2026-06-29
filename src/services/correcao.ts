// Chama a função serverless "/.netlify/functions/corrigir-prova",
// que lê as imagens no Storage, corrige com Gemini Vision e grava o resultado.

const FUNCTIONS_BASE =
  (typeof window !== "undefined" && (window as any).ENV?.VITE_FUNCTIONS_BASE_URL) ||
  import.meta.env.VITE_FUNCTIONS_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:8888/.netlify/functions" : "/.netlify/functions")

export type RespostaCorrigida = {
  submissao_id: string
  questao_id: string
  resposta_extraida: string
  correta: boolean
  pontos_obtidos: number
  confianca: number
  feedback_ia: string
}

export type CorrecaoResult = {
  submissao_id: string
  nota_final: number
  total_questoes: number
  respostas: RespostaCorrigida[]
}

export async function corrigirSubmissao(submissaoId: string): Promise<CorrecaoResult> {
  const base = FUNCTIONS_BASE.replace(/\/$/, "")
  const url = `${base}/corrigir-prova`

  let resp: Response
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissao_id: submissaoId }),
    })
  } catch {
    throw new Error(
      "Não foi possível acessar a função de correção. Em ambiente local ela depende do `netlify dev`; em produção, do deploy publicado."
    )
  }

  if (!resp.ok) {
    let msg = "Erro ao corrigir a prova. Tente novamente em alguns minutos."
    try {
      const data = await resp.json()
      if (data?.error) msg = data.error
    } catch {
      /* ignora parse error */
    }
    throw new Error(msg)
  }

  return (await resp.json()) as CorrecaoResult
}
