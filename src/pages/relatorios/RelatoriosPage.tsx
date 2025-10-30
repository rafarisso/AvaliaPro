import { useEffect, useState } from "react"
import { getSupabase } from "../../services/supabaseClient"

type MetricRow = {
  day: string
  dau: number
}

export default function RelatoriosPage() {
  const supabase = getSupabase()
  const [dau, setDau] = useState<MetricRow[]>([])

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data } = await supabase.from("metrics_dau").select("*").limit(14)
      if (active) {
        setDau((data as MetricRow[]) || [])
      }
    })()

    return () => {
      active = false
    }
  }, [supabase])

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <h1 className="text-xl font-semibold">Relatórios</h1>
      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="mb-2 font-medium">DAU (últimos dias)</div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          {dau.map((row, index) => (
            <li key={index}>
              {new Date(row.day).toLocaleDateString()} — {row.dau} usuário(s)
            </li>
          ))}
          {dau.length === 0 && <li>Sem dados ainda.</li>}
        </ul>
      </div>
    </div>
  )
}
