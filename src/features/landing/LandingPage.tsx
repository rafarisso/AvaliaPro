type LandingPageProps = {
  onContinue: () => void;
};

export default function LandingPage({ onContinue }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f7f9ff] to-white">
      <div className="relative overflow-hidden">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 pb-16 pt-24 md:flex-row md:items-center">
          <div className="space-y-6 md:w-1/2">
            <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
              Gemini + Supabase
            </p>
            <h1 className="text-4xl font-semibold text-gray-900 md:text-5xl">
              Planeje avaliacoes, planos e slides com IA, prontos para sala de aula.
            </h1>
            <p className="text-lg text-gray-600">
              Fluxo guiado para transformar conteudos em experiencias completas. Sem planilhas enormes ou horas de
              preparo: informe o tema e revise o resultado.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onContinue}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
              >
                Entrar no painel
              </button>
              <a
                href="#recursos"
                className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-6 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                Ver recursos
              </a>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>Assinatura opcional (em breve)</span>
              <span className="hidden h-3 w-px bg-gray-300 sm:block" />
              <span>Deploy continuo via Netlify</span>
            </div>
          </div>

          <div className="relative md:w-1/2">
            <div className="absolute -left-10 -top-10 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl">
              <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                <p className="text-sm font-semibold text-gray-700">Fluxo IA AvaliaPro</p>
                <p className="text-xs text-gray-500">IA gera estrutura, Supabase salva e organiza</p>
              </div>
              <dl className="grid gap-4 p-6 text-sm text-gray-700">
                <div className="rounded-xl border border-gray-100 bg-blue-50/60 p-4">
                  <dt className="font-semibold text-blue-700">1. Tema e contexto</dt>
                  <dd className="mt-1 text-xs text-gray-600">Informe disciplina, serie e habilidades.</dd>
                </div>
                <div className="rounded-xl border border-gray-100 bg-emerald-50/60 p-4">
                  <dt className="font-semibold text-emerald-700">2. Geracao inteligente</dt>
                  <dd className="mt-1 text-xs text-gray-600">Gemini retorna itens em JSON validado.</dd>
                </div>
                <div className="rounded-xl border border-gray-100 bg-purple-50/60 p-4">
                  <dt className="font-semibold text-purple-700">3. Revisao colaborativa</dt>
                  <dd className="mt-1 text-xs text-gray-600">Edite os itens antes de salvar.</dd>
                </div>
                <div className="rounded-xl border border-gray-100 bg-orange-50/60 p-4">
                  <dt className="font-semibold text-orange-700">4. Persistencia</dt>
                  <dd className="mt-1 text-xs text-gray-600">Grave no Supabase e acompanhe no dashboard.</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <section id="recursos" className="bg-white py-16">
        <div className="mx-auto w-full max-w-6xl px-4">
          <header className="mb-10 text-center">
            <p className="text-sm font-semibold text-blue-600">Recursos principais</p>
            <h2 className="text-3xl font-semibold text-gray-900">Tudo que voce precisa para planejar as proximas aulas</h2>
            <p className="mt-4 text-sm text-gray-600">
              IA gera, voce revisa, Supabase salva com historico. Mantenha consistencia e economia de tempo.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Avaliacao estruturada",
                description: "Questoes numeradas com peso e gabarito. Ajuste antes de salvar.",
              },
              {
                title: "Plano de aula completo",
                description: "Objetivos, materiais, sequencias com tempo e avaliacao coerente.",
              },
              {
                title: "Slides prontos",
                description: "Bullets objetivos e sugestao de imagem por slide, pronto para exportar.",
              },
            ].map((item) => (
              <article key={item.title} className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
                <button
                  type="button"
                  onClick={onContinue}
                  className="text-sm font-semibold text-blue-600 hover:underline"
                >
                  Comecar agora
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
