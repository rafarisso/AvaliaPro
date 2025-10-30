import { FormEvent, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getSupabase } from "../services/supabaseClient"

export default function LoginPage() {
  const navigate = useNavigate()
  const supabase = getSupabase()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function signin(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (!error) {
      navigate("/dashboard")
      return
    }
    alert("Falha no login: " + (error?.message || "verifique seus dados"))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold text-gray-900">Entrar</h1>
        <p className="text-sm text-gray-600">
          <strong>Protótipo gratuito</strong> — explore à vontade. Nenhuma cobrança ativa.
        </p>
        <form onSubmit={signin} className="space-y-3">
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="E-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Senha"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}
