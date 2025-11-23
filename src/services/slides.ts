export type Slide = {
  titulo: string
  topicos: string[]
  nota?: string
}

type SlideParams = {
  tema: string
  disciplina?: string
  serie?: string
  objetivos?: string
  attachments?: { name: string; type: string; data: string }[]
}

const FUNCTIONS_BASE =
  (typeof window !== "undefined" && (window as any).ENV?.VITE_FUNCTIONS_BASE_URL) ||
  import.meta.env.VITE_FUNCTIONS_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:8888/.netlify/functions" : "/.netlify/functions")

export async function generateSlides(params: SlideParams): Promise<Slide[]> {
  const base = FUNCTIONS_BASE.replace(/\/$/, "")
  const url = `${base}/generate-slides`

  let resp: Response
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
  } catch (error: any) {
    throw new Error(
      `Nao foi possivel acessar a funcao de slides. Verifique se o Netlify dev esta rodando (functions em ${url}) ou defina VITE_FUNCTIONS_BASE_URL apontando para o deploy.`
    )
  }

  if (!resp.ok) {
    let msg = "Erro ao gerar slides. Tente novamente."
    try {
      const data = await resp.json()
      if (data?.error) msg = data.error
    } catch {
      // ignore
    }
    throw new Error(msg)
  }

  const data = await resp.json()
  if (!Array.isArray(data.slides)) {
    throw new Error("Resposta inesperada ao gerar slides.")
  }
  return data.slides as Slide[]
}
