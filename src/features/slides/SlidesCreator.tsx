import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { callAI } from "@/services/ai";
import { saveSlideDeck, type GeneratedSlideDeck } from "@/services/slides";

export default function SlidesCreator() {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("6o ano");
  const [tone, setTone] = useState<"dinamico" | "formal" | "visual">("dinamico");
  const [notes, setNotes] = useState("");
  const [deck, setDeck] = useState<GeneratedSlideDeck | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = topic.trim().length >= 3 && !loading;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = { topic, grade, tone, notes };
      const generated: GeneratedSlideDeck = await callAI("generate-slides", payload);
      setDeck(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha inesperada ao gerar slides.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !deck) return;
    setSaving(true);
    try {
      await saveSlideDeck(user.id, deck);
      alert("Slides salvos com sucesso!");
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
          <p className="text-sm font-semibold text-blue-600">Apresentacoes</p>
          <h1 className="text-3xl font-semibold text-gray-900">Gerar slides didaticos</h1>
          <p className="text-sm text-gray-600">
            Informe tema, serie e tom da apresentacao. A IA organiza os topicos, bullets e sugestoes de imagem.
          </p>
        </header>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">Tema</span>
                <input
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="Ex.: Biomas brasileiros"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">Serie/Ano</span>
                <input
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                  placeholder="Ex.: 7o ano"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                { value: "dinamico", label: "Dinamico" },
                { value: "formal", label: "Formal" },
                { value: "visual", label: "Visual" },
              ].map((option) => {
                const selected = tone === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTone(option.value as typeof tone)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      selected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <label className="mt-4 flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700">Notas para personalizar (opcional)</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Mensagem principal, atividades praticas, vocabulario que deve aparecer..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
              />
            </label>

            {error ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : null}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={!canGenerate}
                onClick={handleGenerate}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Gerando..." : "Gerar slides"}
              </button>
            </div>
          </section>

          {deck ? (
            <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow">
              <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{deck.title}</h2>
                  <p className="text-sm text-gray-600">Revise o roteiro e salve para consultar depois.</p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Salvando..." : "Salvar deck"}
                </button>
              </header>

              <ol className="space-y-4 text-sm text-gray-700">
                {deck.slides.map((slide, index) => (
                  <li key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <p className="font-semibold text-gray-900">
                        {index + 1}. {slide.heading}
                      </p>
                      {slide.imagePrompt ? (
                        <span className="text-xs font-medium text-blue-600">Sugestao de imagem: {slide.imagePrompt}</span>
                      ) : null}
                    </div>
                    <ul className="mt-3 list-disc space-y-1 pl-5">
                      {slide.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex}>{bullet}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
