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
};

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { topic, grade, discipline, numQuestions, level } = body;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const prompt = `Gere uma avaliacao de ${discipline} para ${grade} sobre "${topic}" com ${numQuestions} questoes nivel ${level}, linguagem da educacao basica brasileira.`;
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: assessmentSchema,
      },
    });
    return { statusCode: 200, body: response.text ?? "" };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "generation_failed" }) };
  }
};
