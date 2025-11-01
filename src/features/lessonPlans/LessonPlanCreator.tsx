import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { callAI } from "@/services/ai";
import { saveLessonPlan, type GeneratedLessonPlan } from "@/services/lessonPlans";

export default function LessonPlanCreator() {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("6o ano");
  const [focus, setFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<GeneratedLessonPlan | null>(null);

  const disabled = topic.trim().length < 3 || loading;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = { topic, grade, focus };
      const generated: GeneratedLessonPlan = await callAI("generate-lesson-plan", payload);
      setPlan(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha inesperada ao gerar plano.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !plan) return;
    setSaving(true);
    try {
      await saveLessonPlan(user.id, plan);
      alert("Plano salvo com sucesso!");
    } catch (err) {
      alert(`Nao foi possivel salvar: ${err instanceof Error ? err.message : "erro desconhecido"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <header className="mb-8 space-y-2">
          <p className="text-sm font-semibold text-blue-600">Planejamento</p>
          <h1 className="text-3xl font-semibold text-gray-900">Criar plano de aula</h1>
          <p className="text-sm text-gray-600">
            Informe o tema e o ano escolar. A IA gera objetivos, materiais, sequencia e avaliacao alinhados a boas
            praticas.
          </p>
        </header>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">Tema da aula</span>
                <input
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="Ex.: Ciclo da agua"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">Serie/Ano</span>
                <input
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                  placeholder="Ex.: 6o ano"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
                />
              </label>
            </div>

            <label className="mt-4 flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700">Foco da aula (opcional)</span>
              <textarea
                value={focus}
                onChange={(event) => setFocus(event.target.value)}
                rows={4}
                placeholder="Objetivos especificos, projetos em andamento, habilidades a reforcar..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
              />
            </label>

            {error ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : null}

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={disabled}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Gerando..." : "Gerar plano com IA"}
              </button>
            </div>
          </section>

          {plan ? (
            <section className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow">
              <header>
                <h2 className="text-2xl font-semibold text-gray-900">{plan.title}</h2>
              </header>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-600">Objetivos</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {plan.objectives.map((objective, index) => (
                      <li key={index} className="rounded-lg bg-blue-50/60 px-4 py-2">
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-600">Materiais</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {plan.materials.map((material, index) => (
                      <li key={index} className="rounded-lg bg-blue-50/60 px-4 py-2">
                        {material}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-600">Sequencia didatica</h3>
                <ol className="space-y-3 text-sm text-gray-700">
                  {plan.steps.map((step, index) => (
                    <li key={index} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <p className="font-semibold text-gray-900">{step.title}</p>
                        <span className="text-xs font-medium text-blue-600">{step.durationMinutes} min</span>
                      </div>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-600">Avaliacao</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  {plan.assessment.map((item, index) => (
                    <li key={index} className="rounded-lg bg-blue-50/60 px-4 py-2">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Salvando..." : "Salvar plano de aula"}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
