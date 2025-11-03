import { getSupabase } from "./supabaseClient";

export type GeneratedQuestion = {
  questionNumber: number;
  questionType: string;
  questionText: string;
  points: number;
  options?: string[];
  correctAnswer?: string;
};

export type GeneratedAssessment = {
  assessmentTitle: string;
  questions: GeneratedQuestion[];
};

type AssessmentContext = {
  discipline?: string;
  topic?: string;
  grade?: string;
};

export async function saveAssessment(
  userId: string,
  data: GeneratedAssessment,
  context: AssessmentContext = {}
) {
  const supabase = getSupabase();
  const { data: assessment, error } = await supabase
    .from("assessments")
    .insert({
      user_id: userId,
      titulo: data.assessmentTitle,
      disciplina: context.discipline ?? null,
      tema: context.topic ?? null,
      serie: context.grade ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;

  const items = data.questions.map((question, index) => ({
    assessment_id: assessment.id,
    idx: index,
    json: {
      numero: question.questionNumber,
      tipo: question.questionType,
      enunciado: question.questionText,
      pontos: question.points,
      alternativas: question.options ?? null,
      resposta: question.correctAnswer ?? null,
    },
    user_id: userId,
  }));
  if (items.length) {
    const { error: e2 } = await supabase.from("assessment_items").insert(items);
    if (e2) throw e2;
  }

  const answerKey = data.questions.reduce<Record<string, string>>((acc, question) => {
    if (question.correctAnswer) {
      acc[String(question.questionNumber)] = question.correctAnswer;
    }
    return acc;
  }, {});

  if (Object.keys(answerKey).length) {
    const { error: e3 } = await supabase
      .from("assessment_keys")
      .insert({ assessment_id: assessment.id, key: answerKey, user_id: userId });
    if (e3) throw e3;
  }
  return assessment.id as string;
}

export async function listMyAssessments(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("assessments")
    .select("id,titulo,disciplina,tema,serie,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAssessment(id: string) {
  const supabase = getSupabase();
  const { data: assessment, error } = await supabase
    .from("assessments")
    .select("id,titulo,disciplina,tema,serie,created_at")
    .eq("id", id)
    .single();
  if (error) throw error;

  const { data: items } = await supabase
    .from("assessment_items")
    .select("idx,json")
    .eq("assessment_id", id)
    .order("idx");
  const { data: keys } = await supabase
    .from("assessment_keys")
    .select("key")
    .eq("assessment_id", id);

  return { assessment, items: items ?? [], keys: keys ?? [] };
}
