import { GoogleGenerativeAI, SchemaType } from "@google/genai";
const MODEL = "gemini-2.5-flash";

const lessonPlanSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    objectives: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }},
    materials: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }},
    steps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          durationMinutes: { type: SchemaType.NUMBER }
        },
        required: ["title","description","durationMinutes"]
      }
    },
    assessment: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
  },
  required: ["title","objectives","steps","assessment"]
};

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { topic, grade } = body;
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = ai.getGenerativeModel({ model: MODEL, generationConfig: {
      responseMimeType: "application/json",
      responseSchema: lessonPlanSchema
    }});
    const prompt = `Crie um plano de aula para ${grade} sobre "${topic}", conforme BNCC, com objetivos, materiais, sequência didática (com tempo) e formas de avaliação. Responda apenas JSON.`;
    const result = await model.generateContent(prompt);
    return { statusCode: 200, body: result.response.text() };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "generation_failed" }) };
  }
};
