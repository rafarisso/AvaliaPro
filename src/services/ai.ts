import { GoogleGenerativeAI } from "@google/generative-ai"

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
}

/**
 * Recupera a chave da API do Gemini a partir das variáveis de ambiente (dev e produção).
 */
export function getGeminiApiKey(): string {
  return (
    (typeof window !== "undefined" && (window as any).ENV?.VITE_GEMINI_API_KEY) ||
    (typeof window !== "undefined" && (window as any).ENV?.GEMINI_API_KEY) ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    (import.meta.env as any).GEMINI_API_KEY ||
    ""
  )
}

/**
 * Chama a API do Gemini e retorna questões estruturadas.
 * Usa modelo compatível com o endpoint suportado pelo SDK atual.
 */
export async function generateQuestionsWithAI(params: GenerateParams): Promise<GeneratedQuestion[]> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) throw new Error("Chave da API do Gemini não configurada.")

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
  } = params

  const envModel =
    import.meta.env.VITE_GEMINI_MODEL ||
    (import.meta.env as any).GEMINI_MODEL ||
    (typeof window !== "undefined" && (window as any).ENV?.VITE_GEMINI_MODEL)

  // modelos compatíveis para o SDK @google/generative-ai (usa v1 sob o capô)
  const modelCandidates = [
    envModel,
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-pro",
  ].filter(Boolean) as string[]

  const prompt = buildPrompt({
    tema,
    disciplina,
    serieAno,
    quantidade,
    objetivos,
    qtdObjetivas,
    qtdDissertativas,
    nivel,
    anexos,
  })

  const genAI = new GoogleGenerativeAI(apiKey)
  let texto: string | undefined
  let lastError: any

  for (const nome of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({ model: nome })
      const result = await model.generateContent(prompt)
      texto = result.response.text()
      break
    } catch (error) {
      lastError = error
      console.warn("[AI] Falha com modelo", nome, error)
      continue
    }
  }

  if (!texto) {
    const friendly = friendlyError(lastError)
    throw new Error(friendly)
  }

  const parsed = parseQuestions(texto, quantidade, valorTotal)
  if (!parsed.length) {
    throw new Error("Não foi possível interpretar as questões geradas pela IA.")
  }
  return parsed
}

function buildPrompt(params: {
  tema: string
  disciplina: string
  serieAno: string
  quantidade: number
  objetivos?: string
  qtdObjetivas?: number
  qtdDissertativas?: number
  nivel?: string
  anexos?: string[]
}): string {
  const materiais = params.anexos?.length ? `Use como referência os arquivos: ${params.anexos.join(", ")}.` : ""
  return [
    `Gere ${params.quantidade} questões em português do Brasil sobre "${params.tema}".`,
    `Disciplina: ${params.disciplina}. Série/Ano: ${params.serieAno || "não informado"}. Nível: ${
      params.nivel || "não informado"
    }.`,
    `Quantidade de objetivas: ${params.qtdObjetivas ?? "não informado"}. Quantidade de discursivas: ${
      params.qtdDissertativas ?? "não informado"
    }.`,
    params.objetivos ? `Objetivo/descrição: ${params.objetivos}.` : "",
    materiais,
    `Responda apenas em JSON no formato:`,
    `[{"tipo":"objetiva|discursiva","enunciado":"...","alternativas":["A","B","C","D"],"resposta_correta":"A","valor":number}]`,
    `Para questões discursivas, omita "alternativas" e use "resposta_correta" como gabarito-resumo.`,
    `Mantenha exatamente ${params.quantidade} itens, sem texto extra fora do JSON.`,
  ]
    .filter(Boolean)
    .join(" ")
}

function parseQuestions(texto: string, quantidade: number, valorTotal?: number): GeneratedQuestion[] {
  const valorPadrao = quantidade > 0 && valorTotal ? Number((valorTotal / quantidade).toFixed(2)) : 1
  const clean = texto.trim().replace(/```json/gi, "").replace(/```/g, "")

  try {
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => normalizeQuestion(item, valorPadrao))
        .filter((q) => q.enunciado && (q.tipo === "discursiva" || (q.alternativas && q.alternativas.length > 0)))
    }
  } catch (_) {
    // continua para fallback
  }

  // fallback simples para linhas separadas
  const linhas = texto.split(/\n+/).filter((l) => l.trim().length > 0)
  const coletadas: GeneratedQuestion[] = []
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].replace(/^[-*\d.\s]+/, "").trim()
    if (!linha) continue
    const [enunciado, resp] = linha.split("Resposta:")
    coletadas.push({
      tipo: "discursiva",
      enunciado: enunciado.trim(),
      resposta_correta: (resp || "").trim(),
      valor: valorPadrao,
    })
  }
  return coletadas
}

function normalizeQuestion(item: any, valorPadrao: number): GeneratedQuestion {
  const tipo = (item.tipo || "").toLowerCase() === "objetiva" ? "objetiva" : "discursiva"
  const alternativas = Array.isArray(item.alternativas) ? item.alternativas.filter(Boolean) : undefined
  let resposta = item.resposta_correta || item.resposta || item.gabarito || ""

  if (tipo === "objetiva" && alternativas && resposta) {
    const idx = alternativas.findIndex(
      (alt) => alt.trim().toLowerCase() === resposta.trim().toLowerCase() || resposta.trim().toUpperCase() === alt
    )
    if (idx >= 0) resposta = String.fromCharCode(65 + idx) // A, B, C...
  }

  return {
    tipo,
    enunciado: item.enunciado || item.pergunta || "",
    alternativas,
    resposta_correta: resposta,
    valor: Number(item.valor || item.pontos) || valorPadrao,
  }
}

function friendlyError(error: any): string {
  const msg = (error?.message as string) || ""
  if (msg.includes("404")) return "Modelo do Gemini não encontrado. Ajuste VITE_GEMINI_MODEL para um modelo disponível (ex.: gemini-1.5-flash) e tente novamente."
  if (msg.includes("401") || msg.includes("403")) return "Chave de API inválida ou sem permissão. Verifique VITE_GEMINI_API_KEY."
  if (msg.includes("429")) return "Limite de requisições atingido. Tente novamente em alguns minutos."
  return "Erro ao conectar à API do Gemini. Verifique a chave de API ou tente novamente em alguns minutos."
}
