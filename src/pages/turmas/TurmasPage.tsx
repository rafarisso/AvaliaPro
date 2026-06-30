import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../../components/Header"
import { useAuth } from "../../../hooks/useAuth"
import { useToast } from "../../../hooks/useToast"
import { getSupabase } from "../../services/supabaseClient"

type Turma = { id: string; nome: string; serie: string | null; criado_em: string }
type Aluno = { id: string; nome: string; matricula: string | null; turma_id: string }

export default function TurmasPage() {
  const supabase = getSupabase()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [turmas, setTurmas] = useState<Turma[]>([])
  const [selecionada, setSelecionada] = useState<Turma | null>(null)
  const [alunos, setAlunos] = useState<Aluno[]>([])

  const [novaTurmaNome, setNovaTurmaNome] = useState("")
  const [novaTurmaSerie, setNovaTurmaSerie] = useState("")
  const [novoAlunoNome, setNovoAlunoNome] = useState("")
  const [novoAlunoMatricula, setNovoAlunoMatricula] = useState("")
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const [importando, setImportando] = useState(false)

  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)

  useEffect(() => {
    void carregarTurmas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function carregarTurmas() {
    setErro(null)
    setLoading(true)
    const { data, error } = await supabase
      .from("turmas")
      .select("id, nome, serie, criado_em")
      .order("criado_em", { ascending: false })
    setLoading(false)
    if (error) return setErro(error.message)
    setTurmas((data || []) as Turma[])
  }

  async function carregarAlunos(turmaId: string) {
    setErro(null)
    const { data, error } = await supabase
      .from("alunos")
      .select("id, nome, matricula, turma_id")
      .eq("turma_id", turmaId)
      .order("nome", { ascending: true })
    if (error) return setErro(error.message)
    setAlunos((data || []) as Aluno[])
  }

  function selecionarTurma(t: Turma) {
    setSelecionada(t)
    setMensagem(null)
    setErro(null)
    setNovoAlunoNome("")
    setNovoAlunoMatricula("")
    void carregarAlunos(t.id)
  }

  async function criarTurma(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setMensagem(null)
    if (!novaTurmaNome.trim()) return setErro("Dê um nome para a turma.")
    if (!user?.id) return setErro("Sessão expirada. Faça login novamente.")

    setSalvando(true)
    const { data, error } = await supabase
      .from("turmas")
      .insert({ nome: novaTurmaNome.trim(), serie: novaTurmaSerie.trim() || null, criado_por: user.id })
      .select("id, nome, serie, criado_em")
      .single()
    setSalvando(false)
    if (error) return setErro(error.message)

    setNovaTurmaNome("")
    setNovaTurmaSerie("")
    setTurmas((prev) => [data as Turma, ...prev])
    showToast("Turma criada.", "success")
  }

  async function excluirTurma(t: Turma) {
    if (!window.confirm(`Excluir a turma "${t.nome}" e todos os seus alunos?`)) return
    setErro(null)
    const { error } = await supabase.from("turmas").delete().eq("id", t.id)
    if (error) return setErro(error.message)
    setTurmas((prev) => prev.filter((x) => x.id !== t.id))
    if (selecionada?.id === t.id) {
      setSelecionada(null)
      setAlunos([])
    }
  }

  async function criarAluno(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setMensagem(null)
    if (!selecionada) return
    if (!novoAlunoNome.trim()) return setErro("Informe o nome do aluno.")

    setSalvando(true)
    const { data, error } = await supabase
      .from("alunos")
      .insert({
        nome: novoAlunoNome.trim(),
        matricula: novoAlunoMatricula.trim() || null,
        turma_id: selecionada.id,
      })
      .select("id, nome, matricula, turma_id")
      .single()
    setSalvando(false)
    if (error) return setErro(error.message)

    setNovoAlunoNome("")
    setNovoAlunoMatricula("")
    setAlunos((prev) => [...prev, data as Aluno].sort((a, b) => a.nome.localeCompare(b.nome)))
    showToast("Aluno adicionado.", "success")
  }

  async function importarAlunos(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!selecionada) return
    const novos = importText
      .split(/\r?\n/)
      .map((linha) => linha.trim())
      .filter(Boolean)
      .map((linha) => {
        const partes = linha.split(/[\t,;]/).map((p) => p.trim())
        return { nome: partes[0], matricula: partes[1] || null, turma_id: selecionada.id }
      })
      .filter((a) => a.nome)

    if (!novos.length) return setErro("Cole ao menos um nome (um por linha).")

    setImportando(true)
    const { data, error } = await supabase
      .from("alunos")
      .insert(novos)
      .select("id, nome, matricula, turma_id")
    setImportando(false)
    if (error) {
      return setErro(
        error.message.includes("duplicate")
          ? "Há matrículas repetidas nesta turma. Remova as duplicadas e tente de novo."
          : error.message
      )
    }

    const inseridos = (data || []) as Aluno[]
    setAlunos((prev) => [...prev, ...inseridos].sort((a, b) => a.nome.localeCompare(b.nome)))
    setImportText("")
    setImportOpen(false)
    showToast(`${inseridos.length} aluno(s) importado(s).`, "success")
  }

  async function excluirAluno(id: string) {
    setErro(null)
    const { error } = await supabase.from("alunos").delete().eq("id", id)
    if (error) return setErro(error.message)
    setAlunos((prev) => prev.filter((a) => a.id !== id))
  }

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
            <h1 className="text-2xl font-semibold text-gray-900">Turmas e alunos</h1>
            <p className="text-sm text-gray-600">
              Cadastre suas turmas e os alunos de cada uma. Você vai usá-las para aplicar e corrigir avaliações.
            </p>
          </div>
        </div>

        {erro && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{erro}</p>}
        {mensagem && <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{mensagem}</p>}

        <div className="grid gap-4 lg:grid-cols-3">
          {/* COLUNA TURMAS */}
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-2xl bg-white p-5 shadow space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Nova turma</h2>
              <form onSubmit={criarTurma} className="space-y-3">
                <input
                  value={novaTurmaNome}
                  onChange={(e) => setNovaTurmaNome(e.target.value)}
                  placeholder="Nome (ex.: 8º ano A)"
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  value={novaTurmaSerie}
                  onChange={(e) => setNovaTurmaSerie(e.target.value)}
                  placeholder="Série/ano (opcional)"
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : "Adicionar turma"}
                </button>
              </form>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Minhas turmas</h2>
                <span className="text-sm text-gray-500">{turmas.length}</span>
              </div>
              {loading ? (
                <p className="text-sm text-gray-500">Carregando…</p>
              ) : turmas.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma turma ainda. Crie a primeira acima.</p>
              ) : (
                <ul className="space-y-2">
                  {turmas.map((t) => (
                    <li
                      key={t.id}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                        selecionada?.id === t.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selecionarTurma(t)}
                        className="flex-1 text-left"
                      >
                        <div className="text-sm font-medium text-gray-900">{t.nome}</div>
                        {t.serie && <div className="text-xs text-gray-500">{t.serie}</div>}
                      </button>
                      <button
                        type="button"
                        onClick={() => excluirTurma(t)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Excluir
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* COLUNA ALUNOS */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-5 shadow space-y-4">
              {!selecionada ? (
                <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-gray-500">
                  Selecione uma turma à esquerda para ver e cadastrar os alunos.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Alunos · {selecionada.nome}</h2>
                      <p className="text-sm text-gray-500">{alunos.length} aluno(s)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImportOpen((v) => !v)}
                      className="rounded-xl border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {importOpen ? "Fechar" : "Importar lista"}
                    </button>
                  </div>

                  {importOpen && (
                    <form onSubmit={importarAlunos} className="space-y-2 rounded-xl border bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Cole um aluno por linha. Opcional: <code>Nome, matrícula</code> (separe por vírgula, ponto-e-vírgula ou tab).
                      </p>
                      <textarea
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        rows={5}
                        placeholder={"Ana Souza, 1001\nBruno Lima, 1002\nCarla Dias"}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="submit"
                        disabled={importando}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {importando ? "Importando..." : "Importar alunos"}
                      </button>
                    </form>
                  )}

                  <form onSubmit={criarAluno} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <input
                      value={novoAlunoNome}
                      onChange={(e) => setNovoAlunoNome(e.target.value)}
                      placeholder="Nome do aluno"
                      className="rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      value={novoAlunoMatricula}
                      onChange={(e) => setNovoAlunoMatricula(e.target.value)}
                      placeholder="Matrícula (opcional)"
                      className="rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      disabled={salvando}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {salvando ? "..." : "Adicionar"}
                    </button>
                  </form>

                  {alunos.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum aluno nesta turma ainda.</p>
                  ) : (
                    <ul className="divide-y rounded-xl border">
                      {alunos.map((a, idx) => (
                        <li key={a.id} className="flex items-center justify-between px-4 py-2">
                          <div className="flex items-center gap-3">
                            <span className="w-6 text-right text-xs text-gray-400">{idx + 1}.</span>
                            <span className="text-sm font-medium text-gray-900">{a.nome}</span>
                            {a.matricula && (
                              <span className="text-xs text-gray-500">· mat. {a.matricula}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => excluirAluno(a.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
