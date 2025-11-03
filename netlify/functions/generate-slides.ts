import { GoogleGenAI, Type } from "@google/genai";

const MODEL = "gemini-2.5-flash";

const schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    slides: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
          imagePrompt: { type: Type.STRING },
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
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const prompt = `Gere um deck de slides didatico para ${grade} sobre "${topic}". Cada slide deve ter titulo e bullets objetivos; inclua "imagePrompt" opcional. JSON puro.`;
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
