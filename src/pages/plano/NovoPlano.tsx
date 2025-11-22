import { useEffect } from "react"
import { getSupabase } from "../../services/supabaseClient"

export default function NovoPlano() {
  const supabase = getSupabase()

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return
      const uid = data.user?.id
      if (uid) {
        await supabase.from("user_events").insert({ user_id: uid, event: "lesson_plan_new_view" })
      }
    })
    return () => {
      active = false
    }
  }, [supabase])

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <h1 className="text-xl font-semibold">Novo plano de aula</h1>
      <p className="text-gray-600">
        Estruture objetivos, metodologias e avaliações em um fluxo simples. Blocos inteligentes chegam em breve.
      </p>
      <div className="rounded-2xl bg-white p-4 shadow">
        Em breve você poderá montar todo o plano aqui e compartilhar com a equipe ou alunos.
      </div>
    </div>
  )
}
