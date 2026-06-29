import type { Handler } from "@netlify/functions"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { callAzureChat, azureConfigured, azureDeployment, imagePart, textPart } from "./lib/azureOpenAI"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ""
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || ""

const BUCKET = "provas-escaneadas"
const MAX_IMAGES = 10
// o4-mini é modelo de raciocínio: orçamento folgado para reasoning + JSON de saída
const MAX_COMPLETION_TOKENS = 16000

type Questao = {
  id: string
  ordem: number
  tipo: string
  enunciado: string
  alternativas: string[] | null
  resposta_correta: string | null
  valor: number
}

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" }
  }
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Método não permitido." })
  }
  if (!azureConfigured()) {
    return json(500, { error: "Azure OpenAI não configurado no backend (AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY)." })
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json(500, {
      error: "Backend sem credenciais do Supabase (defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no Netlify).",
    })
  }

  let body: any
  try {
    body = JSON.parse(event.body || "{}")
  } catch {
    return json(400, { error: "JSON inválido." })
  }

  const submissaoId = String(body?.submissao_id || "").trim()
  if (!submissaoId) {
    return json(400, { error: "submissao_id é obrigatório." })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    // 1. Submissão + cadeia até a avaliação
    const { data: submissao, error: subErr } = await supabase
      .from("submissoes")
      .select("id, aplicacao_id, imagens_urls, status")
      .eq("id", submissaoId)
      .single()
    if (subErr) throw subErr
    if (!submissao) return json(404, { error: "Submissão não encontrada." })

    const imagens: string[] = Array.isArray(submissao.imagens_urls) ? submissao.imagens_urls : []
    if (!imagens.length) {
      return json(400, { error: "A submissão não tem imagens para corrigir." })
    }

    const { data: aplicacao, error: apErr } = await supabase
      .from("aplicacoes")
      .select("id, avaliacao_id")
      .eq("id", submissao.aplicacao_id)
      .single()
    if (apErr) throw apErr

    const { data: questoesRaw, error: qErr } = await supabase
      .from("questoes")
      .select("id, ordem, tipo, enunciado, alternativas, resposta_correta, valor")
      .eq("avaliacao_id", aplicacao.avaliacao_id)
      .order("ordem", { ascending: true })
    if (qErr) throw qErr

    const questoes = (questoesRaw || []) as Questao[]
    if (!questoes.length) {
      return json(400, { error: "A avaliação desta submissão não tem questões cadastradas." })
    }

    // marca como processando (best-effort)
    await supabase.from("submissoes").update({ status: "processando" }).eq("id", submissaoId)

    // 2. Baixa as imagens (Storage privado ou URL http)
    const imagensInline = await loadImages(supabase, imagens.slice(0, MAX_IMAGES))
    if (!imagensInline.length) {
      throw new Error("Não foi possível ler nenhuma das imagens da submissão.")
    }

    // 3. Azure OpenAI (o4-mini) corrige a partir das imagens + gabarito
    const prompt = buildCorrectionPrompt(questoes)
    const text = await callAzureChat(
      [
        { role: "system", content: "Você é um corretor de provas escolares preciso e objetivo. Responda sempre em JSON puro." },
        {
          role: "user",
          content: [textPart(prompt), ...imagensInline.map((img) => imagePart(img.base64, img.mime))],
        },
      ],
      { maxCompletionTokens: MAX_COMPLETION_TOKENS }
    )

    const correcao = parseCorrection(text)

    // 4. Monta respostas por questão, casando numero (ordem) -> questao.id
    const porOrdem = new Map<number, Questao>()
    questoes.forEach((q) => porOrdem.set(Number(q.ordem), q))

    const rows = correcao
      .map((r) => {
        const q = porOrdem.get(Number(r.numero))
        if (!q) return null
        const maxValor = Number(q.valor) || 0
        let pontos = Number(r.pontos_obtidos)
        if (!Number.isFinite(pontos)) pontos = r.correta ? maxValor : 0
        pontos = Math.max(0, Math.min(pontos, maxValor)) // nunca passa do valor da questão
        return {
          submissao_id: submissaoId,
          questao_id: q.id,
          resposta_extraida: clampText(r.resposta_extraida, 2000),
          correta: Boolean(r.correta),
          pontos_obtidos: round2(pontos),
          confianca: clamp01(r.confianca),
          feedback_ia: clampText(r.feedback, 1000),
        }
      })
      .filter(Boolean) as Array<Record<string, unknown>>

    if (!rows.length) {
      throw new Error("A IA não retornou correção para nenhuma questão.")
    }

    const notaFinal = round2(rows.reduce((acc, r) => acc + (Number(r.pontos_obtidos) || 0), 0))

    // 5. Persiste (upsert idempotente por submissao+questao) e fecha a submissão
    const { error: upErr } = await supabase
      .from("respostas_aluno")
      .upsert(rows, { onConflict: "submissao_id,questao_id" })
    if (upErr) throw upErr

    const { error: finErr } = await supabase
      .from("submissoes")
      .update({
        status: "corrigida",
        nota_final: notaFinal,
        ocr_raw: { modelo: `azure:${azureDeployment()}`, respostas: correcao },
        corrigido_em: new Date().toISOString(),
      })
      .eq("id", submissaoId)
    if (finErr) throw finErr

    return json(200, {
      submissao_id: submissaoId,
      nota_final: notaFinal,
      total_questoes: questoes.length,
      respostas: rows,
    })
  } catch (error: any) {
    console.error("[corrigir-prova]", error?.message || error)
    try {
      await supabase.from("submissoes").update({ status: "erro" }).eq("id", submissaoId)
    } catch {
      /* ignora */
    }
    const status = Number(error?.status) || 500
    return json(status >= 400 && status < 600 ? status : 500, {
      error: error?.message || "Falha ao corrigir a prova.",
    })
  }
}

export { handler }

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function loadImages(supabase: SupabaseClient, refs: string[]) {
  const out: Array<{ base64: string; mime: string }> = []
  for (const ref of refs) {
    try {
      let buffer: Buffer
      let mime = "image/jpeg"

      if (/^https?:\/\//i.test(ref)) {
        const resp = await fetch(ref)
        if (!resp.ok) continue
        mime = resp.headers.get("content-type") || mime
        buffer = Buffer.from(await resp.arrayBuffer())
      } else {
        const path = ref.replace(new RegExp(`^${BUCKET}/`), "")
        const { data, error } = await supabase.storage.from(BUCKET).download(path)
        if (error || !data) continue
        mime = data.type || mime
        buffer = Buffer.from(await data.arrayBuffer())
      }

      if (!mime.toLowerCase().startsWith("image/")) mime = "image/jpeg"
      out.push({ base64: buffer.toString("base64"), mime })
    } catch {
      // pula imagem problemática
    }
  }
  return out
}

function buildCorrectionPrompt(questoes: Questao[]): string {
  const gabarito = questoes.map((q) => ({
    numero: q.ordem,
    tipo: q.tipo,
    enunciado: q.enunciado,
    alternativas: q.tipo === "objetiva" ? q.alternativas || [] : undefined,
    gabarito: q.resposta_correta || "",
    valor: q.valor,
  }))

  return [
    "As imagens contêm a prova MANUSCRITA de UM único aluno.",
    "Corrija comparando as respostas do aluno com o gabarito oficial abaixo. Não invente questões além das listadas.",
    "",
    "GABARITO OFICIAL (JSON):",
    JSON.stringify(gabarito),
    "",
    "Regras:",
    "- OBJETIVAS: identifique a alternativa marcada/escrita pelo aluno (letra A, B, C, D...). 'correta' = letra do aluno == gabarito. pontos_obtidos = valor se correta, senão 0.",
    "- DISSERTATIVAS: compare o conteúdo da resposta do aluno com o gabarito. Atribua pontos_obtidos de 0 até 'valor' (aceita nota parcial). 'correta' = pontos_obtidos >= 60% do valor.",
    "- 'resposta_extraida': transcreva o que o aluno respondeu (letra na objetiva; texto resumido na dissertativa). Se ilegível ou em branco, use \"\".",
    "- 'confianca': 0 a 1, o quanto você confia na leitura da resposta.",
    "- 'feedback': 1 frase curta justificando, em português.",
    "",
    "Responda APENAS JSON puro, sem markdown, no formato:",
    `{"respostas":[{"numero":1,"resposta_extraida":"B","correta":false,"pontos_obtidos":0,"confianca":0.9,"feedback":"..."}]}`,
  ].join("\n")
}

type CorrecaoItem = {
  numero: number
  resposta_extraida: string
  correta: boolean
  pontos_obtidos: number
  confianca: number
  feedback: string
}

function parseCorrection(text: string): CorrecaoItem[] {
  const raw = JSON.parse(extractJson(text))
  const list = Array.isArray(raw?.respostas) ? raw.respostas : Array.isArray(raw) ? raw : []
  if (!Array.isArray(list) || !list.length) {
    throw new Error("A IA não retornou um JSON de correção válido.")
  }
  return list.map((item: any) => ({
    numero: Number(item?.numero ?? item?.questao ?? 0),
    resposta_extraida: String(item?.resposta_extraida ?? item?.resposta ?? ""),
    correta: Boolean(item?.correta),
    pontos_obtidos: Number(item?.pontos_obtidos ?? item?.pontos ?? 0),
    confianca: Number(item?.confianca ?? item?.confidence ?? 0),
    feedback: String(item?.feedback ?? ""),
  }))
}

function extractJson(text: string): string {
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) return obj[0]
  const arr = text.match(/\[[\s\S]*\]/)
  if (arr) return `{"respostas":${arr[0]}}`
  return text.trim()
}

function clamp01(v: any): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100
}

function clampText(v: any, max: number): string {
  const s = String(v ?? "")
  return s.length > max ? s.slice(0, max) : s
}

function json(statusCode: number, payload: unknown) {
  return {
    statusCode,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(payload),
  }
}
