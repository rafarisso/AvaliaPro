import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Header from "../../components/Header"
import { getSupabase } from "../../services/supabaseClient"

type Questao = { id: string; ordem: number; enunciado: string; valor: number }
type Aluno = { id: string; nome: string }
type Submissao = { id: string; aluno_id: string | null; nota_final: number | null; status: string }
type Resposta = { submissao_id: string; questao_id: string; correta: boolean | null; pontos_obtidos: number | null }

export default function DesempenhoPage() {
  const { aplicacaoId = "" } = useParams()
  const supabase = getSupabase()
  const navigate = useNavigate()

  const [titulo, setTitulo] = useState("")
  const [turmaNome, setTurmaNome] = useState("")
  const [valorTotal, setValorTotal] = useState<number | null>(null)
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [subByAluno, setSubByAluno] = useState<Record<string, Submissao>>({})
  const [respostas, setRespostas] = useState<Resposta[]>([])

  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    void carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aplicacaoId])

  async function carregar() {
    setErro(null)
    setLoading(true)
    const { data: ap, error: apErr } = await supabase
      .from("aplicacoes")
      .select("id, turma_id, avaliacao_id, avaliacao:avaliacoes(titulo, valor_total), turma:turmas(nome)")
      .eq("id", aplicacaoId)
      .single()

    if (apErr || !ap) {
      setLoading(false)
      return setErro("Aplicação não encontrada.")
    }

    const av = (ap as any).avaliacao
    setTitulo(av?.titulo ?? "Avaliação")
    setValorTotal(typeof av?.valor_total === "number" ? av.valor_total : null)
    setTurmaNome((ap as any).turma?.nome ?? "")

    const [qs, als, subs] = await Promise.all([
      supabase.from("questoes").select("id, ordem, enunciado, valor").eq("avaliacao_id", (ap as any).avaliacao_id).order("ordem", { ascending: true }),
      supabase.from("alunos").select("id, nome").eq("turma_id", (ap as any).turma_id).order("nome", { ascending: true }),
      supabase.from("submissoes").select("id, aluno_id, nota_final, status, criado_em").eq("aplicacao_id", aplicacaoId).order("criado_em", { ascending: false }),
    ])

    if (qs.error) { setLoading(false); return setErro(qs.error.message) }
    if (als.error) { setLoading(false); return setErro(als.error.message) }
    if (subs.error) { setLoading(false); return setErro(subs.error.message) }

    setQuestoes((qs.data || []) as Questao[])
    setAlunos((als.data || []) as Aluno[])

    // submissão mais recente por aluno
    const map: Record<string, Submissao> = {}
    for (const s of (subs.data || []) as any[]) {
      if (s.aluno_id && !map[s.aluno_id]) map[s.aluno_id] = s
    }
    setSubByAluno(map)

    // respostas das submissões corrigidas
    const corrigidasIds = Object.values(map).filter((s) => s.status === "corrigida").map((s) => s.id)
    if (corrigidasIds.length) {
      const { data, error } = await supabase
        .from("respostas_aluno")
        .select("submissao_id, questao_id, correta, pontos_obtidos")
        .in("submissao_id", corrigidasIds)
      if (error) { setLoading(false); return setErro(error.message) }
      setRespostas((data || []) as Resposta[])
    } else {
      setRespostas([])
    }

    setLoading(false)
  }

  // ── Estatísticas ──────────────────────────────────────────
  const notas = useMemo(
    () =>
      Object.values(subByAluno)
        .filter((s) => s.status === "corrigida" && s.nota_final != null)
        .map((s) => Number(s.nota_final)),
    [subByAluno]
  )

  const corrigidas = notas.length
  const media = corrigidas ? notas.reduce((a, b) => a + b, 0) / corrigidas : null
  const maior = corrigidas ? Math.max(...notas) : null
  const menor = corrigidas ? Math.min(...notas) : null

  const statsPorQuestao = useMemo(
    () =>
      questoes.map((q) => {
        const rs = respostas.filter((r) => r.questao_id === q.id)
        const total = rs.length
        const acertos = rs.filter((r) => r.correta).length
        const taxa = total ? acertos / total : 0
        return { ...q, total, acertos, taxa }
      }),
    [questoes, respostas]
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/aplicacoes")}
            className="rounded-xl border px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Voltar
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Desempenho da turma</h1>
            <p className="text-sm text-gray-600">
              {titulo}
              {turmaNome ? ` · Turma ${turmaNome}` : ""}
            </p>
          </div>
        </div>

        {erro && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{erro}</p>}

        {loading ? (
          <p className="text-sm text-gray-500">Carregando…</p>
        ) : corrigidas === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-6 text-sm text-gray-600">
            Nenhuma prova corrigida nesta aplicação ainda.{" "}
            <button
              onClick={() => navigate(`/correcao/${aplicacaoId}`)}
              className="font-medium text-blue-600 hover:underline"
            >
              Corrigir provas
            </button>{" "}
            para ver o desempenho.
          </div>
        ) : (
          <>
            {/* Cartões de resumo */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card titulo="Corrigidas" valor={`${corrigidas}/${alunos.length}`} />
              <Card titulo="Média da turma" valor={fmt(media)} sufixo={valorTotal != null ? `/ ${valorTotal}` : undefined} destaque />
              <Card titulo="Maior nota" valor={fmt(maior)} />
              <Card titulo="Menor nota" valor={fmt(menor)} />
            </div>

            {/* Desempenho por questão */}
            <section className="rounded-2xl bg-white p-5 shadow">
              <h2 className="mb-1 text-lg font-semibold text-gray-900">Acerto por questão</h2>
              <p className="mb-4 text-sm text-gray-500">% de alunos que acertaram cada questão — destaque o que precisa revisar.</p>
              <ul className="space-y-3">
                {statsPorQuestao.map((q) => {
                  const pct = Math.round(q.taxa * 100)
                  return (
                    <li key={q.id}>
                      <div className="mb-1 flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm text-gray-700">
                          <strong>{q.ordem}.</strong> {q.enunciado}
                        </span>
                        <span className="shrink-0 text-sm font-medium text-gray-600">
                          {pct}% <span className="text-gray-400">({q.acertos}/{q.total})</span>
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${barColor(q.taxa)}`} style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>

            {/* Desempenho por aluno */}
            <section className="rounded-2xl bg-white p-5 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Nota por aluno</h2>
              <ul className="divide-y">
                {alunos.map((a) => {
                  const sub = subByAluno[a.id]
                  return (
                    <li key={a.id} className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-800">{a.nome}</span>
                      {!sub ? (
                        <span className="text-xs text-gray-400">sem submissão</span>
                      ) : sub.status !== "corrigida" ? (
                        <StatusBadge status={sub.status} />
                      ) : (
                        <span className="text-base font-semibold text-gray-900">
                          {fmt(sub.nota_final)}
                          {valorTotal != null ? <span className="text-sm text-gray-400"> / {valorTotal}</span> : null}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function Card({ titulo, valor, sufixo, destaque }: { titulo: string; valor: string; sufixo?: string; destaque?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 shadow ${destaque ? "bg-blue-600 text-white" : "bg-white"}`}>
      <div className={`text-xs ${destaque ? "text-blue-100" : "text-gray-500"}`}>{titulo}</div>
      <div className="mt-1 text-2xl font-semibold">
        {valor}
        {sufixo ? <span className={`text-sm font-normal ${destaque ? "text-blue-100" : "text-gray-400"}`}> {sufixo}</span> : null}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { txt: string; cls: string }> = {
    pendente: { txt: "Pendente", cls: "bg-gray-100 text-gray-600" },
    processando: { txt: "Processando", cls: "bg-amber-100 text-amber-700" },
    erro: { txt: "Erro", cls: "bg-red-100 text-red-700" },
  }
  const s = map[status] || map.pendente
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.txt}</span>
}

function barColor(taxa: number): string {
  if (taxa >= 0.7) return "bg-green-500"
  if (taxa >= 0.4) return "bg-amber-500"
  return "bg-red-500"
}

function fmt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "—"
  return String(Math.round(Number(n) * 10) / 10)
}
