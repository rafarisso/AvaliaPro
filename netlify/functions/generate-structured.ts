import type { Handler } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";

const MODEL = "gemini-2.5-flash";

const assessmentSchema = {
  type: Type.OBJECT,
  properties: {
    assessmentTitle: { type: Type.STRING },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionNumber: { type: Type.NUMBER },
          questionType: { type: Type.STRING },
          questionText: { type: Type.STRING },
          points: { type: Type.NUMBER },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.STRING },
        },
        required: ["questionNumber", "questionType", "questionText", "points"],
      },
    },
  },
  required: ["assessmentTitle", "questions"],
} as const;

export const handler: Handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { topic, grade, discipline, numQuestions, level } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "missing_api_key" }) };
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Gere uma avaliacao de ${discipline ?? ""} para ${grade ?? ""} sobre "${topic ?? ""}" com ${numQuestions ?? ""} questoes nivel ${level ?? ""}, linguagem da educacao basica brasileira.`;
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
        responseSchema: assessmentSchema,
      },
    });

    return { statusCode: 200, body: response.text ?? "" };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "generation_failed" }),
    };
  }
};
