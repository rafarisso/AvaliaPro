import Papa from "papaparse"
import { useMemo, useState } from "react"
import { auditEvent, useAuth } from "../../hooks/useAuth"
import { useNarratedLoading } from "../../hooks/useNarratedLoading"
import { useToast } from "../../hooks/useToast"
import { getSupabase } from "../services/supabaseClient"

type StudentRow = {
  nome: string
  email: string
  turma: string
}

export default function ImportStudents() {
  const supabase = useMemo(() => getSupabase(), [])
  const { user } = useAuth()
  const { showToast } = useToast()
  const { message, running, start, stop } = useNarratedLoading([
    "Analisando arquivo CSV…",
    "Validando dados…",
    "Importando alunos…",
  ])

  const [rows, setRows] = useState<StudentRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleFile = (file: File | null) => {
    if (!file) return
    setErrors([])
    start(["Lendo arquivo…", "Processando colunas…", "Quase lá…"])
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        stop()
        const parsed: StudentRow[] = []
        const localErrors: string[] = []

        (result.data as Record<string, string>[]).forEach((row, index) => {
          const nome = row.nome?.trim() ?? ""
          const email = row.email?.trim() ?? ""
          const turma = row.turma?.trim() ?? ""
          if (!nome || !email || !turma) {
            localErrors.push(`Linha ${index + 2}: campos obrigatórios ausentes.`)
            return
          }
          parsed.push({ nome, email, turma })
        })

        setRows(parsed)
        setErrors(localErrors)

        if (!parsed.length) {
          showToast("Nenhum aluno válido encontrado.", "info")
        } else {
          showToast(`Pré-visualização pronta com ${parsed.length} alunos.`, "success")
        }
      },
      error: (error) => {
        stop()
        showToast(error.message ?? "Erro ao ler CSV", "error")
      },
    })
  }

  const onImport = async () => {
    if (!rows.length) {
      showToast("Nenhum aluno para importar.", "info")
      return
    }

    setLoading(true)
    start(["Conectando ao Supabase…", "Inserindo alunos…", "Finalizando importação…"])
    try {
      const payload = rows.map((row) => ({
        nome: row.nome,
        email: row.email,
        turma: row.turma,
        user_id: user?.id ?? null,
      }))

      const { error } = await supabase.from("students").insert(payload)
      if (error) throw error

      await auditEvent("students_imported", { quantidade: rows.length })
      showToast("Alunos importados com sucesso!", "success")
      setRows([])
    } catch (error: any) {
      console.error(error)
      showToast(error?.message ?? "Erro ao importar alunos", "error")
    } finally {
      stop()
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-gray-900">Importar alunos via CSV</h1>
        <p className="text-sm text-gray-600">
          Arquivo com colunas obrigatórias: <code>nome</code>, <code>email</code>, <code>turma</code>.
        </p>
      </header>

      <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-600 shadow-sm transition hover:border-gray-400 hover:bg-gray-100">
        <span className="font-medium">Selecione um arquivo CSV</span>
        <span className="text-xs text-gray-500">Clique para escolher ou arraste aqui</span>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
      </label>

      {running && message ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 shadow">
          {message}
        </div>
      ) : null}

      {errors.length ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow">
          <p className="font-semibold">Ajustes necessários:</p>
          <ul className="list-disc space-y-1 pl-5">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {rows.length ? (
        <div className="rounded-2xl border bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Pré-visualização ({rows.length} alunos)
          </h2>
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Nome</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">E-mail</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Turma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rows.slice(0, 50).map((row, index) => (
                  <tr key={`${row.email}-${index}`}>
                    <td className="px-4 py-2">{row.nome}</td>
                    <td className="px-4 py-2">{row.email}</td>
                    <td className="px-4 py-2">{row.turma}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 50 ? (
            <p className="mt-2 text-xs text-gray-500">
              Exibindo apenas os primeiros 50 alunos de {rows.length}.
            </p>
          ) : null}
        </div>
      ) : null}

      <button className="btn-primary" onClick={onImport} disabled={!rows.length || loading}>
        {loading ? "Importando..." : `Importar ${rows.length} aluno(s)`}
      </button>
    </div>
  )
}
