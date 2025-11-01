import { useState } from "react";
import { callAI } from "@/services/ai";
import { saveAssessment, type GeneratedAssessment } from "@/services/assessments";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function AssessmentCreator() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("6º ano");
  const [discipline, setDiscipline] = useState("Geografia");
  const [numQuestions, setNumQuestions] = useState(6);
  const [level, setLevel] = useState("médio");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedAssessment | null>(null);
  const canGenerate = topic.trim().length >= 3;

  async function handleGenerate() {
    if (!user) return;
    setLoading(true);
    try {
      const payload = { topic, grade, discipline, numQuestions, level };
      const data: GeneratedAssessment = await callAI("generate-structured", payload);
      setGenerated(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user || !generated) return;
    const id = await saveAssessment(user.id, generated);
    navigate(`/avaliacoes/${id}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-4">Criar avaliação</h1>

      <div className="grid gap-4">
        <input className="border rounded p-3" placeholder="Tema (ex.: Tipos de rochas)"
               value={topic} onChange={e=>setTopic(e.target.value)} />
        <div className="grid grid-cols-3 gap-3">
          <input className="border rounded p-3" value={grade} onChange={e=>setGrade(e.target.value)} />
          <input className="border rounded p-3" value={discipline} onChange={e=>setDiscipline(e.target.value)} />
          <input className="border rounded p-3" type="number" min={3} max={20}
                 value={numQuestions} onChange={e=>setNumQuestions(+e.target.value)} />
        </div>
        <select className="border rounded p-3 w-48" value={level} onChange={e=>setLevel(e.target.value)}>
          <option>fácil</option><option>médio</option><option>difícil</option>
        </select>

        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={!canGenerate || loading}
                  className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
            {loading ? "Gerando..." : "Gerar com IA"}
          </button>
          {generated && (
            <button onClick={handleSave}
                    className="px-4 py-2 rounded bg-green-600 text-white">
              Salvar
            </button>
          )}
        </div>

        {generated && (
          <div className="border rounded p-4 bg-white">
            <h2 className="text-xl font-medium mb-2">{generated.assessmentTitle}</h2>
            <ol className="space-y-2 list-decimal ml-5">
              {generated.questions.map(q=>(
                <li key={q.questionNumber}>
                  <div className="font-medium">{q.questionText} ({q.points} pts)</div>
                  {q.options?.length ? <ul className="list-disc ml-5">{q.options.map((o,i)=><li key={i}>{o}</li>)}</ul> : null}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
