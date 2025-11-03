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
};

export const handler = async (event) => {
  try {
    const { topic, grade } = JSON.parse(event.body || "{}");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const prompt = `Crie um plano de aula para ${grade} sobre "${topic}", alinhado a BNCC, com objetivos, materiais, sequencia didatica (com tempo) e formas de avaliacao. Responda somente JSON.`;
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    return { statusCode: 200, body: response.text ?? "" };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "generation_failed" }) };
  }
};
