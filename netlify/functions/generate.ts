import { Handler } from "@netlify/functions"
import { GoogleGenerativeAI } from "@google/generative-ai"

const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" }
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { statusCode: 500, body: "GEMINI_API_KEY not set" }

    const { kind, system, prompt, files } = JSON.parse(event.body || "{}")

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const parts: any[] = []
    if (system) parts.push({ text: system })
    parts.push({ text: prompt || "" })
    if (Array.isArray(files)) {
      for (const f of files) {
        if (f?.mimeType && f?.data) {
          parts.push({
            inlineData: { mimeType: f.mimeType, data: f.data },
          })
        }
      }
    }

    const result = await model.generateContent(parts)
    const text = result.response?.text?.() || ""

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, text }),
    }
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: error?.message || "error" }),
    }
  }
}

export { handler }
