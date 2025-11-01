type Step1Values = {
  topic: string;
  discipline: string;
  grade: string;
};

type Step1TopicProps = Step1Values & {
  onChange: (values: Partial<Step1Values>) => void;
};

export default function Step1Topic({ topic, discipline, grade, onChange }: Step1TopicProps) {
  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow">
      <header className="space-y-1">
        <p className="text-sm font-medium text-blue-600">Passo 1</p>
        <h2 className="text-2xl font-semibold text-gray-900">Defina o tema da avaliacao</h2>
        <p className="text-sm text-gray-600">
          Escolha um assunto claro e contextualize com disciplina e serie para o modelo sugerir questoes coerentes.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Tema</span>
          <input
            value={topic}
            onChange={(event) => onChange({ topic: event.target.value })}
            placeholder="Ex.: Ciclo da agua"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Disciplina</span>
          <input
            value={discipline}
            onChange={(event) => onChange({ discipline: event.target.value })}
            placeholder="Ex.: Ciencias"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Serie/Ano</span>
          <input
            value={grade}
            onChange={(event) => onChange({ grade: event.target.value })}
            placeholder="Ex.: 6o ano"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
          />
        </label>
      </div>
    </div>
  );
}
