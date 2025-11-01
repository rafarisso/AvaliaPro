import { useState } from "react";
import { callAI } from "@/services/ai";
import { saveLessonPlan, type GeneratedLessonPlan } from "@/services/lessonPlans";
import { useAuth } from "@/hooks/useAuth";

export default function LessonPlanCreator() {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("6º ano");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<GeneratedLessonPlan | null>(null);

  async function handleGenerate() {
    setLoading(true);
    try {
      const p = await callAI("generate-lesson-plan", { topic, grade });
      setPlan(p);
    } finally {
      setLoading(false);
    }
  }
  async function handleSave() {
    if (!user || !plan) return;
    await saveLessonPlan(user.id, plan);
    alert("Plano salvo com sucesso!");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-4">Criar plano de aula</h1>
      <div className="grid gap-3">
        <input className="border rounded p-3" placeholder="Tema" value={topic} onChange={e=>setTopic(e.target.value)} />
        <input className="border rounded p-3" placeholder="Série/Ano" value={grade} onChange={e=>setGrade(e.target.value)} />
        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={loading || topic.length<3}
                  className="px-4 py-2 rounded bg-blue-600 text-white">
            {loading? "Gerando..." : "Gerar com IA"}
          </button>
          {plan && <button onClick={handleSave} className="px-4 py-2 rounded bg-green-600 text-white">Salvar</button>}
        </div>
      </div>

      {plan && (
        <div className="mt-6 border rounded p-4 bg-white">
          <h2 className="text-xl font-medium">{plan.title}</h2>
          <h3 className="font-semibold mt-3">Objetivos</h3>
          <ul className="list-disc ml-6">{plan.objectives.map((o,i)=><li key={i}>{o}</li>)}</ul>
          <h3 className="font-semibold mt-3">Materiais</h3>
          <ul className="list-disc ml-6">{plan.materials.map((o,i)=><li key={i}>{o}</li>)}</ul>
          <h3 className="font-semibold mt-3">Sequência didática</h3>
          <ol className="list-decimal ml-6 space-y-1">
            {plan.steps.map((s,i)=>(<li key={i}><b>{s.title}</b> — {s.description} ({s.durationMinutes} min)</li>))}
          </ol>
          <h3 className="font-semibold mt-3">Avaliação</h3>
          <ul className="list-disc ml-6">{plan.assessment.map((o,i)=><li key={i}>{o}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
