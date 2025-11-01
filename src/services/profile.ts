import { getSupabase } from "./supabaseClient";

export type OnboardingInput = {
  full_name: string;
  grade_levels: string[];
  subjects: string[];
  schools: {
    name: string;
    city?: string;
    state?: string;
    shifts: ("manhã" | "tarde" | "noite")[];
  }[];
};

export async function getMyProfile() {
  const s = getSupabase();
  const { data, error } = await s
    .from("profiles")
    .select("id,email,full_name,onboarding_completed,teaching_grade_levels")
    .single();
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

  await s.from("teacher_schools").delete().eq("profile_id", user.id);

  for (const school of input.schools) {
    let schoolId: string | null = null;
    try {
      const { data: up } = await s
        .rpc("upsert_school", {
          p_name: school.name,
          p_city: school.city ?? null,
          p_state: school.state ?? null,
        })
        .single();
      schoolId = up?.id ?? null;
    } catch {
      const { data: found } = await s
        .from("schools")
        .select("id")
        .eq("name", school.name)
        .eq("city", school.city ?? null)
        .eq("state", school.state ?? null)
        .maybeSingle();
      if (found?.id) schoolId = found.id;
      else {
        const { data: inserted, error } = await s
          .from("schools")
          .insert({ name: school.name, city: school.city, state: school.state })
          .select("id")
          .single();
        if (error) throw error;
        schoolId = inserted.id;
      }
    }

    const shifts = Array.isArray(school.shifts) && school.shifts.length ? school.shifts : ["manhã"];
    const rows = shifts.map((shift) => ({
      profile_id: user.id,
      school_id: schoolId!,
      shift,
    }));

    await s.from("teacher_schools").upsert(rows, { onConflict: "profile_id,school_id,shift" });
  }

  await s.from("teacher_subjects").delete().eq("profile_id", user.id);

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
