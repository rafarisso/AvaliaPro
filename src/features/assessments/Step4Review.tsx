import type { GeneratedAssessment } from "@/services/assessments";
import Spinner from "./Spinner";

type Step4ReviewProps = {
  loading: boolean;
  assessment: GeneratedAssessment | null;
  error?: string | null;
  onRetry: () => void;
  onSave: () => void;
  saving: boolean;
};

export default function Step4Review({ loading, assessment, error, onRetry, onSave, saving }: Step4ReviewProps) {
  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow">
      <header className="space-y-1">
        <p className="text-sm font-medium text-blue-600">Passo 4</p>
        <h2 className="text-2xl font-semibold text-gray-900">Revise e finalize</h2>
        <p className="text-sm text-gray-600">
          Ajuste as questoes conforme necessario. Ao salvar, a avaliacao fica disponivel no dashboard e no Supabase.
        </p>
      </header>

      {loading ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-6 text-sm text-blue-700">
          <Spinner />
          <p>Gerando avaliacao com Gemini...</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Nao conseguimos gerar a avaliacao.</p>
          <p className="text-xs">Detalhes: {error}</p>
        </div>
      ) : null}

      {assessment ? (
        <article className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{assessment.assessmentTitle}</h3>
          </div>
          <ol className="space-y-4 text-sm text-gray-700">
            {assessment.questions.map((question) => (
              <li key={question.questionNumber} className="rounded-lg bg-white p-4 shadow-sm">
                <header className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-900">
                    {question.questionNumber}. {question.questionText}
                  </p>
                  <span className="text-xs font-medium text-blue-600">{question.points} pts</span>
                </header>
                <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{question.questionType}</p>
                {question.options && question.options.length ? (
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {question.options.map((option, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="font-medium text-blue-600">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span>{option}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {question.correctAnswer ? (
                  <p className="mt-2 text-xs font-medium text-emerald-600">
                    Gabarito: {question.correctAnswer}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </article>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:justify-end">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
        >
          Gerar novamente
        </button>
        <button
          type="button"
          disabled={!assessment || saving}
          onClick={onSave}
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar avaliacao"}
        </button>
      </div>
    </div>
  );
}
