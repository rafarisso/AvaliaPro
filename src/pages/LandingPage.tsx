import React from "react"
import { Link } from "react-router-dom"
import Header from "../components/Header"

export default function LandingPage() {
  return (
    <main className="min-h-[80vh] bg-gradient-to-b from-white to-[#f7f9ff]">
      <Header />
      <section className="px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-12 py-16 md:grid-cols-2">
          <div className="space-y-5">
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Crie e corrija provas com IA <span className="text-primary">em minutos</span>
            </h1>
            <p className="text-lg text-gray-600">
              Gere avaliações, corrija provas manuscritas por foto e acompanhe o desempenho da turma — tudo num só
              lugar, feito para a rotina do professor.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login?signup=1"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-white shadow-sm transition hover:bg-primary-dark"
              >
                Criar conta grátis
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl border px-5 py-3 transition hover:bg-white"
              >
                Entrar
              </Link>
            </div>
            <p className="text-sm text-gray-500">Gratuito durante o período de validação.</p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative space-y-3 rounded-2xl border bg-white p-6 shadow-sm">
              <div className="rounded-xl border p-4">
                <p className="text-sm font-semibold text-gray-900">📝 Gerar avaliações com IA</p>
                <p className="text-xs text-gray-500">Provas, gabaritos e planos de aula em minutos.</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm font-semibold text-gray-900">📷 Corrigir por foto</p>
                <p className="text-xs text-gray-500">A IA lê a prova manuscrita e sugere a nota; você revisa.</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm font-semibold text-gray-900">📊 Desempenho da turma</p>
                <p className="text-xs text-gray-500">Média, nota por aluno e acerto por questão.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
