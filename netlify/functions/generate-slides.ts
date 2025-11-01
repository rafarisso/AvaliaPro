import { GoogleGenerativeAI, SchemaType } from "@google/genai";
const MODEL = "gemini-2.5-flash";

const slidesSchema = {
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
          imagePrompt: { type: SchemaType.STRING }
        },
        required: ["heading","bullets"]
      }
    }
  },
  required: ["title","slides"]
};

export const handler = async (event) => {
  try {
    const { topic, grade } = JSON.parse(event.body || "{}");
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = ai.getGenerativeModel({ model: MODEL, generationConfig: {
      responseMimeType: "application/json",
      responseSchema: slidesSchema
    }});
    const prompt = `Gere um deck de slides didático para ${grade} sobre "${topic}". Cada slide deve ter título e bullets objetivos; inclua "imagePrompt" opcional. JSON puro.`;
    const result = await model.generateContent(prompt);
    return { statusCode: 200, body: result.response.text() };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "generation_failed" }) };
  }
};
