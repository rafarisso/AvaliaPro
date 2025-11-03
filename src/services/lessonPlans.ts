import { getSupabase } from "./supabaseClient";

export type GeneratedLessonPlan = {
  title: string;
  objectives: string[];
  materials: string[];
  steps: { title: string; description: string; durationMinutes: number }[];
  assessment: string[];
};

export async function saveLessonPlan(userId: string, data: GeneratedLessonPlan) {
  const supabase = getSupabase();
  const { data: template, error } = await supabase
    .from("templates")
    .insert({
      user_id: userId,
      titulo: data.title,
      corpo: { type: "lesson_plan_ai", plan: data },
    })
    .select("id")
    .single();
  if (error) throw error;
  return template.id as string;
}

export async function listMyLessonPlans(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("templates")
    .select("id,titulo,corpo,created_at")
    .eq("user_id", userId)
    .contains("corpo", { type: "lesson_plan_ai" })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
