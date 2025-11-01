import { GoogleGenerativeAI, SchemaType } from "@google/genai";

const MODEL = "gemini-2.5-flash";

const schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    slides: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          heading: { type: SchemaType.STRING },
          bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          imagePrompt: { type: SchemaType.STRING },
        },
        required: ["heading", "bullets"],
      },
    },
  },
  required: ["title", "slides"],
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
    const prompt = `Gere um deck de slides didatico para ${grade} sobre "${topic}". Cada slide deve ter titulo e bullets objetivos; inclua "imagePrompt" opcional. JSON puro.`;
    const r = await model.generateContent(prompt);
    return { statusCode: 200, body: r.response.text() };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "generation_failed" }) };
  }
};
