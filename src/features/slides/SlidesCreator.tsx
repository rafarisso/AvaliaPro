import { useState } from "react";
import { callAI } from "@/services/ai";
import { saveSlideDeck, type GeneratedSlideDeck } from "@/services/slides";
import { useAuth } from "@/hooks/useAuth";

export default function SlidesCreator() {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("6º ano");
  const [deck, setDeck] = useState<GeneratedSlideDeck | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const d = await callAI("generate-slides", { topic, grade });
      setDeck(d);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user || !deck) return;
    await saveSlideDeck(user.id, deck);
    alert("Slides salvos!");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-4">Gerar slides</h1>
      <div className="grid gap-3">
        <input className="border rounded p-3" placeholder="Tema" value={topic} onChange={e=>setTopic(e.target.value)} />
        <input className="border rounded p-3" placeholder="Série/Ano" value={grade} onChange={e=>setGrade(e.target.value)} />
        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={loading || topic.length<3}
                  className="px-4 py-2 rounded bg-blue-600 text-white">
            {loading? "Gerando..." : "Gerar com IA"}
          </button>
          {deck && <button onClick={handleSave} className="px-4 py-2 rounded bg-green-600 text-white">Salvar</button>}
        </div>
      </div>

      {deck && (
        <div className="mt-6 border rounded p-4 bg-white">
          <h2 className="text-xl font-medium">{deck.title}</h2>
          <ol className="list-decimal ml-6 space-y-3">
            {deck.slides.map((s,i)=>(
              <li key={i}>
                <div className="font-semibold">{s.heading}</div>
                <ul className="list-disc ml-6">{s.bullets.map((b,j)=><li key={j}>{b}</li>)}</ul>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
