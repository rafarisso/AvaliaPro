import React, { useState } from "react"
import Header from "../components/Header"
import { getSupabase } from "../services/supabaseClient"

type Status = "idle" | "loading" | "ok" | "error"

export default function Health() {
  const [status, setStatus] = useState<Status>("idle")
  const [details, setDetails] = useState<string>("")

  const testConnection = async () => {
    setStatus("loading")
    setDetails("")
    const supabase = getSupabase()

    try {
      const { data, error } = await supabase.from("_health").select("ok").limit(1)

      if (error) {
        if (/relation .* does not exist/i.test(error.message)) {
          const sessionResult = await supabase.auth.getSession()
          const hasSession = Boolean(sessionResult.data.session)
          setStatus("ok")
          setDetails(`Sessão carregada via auth.getSession(). sessionPresent=${hasSession}`)
          return
        }

        throw error
      }

      setStatus("ok")
      setDetails(`Resposta da tabela _health: ${JSON.stringify(data)}`)
    } catch (error: any) {
      console.error("[Health check]", error?.message ?? error)
      setStatus("error")
      setDetails(error?.message ?? "Erro desconhecido")
    }
  }

  return (
    <main className="min-h-[80vh] bg-gradient-to-b from-white to-[#f7f9ff]">
      <Header />
      <section className="px-6">
        <div className="max-w-3xl mx-auto py-16 space-y-6">
          <h1 className="text-3xl font-bold">Health Check</h1>
          <p className="text-gray-600">
            Use este teste para validar se as variáveis de ambiente do Supabase estão disponíveis em runtime
            (Netlify) e se a API responde.
          </p>
          <button
            type="button"
            onClick={testConnection}
            disabled={status === "loading"}
            className="rounded-lg bg-primary text-white px-4 py-2 font-medium hover:bg-primary-dark transition disabled:opacity-60"
          >
            {status === "loading" ? "Testando…" : "Testar conexão"}
          </button>

          {status !== "idle" && (
            <div
              className={`rounded-lg border p-4 text-sm ${
                status === "ok" ? "border-green-200 bg-green-50 text-green-800" : ""
              } ${status === "error" ? "border-red-200 bg-red-50 text-red-700" : ""}`}
            >
              <p className="font-semibold">
                {status === "ok" && "Conexão estabelecida com sucesso."}
                {status === "error" && "Falha na conexão com o Supabase."}
                {status === "loading" && "Executando teste…"}
              </p>
              {details && <p className="mt-2 break-words text-gray-700">{details}</p>}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
