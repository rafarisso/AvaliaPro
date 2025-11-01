import { getSupabase } from "./supabaseClient";

export type OnboardingInput = {
  full_name: string;
  grade_levels: string[];
  subjects: string[];
  schools: { name: string; city?: string; state?: string; shift?: "manhã" | "tarde" | "noite" }[];
};

export async function getMyProfile() {
  const s = getSupabase();
  const { data, error } = await s.from("profiles").select("*").single();
  if (error) throw error;
  return data;
}

export async function completeOnboarding(input: OnboardingInput) {
  const s = getSupabase();
  const user = (await s.auth.getUser()).data.user;
  if (!user) throw new Error("not_authenticated");

  const { error: e1 } = await s
    .from("profiles")
    .update({
      full_name: input.full_name,
      teaching_grade_levels: input.grade_levels,
      onboarding_completed: true,
    })
    .eq("id", user.id);
  if (e1) throw e1;

  for (const sc of input.schools) {
    let schoolId: string | null = null;
    try {
      const { data: up } = await s
        .rpc("upsert_school", {
          p_name: sc.name,
          p_city: sc.city ?? null,
          p_state: sc.state ?? null,
        })
        .single();
      schoolId = up?.id ?? null;
    } catch {
      const { data: found } = await s
        .from("schools")
        .select("id")
        .eq("name", sc.name)
        .eq("city", sc.city ?? null)
        .eq("state", sc.state ?? null)
        .maybeSingle();
      if (found?.id) schoolId = found.id;
      else {
        const { data: ins, error } = await s
          .from("schools")
          .insert({ name: sc.name, city: sc.city, state: sc.state })
          .select("id")
          .single();
        if (error) throw error;
        schoolId = ins.id;
      }
    }

    await s.from("teacher_schools").upsert({
      profile_id: user.id,
      school_id: schoolId!,
      shift: sc.shift ?? "manhã",
    });
  }

  for (const name of input.subjects) {
    const { data: subj } = await s.from("subjects").select("id").eq("name", name).single();
    if (subj?.id) {
      await s.from("teacher_subjects").upsert({
        profile_id: user.id,
        subject_id: subj.id,
      });
    }
  }
}
