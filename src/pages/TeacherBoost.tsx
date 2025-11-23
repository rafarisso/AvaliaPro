import { Link } from "react-router-dom"
import Header from "../components/Header"

export default function TeacherBoost() {
  const highlights = [
    { title: "Slides em minutos", desc: "Use IA para criar apresentações a partir de fotos do livro ou um tema simples." },
    { title: "Planos de aula", desc: "Estruture objetivos, atividades e avaliações rapidamente." },
    { title: "Avaliações prontas", desc: "Provas e gabaritos gerados em poucos cliques." },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f5f7ff]">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-12 space-y-12">
        <section className="grid gap-10 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">AvaliaPro • Teacher Boost</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900">
              Materiais completos <span className="text-blue-600">em minutos</span>
            </h1>
            <p className="text-lg text-gray-600">
              Gere slides em PPT, provas com gabarito e planos de aula a partir de um tema ou fotos do livro.
              Economize tempo e mantenha o foco no aluno.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/modelos"
                className="rounded-xl bg-blue-600 px-5 py-3 text-white font-medium shadow hover:bg-blue-700"
              >
                Criar slides agora
              </Link>
              <Link
                to="/avaliacoes/nova"
                className="rounded-xl border px-5 py-3 font-medium text-gray-800 hover:bg-white"
              >
                Gerar avaliação
              </Link>
            </div>
            <p className="text-sm text-gray-500">Sem burocracia. Use IA de forma segura e rápida.</p>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-full bg-blue-100 blur-3xl" />
            <div className="relative rounded-2xl border bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Prova pronta</p>
                  <p className="text-2xl font-semibold text-gray-900">8º A • Geografia</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">IA ativa</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border p-3">
                  <p className="text-sm font-semibold text-gray-900">Questão objetiva</p>
                  <p className="text-sm text-gray-600">"Qual massa de ar traz umidade para a Amazônia?"</p>
                  <p className="text-xs text-green-600 mt-1">Gabarito: C - MTA</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-sm font-semibold text-gray-900">Slide gerado</p>
                  <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                    <li>Definição do tema</li>
                    <li>3 tópicos chave</li>
                    <li>Nota do professor</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-lg font-semibold text-gray-900">{item.title}</p>
              <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-blue-600 p-6 text-white shadow">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-blue-100">Pronto para testar?</p>
              <p className="text-xl font-semibold">Acesse o dashboard e gere seu próximo material agora.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow hover:bg-blue-50"
              >
                Ir para o dashboard
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-white px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700/30"
              >
                Entrar
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
