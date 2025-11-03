import type { Handler } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";

const MODEL = "gemini-2.5-flash";

const schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
    materials: { type: Type.ARRAY, items: { type: Type.STRING } },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          durationMinutes: { type: Type.NUMBER },
        },
        required: ["title", "description", "durationMinutes"],
      },
    },
    assessment: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["title", "objectives", "steps", "assessment"],
} as const;

export const handler: Handler = async (event) => {
  try {
    const { topic, grade } = JSON.parse(event.body || "{}");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "missing_api_key" }) };
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Crie um plano de aula para ${grade ?? ""} sobre "${topic ?? ""}", alinhado a BNCC, com objetivos, materiais, sequencia didatica (com tempo) e formas de avaliacao. Responda somente JSON.`;
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    return { statusCode: 200, body: response.text ?? "" };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: "generation_failed" }) };
  }
};
