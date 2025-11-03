import { getSupabase } from "./supabaseClient";

export type GeneratedSlideDeck = {
  title: string;
  slides: { heading: string; bullets: string[]; imagePrompt?: string }[];
};

export async function saveSlideDeck(userId: string, data: GeneratedSlideDeck) {
  const supabase = getSupabase();
  const { data: template, error } = await supabase
    .from("templates")
    .insert({
      user_id: userId,
      titulo: data.title,
      corpo: { type: "slides_outline", slides: data.slides },
    })
    .select("id")
    .single();
  if (error) throw error;
  return template.id as string;
}

export async function listMySlideDecks(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("templates")
    .select("id,titulo,corpo,created_at")
    .eq("user_id", userId)
    .contains("corpo", { type: "slides_outline" })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
