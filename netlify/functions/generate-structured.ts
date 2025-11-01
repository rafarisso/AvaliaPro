import { GoogleGenerativeAI, SchemaType } from "@google/genai";

const MODEL = "gemini-2.5-flash";

const assessmentSchema = {
  type: SchemaType.OBJECT,
  properties: {
    assessmentTitle: { type: SchemaType.STRING },
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          questionNumber: { type: SchemaType.NUMBER },
          questionType: { type: SchemaType.STRING },
          questionText: { type: SchemaType.STRING },
          points: { type: SchemaType.NUMBER },
          options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          correctAnswer: { type: SchemaType.STRING },
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
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = ai.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: assessmentSchema,
      },
    });
    const prompt = `Gere uma avaliacao de ${discipline} para ${grade} sobre "${topic}" com ${numQuestions} questoes nivel ${level}, linguagem da educacao basica brasileira.`;
    const r = await model.generateContent(prompt);
    return { statusCode: 200, body: r.response.text() };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "generation_failed" }) };
  }
};
