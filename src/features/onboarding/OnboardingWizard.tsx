import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { completeOnboarding, type OnboardingInput, getMyProfile } from "@/services/profile";
import { useAuth } from "@/hooks/useAuth";

const SHIFT_OPTIONS = ["manhã", "tarde", "noite"] as const;

const schema = z.object({
  full_name: z.string().min(3, "Informe seu nome completo."),
  grade_levels: z.array(z.string()).min(1, "Selecione ao menos um ano/série."),
  subjects: z.array(z.string()).min(1, "Selecione ao menos uma disciplina."),
  schools: z
    .array(
      z.object({
        name: z.string().min(2, "Nome da escola"),
        city: z.string().optional(),
        state: z.string().optional(),
        shifts: z.array(z.enum(SHIFT_OPTIONS)).min(1, "Selecione ao menos um turno."),
      })
    )
    .min(1, "Adicione ao menos uma escola"),
});

const SUBJECTS = [
  "Geografia",
  "História",
  "Português",
  "Matemática",
  "Ciências",
  "Inglês",
  "Artes",
  "Educação Física",
  "Física",
  "Química",
  "Biologia",
  "Filosofia",
  "Sociologia",
];

const GRADES = [
  "1o ano (EF)",
  "2o ano (EF)",
  "3o ano (EF)",
  "4o ano (EF)",
  "5o ano (EF)",
  "6o ano",
  "7o ano",
  "8o ano",
  "9o ano",
  "1o EM",
  "2o EM",
  "3o EM",
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [input, setInput] = useState<OnboardingInput>({
    full_name: "",
    grade_levels: [],
    subjects: [],
    schools: [{ name: "", city: "", state: "", shifts: ["manhã"] }],
  });

  useEffect(() => {
    void (async () => {
      try {
        const profile = await getMyProfile();
        if (profile?.onboarding_completed) {
          navigate("/dashboard", { replace: true });
          return;
        }
        if (profile?.full_name && !input.full_name) {
          setInput((prev) => ({ ...prev, full_name: profile.full_name }));
        }
        if (Array.isArray(profile?.teaching_grade_levels) && profile.teaching_grade_levels.length) {
          setInput((prev) => ({ ...prev, grade_levels: profile.teaching_grade_levels }));
        }
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const canBack = step > 1;
  const isLast = step === 3;

  async function handleFinish() {
    setError(null);
    setLoading(true);
    try {
      schema.parse(input);
      await completeOnboarding(input);
      await refreshProfile();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message ?? "Dados inválidos.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao concluir.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-1 text-3xl font-semibold text-gray-900">Bem-vindo(a) ao AvaliaPro</h1>
        <p className="mb-6 text-sm text-gray-600">Vamos personalizar sua experiência em 3 passos.</p>

        <div className="mb-6 flex items-center gap-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`flex-1 h-2 rounded ${n <= step ? "bg-blue-600" : "bg-gray-300"}`} />
          ))}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          {step === 1 ? renderStepPersonal() : null}
          {step === 2 ? renderStepSubjects() : null}
          {step === 3 ? renderStepSchools() : null}

          {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              disabled={!canBack}
            >
              Voltar
            </button>
            {!isLast ? (
              <button
                type="button"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-blue-700"
                onClick={() => setStep((current) => Math.min(3, current + 1))}
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleFinish}
                disabled={loading}
              >
                {loading ? "Salvando..." : "Concluir"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function renderStepPersonal() {
    return (
      <div className="grid gap-4">
        <label className="text-sm font-medium text-gray-700">Seu nome completo</label>
        <input
          className="rounded-xl border border-gray-200 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
          placeholder="Ex.: Rafael de Toledo Risso"
          value={input.full_name}
          onChange={(event) => setInput((prev) => ({ ...prev, full_name: event.target.value }))}
        />
        <label className="mt-3 text-sm font-medium text-gray-700">Séries/Anos que leciona</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {GRADES.map((grade) => {
            const selected = input.grade_levels.includes(grade);
            return (
              <button
                type="button"
                key={grade}
                className={`rounded-xl border px-3 py-2 text-sm transition ${
                  selected ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 bg-white"
                }`}
                onClick={() =>
                  setInput((prev) => ({
                    ...prev,
                    grade_levels: toggleValue(prev.grade_levels, grade),
                  }))
                }
              >
                {grade}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderStepSubjects() {
    return (
      <div className="grid gap-4">
        <label className="text-sm font-medium text-gray-700">Disciplinas que você leciona</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SUBJECTS.map((subject) => {
            const selected = input.subjects.includes(subject);
            return (
              <button
                type="button"
                key={subject}
                className={`rounded-xl border px-3 py-2 text-sm transition ${
                  selected ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 bg-white"
                }`}
                onClick={() =>
                  setInput((prev) => ({
                    ...prev,
                    subjects: toggleValue(prev.subjects, subject),
                  }))
                }
              >
                {subject}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderStepSchools() {
    return (
      <div className="grid gap-4">
        <label className="text-sm font-medium text-gray-700">Suas escolas</label>
        {input.schools.map((school, index) => (
          <div key={index} className="space-y-2 rounded-xl border border-gray-100 p-3">
            <div className="grid gap-2 md:grid-cols-3">
              <input
                className="rounded-xl border border-gray-200 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
                placeholder="Nome da escola"
                value={school.name}
                onChange={(event) => updateSchool(index, { ...school, name: event.target.value })}
              />
              <input
                className="rounded-xl border border-gray-200 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
                placeholder="Cidade"
                value={school.city ?? ""}
                onChange={(event) => updateSchool(index, { ...school, city: event.target.value })}
              />
              <input
                className="rounded-xl border border-gray-200 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
                placeholder="UF"
                value={school.state ?? ""}
                onChange={(event) => updateSchool(index, { ...school, state: event.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {SHIFT_OPTIONS.map((option) => {
                const selected = school.shifts.includes(option);
                return (
                  <button
                    type="button"
                    key={option}
                    className={`rounded-full px-3 py-2 text-sm transition ${
                      selected ? "border border-blue-600 bg-blue-50 text-blue-700" : "border border-gray-200 bg-white text-gray-700"
                    }`}
                    onClick={() => toggleSchoolShift(index, option)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div>
          <button
            type="button"
            className="text-sm font-medium text-blue-600 hover:underline"
            onClick={() =>
              setInput((prev) => ({
                ...prev,
                schools: [...prev.schools, { name: "", city: "", state: "", shifts: ["manhã"] }],
              }))
            }
          >
            + adicionar outra escola
          </button>
        </div>
      </div>
    );
  }

  function toggleValue<T extends string>(arr: T[], value: T) {
    return arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value];
  }

  function updateSchool(index: number, school: OnboardingInput["schools"][number]) {
    setInput((prev) => {
      const next = [...prev.schools];
      next[index] = school;
      return { ...prev, schools: next };
    });
  }

  function toggleSchoolShift(index: number, shift: (typeof SHIFT_OPTIONS)[number]) {
    setInput((prev) => {
      const next = [...prev.schools];
      const current = next[index];
      const currentShifts = current.shifts ?? [];
      const alreadySelected = currentShifts.includes(shift);
      if (alreadySelected && currentShifts.length === 1) {
        return prev;
      }
      const updated = alreadySelected
        ? currentShifts.filter((value) => value !== shift)
        : [...currentShifts, shift];
      next[index] = { ...current, shifts: updated };
      return { ...prev, schools: next };
    });
  }
}
