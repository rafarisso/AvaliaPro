/**
 * Chama a API do Gemini e retorna questões estruturadas.
 * Usa modelo compatível com o endpoint suportado pelo SDK atual.
 */
export async function generateQuestionsWithAI(
  params: GenerateParams
): Promise<GeneratedQuestion[]> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error(
      "Chave da API do Gemini não configurada. Verifique VITE_GEMINI_API_KEY (Netlify) e o .env.local."
    )
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
  } = params

  // Lê o modelo das envs **apenas do runtime (env.js)**, com fallback seguro
  const rawEnvModel =
    (typeof window !== "undefined" &&
      (window as any).ENV?.VITE_GEMINI_MODEL) ||
    (typeof window !== "undefined" && (window as any).ENV?.GEMINI_MODEL) ||
    ""

  const envModel =
    typeof rawEnvModel === "string" && rawEnvModel.trim().length > 0
      ? rawEnvModel.trim()
      : undefined

  // Ordem de tentativas: modelo da env -> 2.0-flash -> 1.5-flash
  const modelCandidates = [
    envModel,
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ]
    .filter(Boolean)
    .filter((m, i, arr) => arr.indexOf(m) === i) as string[]

  if (!modelCandidates.length) {
    throw new Error(
      "Nenhum modelo Gemini configurado. Defina VITE_GEMINI_MODEL (ex.: gemini-2.0-flash) nas variáveis de ambiente."
    )
  }

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
      console.info("[AI] Tentando modelo Gemini:", nome)
      const model = genAI.getGenerativeModel({ model: nome })
      const result = await model.generateContent(prompt)
      texto = result.response.text()
      console.info("[AI] Modelo Gemini OK:", nome)
      break
    } catch (error: any) {
      lastError = error
      console.warn("[AI] Falha com modelo", nome, error?.message || error)
      continue
    }
  }

  if (!texto) {
    const friendly = friendlyError(lastError)
    throw new Error(friendly)
  }

  const parsed = parseQuestions(texto, quantidade, valorTotal)
  if (!parsed.length) {
    throw new Error(
      "Não foi possível interpretar as questões geradas pela IA. Reveja o tema/objetivos ou tente novamente."
    )
  }
  return parsed
}
