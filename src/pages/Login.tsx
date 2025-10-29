import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

export default function Login() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { loginWithPassword, loginWithOAuth } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      await loginWithPassword(email, password)
      showToast('Login realizado!', 'success')
      navigate('/dashboard')
    } catch (error: any) {
      console.error('[Auth]', error?.message ?? error)
      showToast(
        'Falha ao autenticar. Verifique se o domínio está permitido nas URLs do Supabase e se as chaves estão corretas (env.js).',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    try {
      await loginWithOAuth('google')
    } catch (error: any) {
      console.error('[Auth]', error?.message ?? error)
      showToast(
        'Falha ao autenticar. Verifique se o domínio está permitido nas URLs do Supabase e se as chaves estão corretas (env.js).',
        'error'
      )
    }
  }

  return (
    <main className="min-h-[80vh] bg-gradient-to-b from-white to-[#f7f9ff] flex items-center justify-center px-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border bg-white shadow-sm p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Entre na sua conta</h2>
          <p className="text-sm text-gray-600">Use seu e-mail corporativo para acessar o AvaliaPro.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="voce@escola.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary text-white py-3 font-medium hover:bg-primary-dark transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs uppercase tracking-widest text-gray-400">ou</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={loginWithGoogle}
          className="w-full rounded-xl border py-3 font-medium hover:bg-gray-50 transition"
        >
          Entrar com Google
        </button>
      </form>
    </main>
  )
}
