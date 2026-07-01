import React, { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { useToast } from "../../hooks/useToast"

type Mode = "login" | "signup"

export default function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { showToast } = useToast()
  const { loginWithPassword, signUpWithPassword, loginWithOAuth } = useAuth()

  const [mode, setMode] = useState<Mode>(params.get("signup") ? "signup" : "login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (mode === "signup" && password.length < 6) {
      showToast("A senha precisa ter ao menos 6 caracteres.", "error")
      return
    }
    setLoading(true)
    try {
      if (mode === "login") {
        await loginWithPassword(email, password)
        showToast("Login realizado!", "success")
        navigate("/dashboard")
      } else {
        const { needsConfirmation } = await signUpWithPassword(email, password)
        if (needsConfirmation) {
          showToast("Conta criada! Confirme pelo link enviado ao seu e-mail para entrar.", "success")
          setMode("login")
        } else {
          showToast("Conta criada com sucesso!", "success")
          navigate("/dashboard")
        }
      }
    } catch (error: any) {
      console.error("[Auth]", error?.message ?? error)
      showToast(traduzErroAuth(error?.message, mode), "error")
    } finally {
      setLoading(false)
    }
  }

  const entrarComGoogle = async () => {
    try {
      await loginWithOAuth("google")
    } catch (error: any) {
      console.error("[Auth]", error?.message ?? error)
      showToast(
        "Não foi possível iniciar o login com Google. O provedor pode não estar habilitado no Supabase.",
        "error"
      )
    }
  }

  const isSignup = mode === "signup"

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-gradient-to-b from-white to-[#f7f9ff] px-6 py-10">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-6 rounded-2xl border bg-white p-8 shadow-sm">
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <img src="/AvaliaPro_logo.png" alt="AvaliaPro" className="h-20 w-auto object-contain" loading="lazy" />
          </div>
          <h2 className="text-2xl font-semibold">{isSignup ? "Crie sua conta" : "Entre na sua conta"}</h2>
          <p className="text-sm text-gray-600">
            {isSignup
              ? "É rápido e gratuito durante a validação."
              : "Acesse para criar e corrigir avaliações."}
          </p>
        </div>

        <button
          type="button"
          onClick={entrarComGoogle}
          className="flex w-full items-center justify-center gap-2 rounded-xl border py-3 font-medium transition hover:bg-gray-50"
        >
          <GoogleIcon />
          {isSignup ? "Cadastrar com Google" : "Entrar com Google"}
        </button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs uppercase tracking-widest text-gray-400">ou com e-mail</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="voce@escola.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={isSignup ? "Mínimo de 6 caracteres" : "********"}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (isSignup ? "Criando conta..." : "Entrando...") : isSignup ? "Criar conta" : "Entrar"}
        </button>

        <p className="text-center text-sm text-gray-600">
          {isSignup ? (
            <>
              Já tem conta?{" "}
              <button type="button" onClick={() => setMode("login")} className="font-medium text-primary hover:underline">
                Entrar
              </button>
            </>
          ) : (
            <>
              Ainda não tem conta?{" "}
              <button type="button" onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">
                Criar conta grátis
              </button>
            </>
          )}
        </p>

        <p className="text-center text-xs text-gray-400">
          <Link to="/landing" className="hover:underline">
            ← Voltar para a página inicial
          </Link>
        </p>
      </form>
    </main>
  )
}

function traduzErroAuth(msg: string | undefined, mode: Mode): string {
  const m = (msg || "").toLowerCase()
  if (m.includes("already registered") || m.includes("already exists"))
    return "Este e-mail já tem conta. Faça login."
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos."
  if (m.includes("email not confirmed")) return "Confirme seu e-mail pelo link que enviamos antes de entrar."
  if (m.includes("password")) return "Senha inválida (mínimo de 6 caracteres)."
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde um instante e tente de novo."
  return mode === "signup"
    ? "Não foi possível criar a conta. Tente novamente."
    : "Não foi possível entrar. Verifique os dados e tente novamente."
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}
