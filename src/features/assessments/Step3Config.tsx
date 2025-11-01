type Step3Values = {
  numQuestions: number;
  level: "facil" | "medio" | "dificil";
  questionType: "multipla_escolha" | "dissertativa" | "mista";
  includeAnswerKey: boolean;
};

type Step3ConfigProps = Step3Values & {
  onChange: (values: Partial<Step3Values>) => void;
};

export default function Step3Config({
  numQuestions,
  level,
  questionType,
  includeAnswerKey,
  onChange,
}: Step3ConfigProps) {
  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow">
      <header className="space-y-1">
        <p className="text-sm font-medium text-blue-600">Passo 3</p>
        <h2 className="text-2xl font-semibold text-gray-900">Configure a avaliacao</h2>
        <p className="text-sm text-gray-600">
          Defina quantidade de questoes, nivel de dificuldade e formato preferido antes de gerar com IA.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Quantidade de questoes</span>
          <input
            type="number"
            min={3}
            max={20}
            value={numQuestions}
            onChange={(event) => onChange({ numQuestions: Number(event.target.value) })}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Nivel</span>
          <select
            value={level}
            onChange={(event) => onChange({ level: event.target.value as Step3Values["level"] })}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
          >
            <option value="facil">Facil</option>
            <option value="medio">Medio</option>
            <option value="dificil">Dificil</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-sm font-medium text-gray-700">Formato das questoes</span>
          <div className="grid gap-2 md:grid-cols-3">
            {[
              { value: "multipla_escolha", label: "Multipla escolha" },
              { value: "dissertativa", label: "Dissertativa" },
              { value: "mista", label: "Mista" },
            ].map((option) => {
              const selected = questionType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange({ questionType: option.value as Step3Values["questionType"] })}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    selected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </label>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
        <input
          type="checkbox"
          checked={includeAnswerKey}
          onChange={(event) => onChange({ includeAnswerKey: event.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        Incluir gabarito no resultado
      </label>
    </div>
  );
}
