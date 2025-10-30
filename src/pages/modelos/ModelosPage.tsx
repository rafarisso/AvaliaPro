import { useEffect, useState } from "react"
import { getSupabase } from "../../services/supabaseClient"

type Template = {
  id: string
  disciplina: string | null
  titulo: string
}

export default function ModelosPage() {
  const supabase = getSupabase()
  const [items, setItems] = useState<Template[]>([])

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data } = await supabase
        .from("templates")
        .select("id, disciplina, titulo")
        .limit(20)
      if (active) {
        setItems((data as Template[]) || [])
      }
    })()

    return () => {
      active = false
    }
  }, [supabase])

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <h1 className="text-xl font-semibold">Modelos prontos</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((template) => (
          <div key={template.id} className="rounded-2xl bg-white p-4 shadow">
            <div className="font-medium">{template.titulo}</div>
            <div className="text-sm text-gray-500">{template.disciplina || "Geral"}</div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-2xl bg-white p-4 text-gray-500 shadow">
            Nenhum modelo cadastrado ainda.
          </div>
        )}
      </div>
    </div>
  )
}
