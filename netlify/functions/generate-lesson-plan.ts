import { GoogleGenerativeAI, SchemaType } from "@google/genai";

const MODEL = "gemini-2.5-flash";

const schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    objectives: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    materials: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    steps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          durationMinutes: { type: SchemaType.NUMBER },
        },
        required: ["title", "description", "durationMinutes"],
      },
    },
    assessment: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["title", "objectives", "steps", "assessment"],
};

export const handler = async (event) => {
  try {
    const { topic, grade } = JSON.parse(event.body || "{}");
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = ai.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    const prompt = `Crie um plano de aula para ${grade} sobre "${topic}", alinhado a BNCC, com objetivos, materiais, sequencia didatica (com tempo) e formas de avaliacao. Responda somente JSON.`;
    const r = await model.generateContent(prompt);
    return { statusCode: 200, body: r.response.text() };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "generation_failed" }) };
  }
};
