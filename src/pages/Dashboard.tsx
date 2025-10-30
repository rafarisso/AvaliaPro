import React, { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import PrototypeBanner from '../components/PrototypeBanner'
import { useAuth } from '../../hooks/useAuth'
import { getSupabase } from '../services/supabaseClient'
import { getEnv } from '../services/env'

type Profile = {
  id: string
  full_name: string | null
  subscription_status: 'ACTIVE' | 'TRIALING' | 'INACTIVE' | null
  trial_ends_at: string | null
}

function daysLeft(iso: string | null) {
  if (!iso) return null
  const end = new Date(iso).getTime()
  const diff = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export default function Dashboard() {
  const { PROTOTYPE_MODE } = getEnv()
  const { user, logout } = useAuth()
  const supabase = useMemo(() => getSupabase(), [])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, subscription_status, trial_ends_at')
        .eq('id', user.id)
        .single()

      if (!mounted) return

      if (error) {
        console.error(error)
        setProfile({
          id: user.id,
          full_name: null,
          subscription_status: 'INACTIVE',
          trial_ends_at: null,
        })
      } else {
        setProfile(data as Profile)
      }

      setLoading(false)
    })()

    return () => {
      mounted = false
    }
  }, [user, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PrototypeBanner />
        <Header />
        <main className="px-6">
          <div className="mx-auto max-w-3xl py-20 text-center text-gray-600">Carregando…</div>
        </main>
      </div>
    )
  }

  if (!user && !PROTOTYPE_MODE) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PrototypeBanner />
        <Header />
        <main className="px-6">
          <div className="mx-auto max-w-3xl space-y-4 py-16 text-center">
            <h2 className="text-3xl font-bold">Faça login para acessar o dashboard</h2>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-white transition hover:bg-primary-dark"
            >
              Entrar
            </a>
          </div>
        </main>
      </div>
    )
  }

  const status = profile?.subscription_status ?? (user ? 'INACTIVE' : 'TRIALING')
  const unlocked = PROTOTYPE_MODE || status === 'ACTIVE' || status === 'TRIALING'
  const dleft = daysLeft(profile?.trial_ends_at ?? null)
  const displayEmail = user?.email ?? 'demo@avaliapro.com'

  return (
    <div className="min-h-screen bg-gray-50">
      <PrototypeBanner />
      <Header />
      <main className="px-6 pb-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 py-10">
          <div className="flex flex-col gap-6 rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
                {(PROTOTYPE_MODE || !unlocked) && (
                  <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                    Modo Protótipo
                  </span>
                )}
              </div>
              {user ? (
                <button
                  onClick={logout}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Sair
                </button>
              ) : (
                <a
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Entrar
                </a>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Usuário atual: <span className="font-medium">{displayEmail}</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Status da assinatura</p>
              <div className="mt-3 flex items-center gap-2">
                {status === 'ACTIVE' && (
                  <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                    ATIVA
                  </span>
                )}
                {status === 'TRIALING' && (
                  <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                    EM TESTE
                  </span>
                )}
                {status === 'INACTIVE' && (
                  <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                    INATIVA
                  </span>
                )}
              </div>
              {status === 'TRIALING' && dleft !== null && (
                <p className="mt-3 text-sm text-gray-600">
                  Dias restantes: <strong>{dleft}</strong>
                </p>
              )}
              {!unlocked && (
                <a
                  href="/api/create-checkout"
                  className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-primary-dark"
                >
                  Assinar agora
                </a>
              )}
              {unlocked && (
                <p className="mt-5 text-sm text-gray-500">
                  Acesso liberado para experimentação — aproveite o protótipo.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Atividades recentes</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li>- Avaliação de Geografia criada</li>
                <li>- Plano de aula salvo</li>
                <li>- Relatório exportado</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Atalhos</p>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <a className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100" href="#">
                  Criar avaliação (IA)
                </a>
                <a className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100" href="#">
                  Gerar plano de aula
                </a>
                <a className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100" href="#">
                  Relatórios
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
