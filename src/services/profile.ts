import { getSupabase } from "./supabaseClient";

const MANHA = "manh\u00e3";
type ShiftValue = typeof MANHA | "tarde" | "noite";
const SHIFT_VALUES: ShiftValue[] = [MANHA, "tarde", "noite"];

export type OnboardingInput = {
  full_name: string;
  grade_levels: string[];
  subjects: string[];
  schools: {
    name: string;
    city?: string;
    state?: string;
    shifts: ShiftValue[];
  }[];
};

export async function getMyProfile() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,onboarding_completed,teaching_grade_levels")
    .single();
  if (error) throw error;
  return data;
}

export async function completeOnboarding(input: OnboardingInput) {
  const supabase = getSupabase();
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();
  if (getUserError) throw getUserError;
  if (!user) throw new Error("not_authenticated");

  console.time("[Onboarding] save");
  console.log("[Onboarding] starting save", { userId: user.id, input });

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      teaching_grade_levels: input.grade_levels,
      onboarding_completed: true,
    })
    .eq("id", user.id);
  if (profileError) throw profileError;
  console.log("[Onboarding] profile updated");

  const { error: deleteSchoolsError } = await supabase
    .from("teacher_schools")
    .delete()
    .eq("profile_id", user.id);
  if (deleteSchoolsError) throw deleteSchoolsError;
  console.log("[Onboarding] cleared teacher_schools");

  for (const school of input.schools) {
    console.log("[Onboarding] processing school", school);
    let schoolId: string | null = null;

    const { data: rpcData, error: rpcError } = await supabase.rpc("upsert_school", {
      p_name: school.name,
      p_city: school.city ?? null,
      p_state: school.state ?? null,
    });

    if (!rpcError && rpcData) {
      if (Array.isArray(rpcData)) {
        schoolId = rpcData[0]?.id ?? null;
      } else if (typeof rpcData === "object" && rpcData !== null) {
        schoolId = (rpcData as Record<string, unknown>).id as string | null;
      }
    }

    if (!schoolId) {
      const { data: found, error: findError } = await supabase
        .from("schools")
        .select("id")
        .eq("name", school.name)
        .eq("city", school.city ?? null)
        .eq("state", school.state ?? null)
        .maybeSingle();
      if (findError) throw findError;

      if (found?.id) {
        schoolId = found.id;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("schools")
          .insert({ name: school.name, city: school.city, state: school.state })
          .select("id")
          .single();
        if (insertError) throw insertError;
        schoolId = inserted.id;
      }
    }

    if (!schoolId) throw new Error("school_upsert_failed");

    const rawShifts = Array.isArray(school.shifts) ? school.shifts : [];
    const normalizedShifts: ShiftValue[] = rawShifts
      .map((value) => {
        if (value === MANHA || value === "manh\u00e3" || value === "manha") return MANHA;
        return value;
      })
      .filter((value): value is ShiftValue => SHIFT_VALUES.includes(value as ShiftValue));

    if (!normalizedShifts.length) {
      normalizedShifts.push(MANHA);
    }

    // `teacher_schools` currently stores a single shift per profile/school.
    const primaryShift = normalizedShifts[0];

    const { error: insertSchoolError } = await supabase.from("teacher_schools").insert({
      profile_id: user.id,
      school_id: schoolId,
      shift: primaryShift,
    });
    if (insertSchoolError) throw insertSchoolError;
    console.log("[Onboarding] stored teacher_schools", { schoolId, primaryShift });
  }

  const { error: deleteSubjectsError } = await supabase
    .from("teacher_subjects")
    .delete()
    .eq("profile_id", user.id);
  if (deleteSubjectsError) throw deleteSubjectsError;
  console.log("[Onboarding] cleared teacher_subjects");

  for (const name of input.subjects) {
    const { data: subj, error: subjectError } = await supabase
      .from("subjects")
      .select("id")
      .eq("name", name)
      .maybeSingle();
    if (subjectError) throw subjectError;
    if (!subj?.id) continue;

    const { error: upsertSubjectsError } = await supabase
      .from("teacher_subjects")
      .upsert({ profile_id: user.id, subject_id: subj.id });
    if (upsertSubjectsError) throw upsertSubjectsError;
    console.log("[Onboarding] linked subject", name);
  }

  console.log("[Onboarding] save complete");
  console.timeEnd("[Onboarding] save");
}
