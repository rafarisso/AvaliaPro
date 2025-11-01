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
  const { data: lp, error } = await supabase
    .from("lesson_plans")
    .insert({ user_id: userId, title: data.title, json: data })
    .select()
    .single();
  if (error) throw error;
  return lp.id as string;
}

export async function listMyLessonPlans(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("lesson_plans")
    .select("id,title,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
