import { getSupabase } from "./supabaseClient";

export type GeneratedSlideDeck = {
  title: string;
  slides: { heading: string; bullets: string[]; imagePrompt?: string }[];
};

export async function saveSlideDeck(userId: string, data: GeneratedSlideDeck) {
  const supabase = getSupabase();
  const { data: sd, error } = await supabase
    .from("slide_decks")
    .insert({ user_id: userId, title: data.title })
    .select()
    .single();
  if (error) throw error;

  const slides = data.slides.map((s, idx) => ({
    slide_deck_id: sd.id,
    number: idx + 1,
    heading: s.heading,
    bullets: s.bullets,
    image_prompt: s.imagePrompt ?? null
  }));
  const { error: e2 } = await supabase.from("slides").insert(slides);
  if (e2) throw e2;

  return sd.id as string;
}

export async function listMySlideDecks(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("slide_decks")
    .select("id,title,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
