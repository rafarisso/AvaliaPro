import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../../components/Header"
import { useAuth } from "../../../hooks/useAuth"
import { getSupabase } from "../../services/supabaseClient"

type AvaliacaoOpt = { id: string; titulo: string; disciplina: string | null; serie: string | null }
type TurmaOpt = { id: string; nome: string; serie: string | null }
type Aplicacao = {
  id: string
  data_aplicacao: string | null
  criado_em: string
  avaliacao: { titulo: string; disciplina: string | null } | null
  turma: { nome: string } | null
}

const APLICACAO_SELECT =
  "id, data_aplicacao, criado_em, avaliacao:avaliacoes(titulo, disciplina), turma:turmas(nome)"

export default function AplicacoesPage() {
  const supabase = getSupabase()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoOpt[]>([])
  const [turmas, setTurmas] = useState<TurmaOpt[]>([])
  const [aplicacoes, setAplicacoes] = useState<Aplicacao[]>([])

  const [avaliacaoId, setAvaliacaoId] = useState("")
  const [turmaId, setTurmaId] = useState("")
  const [dataAplicacao, setDataAplicacao] = useState("")

  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)

  useEffect(() => {
    void carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function carregar() {
    setErro(null)
    setLoading(true)
    const [av, tu, ap] = await Promise.all([
      supabase.from("avaliacoes").select("id, titulo, disciplina, serie").order("criado_em", { ascending: false }),
      supabase.from("turmas").select("id, nome, serie").order("criado_em", { ascending: false }),
      supabase.from("aplicacoes").select(APLICACAO_SELECT).order("criado_em", { ascending: false }),
    ])
    setLoading(false)
    if (av.error) return setErro(av.error.message)
    if (tu.error) return setErro(tu.error.message)
    if (ap.error) return setErro(ap.error.message)
    setAvaliacoes((av.data || []) as AvaliacaoOpt[])
    setTurmas((tu.data || []) as TurmaOpt[])
    setAplicacoes((ap.data || []) as unknown as Aplicacao[])
  }

  async function criarAplicacao(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setMensagem(null)
    if (!avaliacaoId) return setErro("Escolha uma avaliação.")
    if (!turmaId) return setErro("Escolha uma turma.")
    if (!user?.id) return setErro("Sessão expirada. Faça login novamente.")

    setSalvando(true)
    const { data, error } = await supabase
      .from("aplicacoes")
      .insert({
        avaliacao_id: avaliacaoId,
        turma_id: turmaId,
        data_aplicacao: dataAplicacao || null,
        criado_por: user.id,
      })
      .select(APLICACAO_SELECT)
      .single()
    setSalvando(false)

    if (error) {
      if ((error as any).code === "23505") {
        return setErro("Essa avaliação já foi aplicada a essa turma.")
      }
      return setErro(error.message)
    }

    setAplicacoes((prev) => [data as unknown as Aplicacao, ...prev])
    setAvaliacaoId("")
    setTurmaId("")
    setDataAplicacao("")
    setMensagem("Avaliação aplicada. Agora você já pode corrigir as provas dos alunos.")
  }

  async function excluirAplicacao(ap: Aplicacao) {
    if (!window.confirm("Excluir esta aplicação e todas as correções feitas nela?")) return
    setErro(null)
    const { error } = await supabase.from("aplicacoes").delete().eq("id", ap.id)
    if (error) return setErro(error.message)
    setAplicacoes((prev) => prev.filter((x) => x.id !== ap.id))
  }

  const semAvaliacoes = !loading && avaliacoes.length === 0
  const semTurmas = !loading && turmas.length === 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Voltar
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Aplicar e corrigir</h1>
            <p className="text-sm text-gray-600">
              Vincule uma avaliação a uma turma. Depois, corrija as provas escaneadas dos alunos.
            </p>
          </div>
        </div>

        {erro && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{erro}</p>}
        {mensagem && <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{mensagem}</p>}

        {(semAvaliacoes || semTurmas) && (
          <div className="rounded-2xl border border-dashed bg-white p-5 text-sm text-gray-600">
            Para aplicar uma avaliação você precisa de pelo menos{" "}
            {semAvaliacoes && (
              <button onClick={() => navigate("/avaliacoes/nova")} className="font-medium text-blue-600 hover:underline">
                uma avaliação criada
              </button>
            )}
            {semAvaliacoes && semTurmas && " e "}
            {semTurmas && (
              <button onClick={() => navigate("/turmas")} className="font-medium text-blue-600 hover:underline">
                uma turma cadastrada
              </button>
            )}
            .
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          {/* NOVA APLICAÇÃO */}
          <div className="lg:col-span-1">
            <form onSubmit={criarAplicacao} className="space-y-3 rounded-2xl bg-white p-5 shadow">
              <h2 className="text-lg font-semibold text-gray-900">Nova aplicação</h2>

              <div>
                <label className="text-sm font-medium text-gray-700">Avaliação</label>
                <select
                  value={avaliacaoId}
                  onChange={(e) => setAvaliacaoId(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione…</option>
                  {avaliacoes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.titulo}
                      {a.disciplina ? ` — ${a.disciplina}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Turma</label>
                <select
                  value={turmaId}
                  onChange={(e) => setTurmaId(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione…</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                      {t.serie ? ` (${t.serie})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Data (opcional)</label>
                <input
                  type="date"
                  value={dataAplicacao}
                  onChange={(e) => setDataAplicacao(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {salvando ? "Aplicando..." : "Aplicar avaliação"}
              </button>
            </form>
          </div>

          {/* LISTA DE APLICAÇÕES */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-5 shadow">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Aplicações</h2>
                <span className="text-sm text-gray-500">{aplicacoes.length}</span>
              </div>

              {loading ? (
                <p className="text-sm text-gray-500">Carregando…</p>
              ) : aplicacoes.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma aplicação ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {aplicacoes.map((ap) => (
                    <li key={ap.id} className="rounded-xl border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {ap.avaliacao?.titulo ?? "Avaliação"}
                            {ap.avaliacao?.disciplina ? ` · ${ap.avaliacao.disciplina}` : ""}
                          </div>
                          <div className="text-xs text-gray-500">
                            Turma: {ap.turma?.nome ?? "—"}
                            {ap.data_aplicacao ? ` · ${formatarData(ap.data_aplicacao)}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => navigate(`/correcao/${ap.id}`)}
                            className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                          >
                            Corrigir provas →
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/desempenho/${ap.id}`)}
                            className="rounded-xl border px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            Desempenho
                          </button>
                          <button
                            type="button"
                            onClick={() => excluirAplicacao(ap)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function formatarData(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR")
  } catch {
    return iso
  }
}
