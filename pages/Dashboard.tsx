import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getSupabase } from '../services/supabaseClient'

type Profile = {
  id: string
  full_name: string | null
  subscription_status: 'ACTIVE' | 'TRIALING' | 'INACTIVE' | null
  trial_ends_at: string | null
}

function daysLeft(iso: string | null) {
  if (!iso) return null
  const end = new Date(iso).getTime()
  const diff = Math.ceil((end - Date.now()) / (1000*60*60*24))
  return diff > 0 ? diff : 0
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const supabase = useMemo(() => getSupabase(), [])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!user) { setLoading(false); return }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, subscription_status, trial_ends_at')
        .eq('id', user.id)
        .single()
      if (!mounted) return
      if (error) {
        console.error(error)
        setProfile({ id: user.id, full_name: null, subscription_status: 'INACTIVE', trial_ends_at: null })
      } else {
        setProfile(data as any)
      }
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [user, supabase])

  if (!user) {
    return (
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-3xl font-bold">Faça login para acessar o dashboard</h2>
          <a href="/login" className="inline-flex items-center justify-center rounded-lg bg-primary text-white px-5 py-3 hover:bg-primary-dark transition">Entrar</a>
        </div>
      </section>
    )
  }

  const status = profile?.subscription_status ?? 'INACTIVE'
  const dleft = daysLeft(profile?.trial_ends_at ?? null)

  return (
    <main className="px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/AvaliaPro_logo.svg" className="h-7" alt="AvaliaPro" />
            <div>
              <h1 className="text-2xl font-semibold">Dashboard</h1>
              <p className="text-gray-600 text-sm">Usuário: <span className="font-medium">{user.email}</span></p>
            </div>
          </div>
          <button onClick={logout} className="rounded-lg border px-4 py-2 hover:bg-gray-50">Sair</button>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">Status da assinatura</p>
            <div className="mt-2">
              {status === 'ACTIVE'   && <span className="inline-flex rounded-full bg-green-100 text-green-700 text-sm px-3 py-1">ATIVA</span>}
              {status === 'TRIALING' && <span className="inline-flex rounded-full bg-yellow-100 text-yellow-800 text-sm px-3 py-1">EM TESTE</span>}
              {status === 'INACTIVE' && <span className="inline-flex rounded-full bg-gray-100 text-gray-700 text-sm px-3 py-1">INATIVA</span>}
            </div>
            {status === 'TRIALING' && dleft !== null && (
              <p className="text-sm text-gray-600 mt-2">Dias restantes: <strong>{dleft}</strong></p>
            )}
            {status !== 'ACTIVE' && (
              <a href="/api/create-checkout" className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary text-white px-4 py-2 hover:bg-primary-dark transition">
                Assinar agora
              </a>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">Atividades recentes</p>
            <ul className="mt-2 space-y-2 text-sm text-gray-700">
              <li>• Avaliação de Geografia criada</li>
              <li>• Plano de aula salvo</li>
              <li>• Relatório exportado</li>
            </ul>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">Atalhos</p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <a className="rounded-lg border px-3 py-2 hover:bg-gray-50" href="#">Criar avaliação (IA)</a>
              <a className="rounded-lg border px-3 py-2 hover:bg-gray-50" href="#">Gerar plano de aula</a>
              <a className="rounded-lg border px-3 py-2 hover:bg-gray-50" href="#">Relatórios</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
