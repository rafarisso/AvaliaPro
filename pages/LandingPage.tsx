import React from 'react'
import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <main className="min-h-[80vh] bg-gradient-to-b from-white to-[#f7f9ff]">
      <header className="w-full border-b bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/AvaliaPro_logo.svg" alt="AvaliaPro" className="h-7" />
            <span className="sr-only">AvaliaPro</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a href="/" className="text-gray-700 hover:text-black">Início</a>
            <Link to="/login" className="text-gray-700 hover:text-black">Entrar</Link>
            <Link to="/dashboard" className="text-gray-700 hover:text-black">Dashboard</Link>
          </nav>
        </div>
      </header>

      <section className="px-6">
        <div className="max-w-6xl mx-auto py-16 grid gap-12 md:grid-cols-2 items-center">
          <div className="space-y-5">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Avaliações e planos com IA <span className="text-primary">em minutos</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Gemini + Supabase para criar provas, planos e relatórios. 15 dias grátis, depois R$ 39,90/mês.
            </p>
            <div className="flex gap-3">
              <a
                href="/api/create-checkout"
                className="inline-flex items-center justify-center rounded-xl bg-primary text-white px-5 py-3 hover:bg-primary-dark transition shadow-sm"
              >
                Começar grátis (15 dias)
              </a>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl border px-5 py-3 hover:bg-white transition"
              >
                Entrar
              </Link>
            </div>
            <p className="text-sm text-gray-500">Sem cobrança no período de teste. Cancele quando quiser.</p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full"></div>
            <div className="relative rounded-2xl border bg-white shadow-sm p-6">
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
                <p className="text-sm text-gray-600">“Minha rotina mudou. Em minutos tenho materiais prontos.”</p>
                <p className="text-xs text-gray-500 mt-1">— Usuário AvaliaPro</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
