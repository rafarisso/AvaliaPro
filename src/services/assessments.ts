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

export async function saveAssessment(userId: string, data: GeneratedAssessment) {
  const supabase = getSupabase();
  const { data: a, error } = await supabase
    .from("assessments")
    .insert({ user_id: userId, title: data.assessmentTitle })
    .select()
    .single();
  if (error) throw error;

  const items = data.questions.map((q) => ({
    assessment_id: a.id,
    number: q.questionNumber,
    type: q.questionType,
    text: q.questionText,
    points: q.points,
    options: q.options ?? null
  }));
  const { error: e2 } = await supabase.from("assessment_items").insert(items);
  if (e2) throw e2;

  const keys = data.questions
    .filter((q) => q.correctAnswer)
    .map((q) => ({ assessment_id: a.id, number: q.questionNumber, correct: q.correctAnswer! }));
  if (keys.length) {
    const { error: e3 } = await supabase.from("assessment_keys").insert(keys);
    if (e3) throw e3;
  }
  return a.id as string;
}

export async function listMyAssessments(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("assessments")
    .select("id,title,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAssessment(id: string) {
  const supabase = getSupabase();
  const { data: a, error } = await supabase
    .from("assessments")
    .select("id,title,created_at")
    .eq("id", id)
    .single();
  if (error) throw error;

  const { data: items } = await supabase
    .from("assessment_items")
    .select("number,type,text,points,options")
    .eq("assessment_id", id)
    .order("number");
  const { data: keys } = await supabase
    .from("assessment_keys")
    .select("number,correct")
    .eq("assessment_id", id);

  return { a, items: items ?? [], keys: keys ?? [] };
}
