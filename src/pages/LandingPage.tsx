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
              Avaliações e planos com IA <span className="text-primary">em minutos</span>
            </h1>
            <p className="text-lg text-gray-600">
              Gemini + Supabase para criar provas, planos e relatórios. Estamos em modo protótipo gratuito — explore
              tudo sem custo.
            </p>
            <div className="flex gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-white shadow-sm transition hover:bg-primary-dark"
              >
                Abrir dashboard do protótipo
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl border px-5 py-3 transition hover:bg-white"
              >
                Entrar
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Zero cobranças neste estágio. Use os fluxos e compartilhe feedback com nosso time.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative rounded-2xl border bg-white p-6 shadow-sm">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-gray-500">Professores</p>
                  <p className="text-2xl font-semibold">+1.2k</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-gray-500">Avaliações geradas</p>
                  <p className="text-2xl font-semibold">48k</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-gray-500">Tempo médio</p>
                  <p className="text-2xl font-semibold">2min</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border p-4">
                <p className="text-sm text-gray-600">"Minha rotina mudou. Em minutos tenho materiais prontos."</p>
                <p className="mt-1 text-xs text-gray-500">- Usuário AvaliaPro</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
