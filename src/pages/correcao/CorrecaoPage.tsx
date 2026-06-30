import { useEffect, useState, type ChangeEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Header from "../../components/Header"
import { useAuth } from "../../../hooks/useAuth"
import { getSupabase } from "../../services/supabaseClient"
import { corrigirSubmissao } from "../../services/correcao"

type Aluno = { id: string; nome: string; matricula: string | null }
type SubmissaoView = { id: string; status: string; nota_final: number | null }
type RespostaDetalhe = {
  id: string
  resposta_extraida: string | null
  correta: boolean | null
  pontos_obtidos: number | null
  confianca: number | null
  feedback_ia: string | null
  questao: { ordem: number; enunciado: string; tipo: string; valor: number; resposta_correta: string | null } | null
}

const BUCKET = "provas-escaneadas"
const MAX_FILES = 8
const MAX_BYTES = 5 * 1024 * 1024

export default function CorrecaoPage() {
  const { aplicacaoId = "" } = useParams()
  const supabase = getSupabase()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [titulo, setTitulo] = useState("")
  const [valorTotal, setValorTotal] = useState<number | null>(null)
  const [turmaNome, setTurmaNome] = useState("")
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [subByAluno, setSubByAluno] = useState<Record<string, SubmissaoView>>({})
  const [detalhes, setDetalhes] = useState<Record<string, RespostaDetalhe[]>>({})
  const [expandido, setExpandido] = useState<string | null>(null)

  const [filesByAluno, setFilesByAluno] = useState<Record<string, File[]>>({})
  const [busy, setBusy] = useState<Record<string, string>>({})

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
      .select("id, turma_id, avaliacao:avaliacoes(titulo, valor_total), turma:turmas(nome)")
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

    const [al, subs] = await Promise.all([
      supabase
        .from("alunos")
        .select("id, nome, matricula")
        .eq("turma_id", (ap as any).turma_id)
        .order("nome", { ascending: true }),
      supabase
        .from("submissoes")
        .select("id, aluno_id, status, nota_final, criado_em")
        .eq("aplicacao_id", aplicacaoId)
        .order("criado_em", { ascending: false }),
    ])

    setLoading(false)
    if (al.error) return setErro(al.error.message)
    if (subs.error) return setErro(subs.error.message)

    setAlunos((al.data || []) as Aluno[])

    // mantém a submissão mais recente por aluno
    const map: Record<string, SubmissaoView> = {}
    for (const s of (subs.data || []) as any[]) {
      if (s.aluno_id && !map[s.aluno_id]) {
        map[s.aluno_id] = { id: s.id, status: s.status, nota_final: s.nota_final }
      }
    }
    setSubByAluno(map)
  }

  function onPickFiles(alunoId: string, e: ChangeEvent<HTMLInputElement>) {
    setErro(null)
    const picked = e.target.files ? Array.from(e.target.files) : []
    const imgs = picked.filter((f) => f.type.startsWith("image/") && f.size <= MAX_BYTES).slice(0, MAX_FILES)
    if (imgs.length < picked.length) {
      setErro("Apenas imagens até 5MB são aceitas (máx. 8 por aluno).")
    }
    setFilesByAluno((prev) => ({ ...prev, [alunoId]: imgs }))
  }

  async function enviarECorrigir(aluno: Aluno) {
    const files = filesByAluno[aluno.id] || []
    setErro(null)
    if (!files.length) return setErro(`Selecione a(s) foto(s) da prova de ${aluno.nome}.`)
    if (!user?.id) return setErro("Sessão expirada. Faça login novamente.")

    try {
      // 1. upload das imagens para o Storage (pasta do professor)
      setBusy((p) => ({ ...p, [aluno.id]: "Enviando imagens..." }))
      const paths: string[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const path = `${user.id}/${aplicacaoId}/${aluno.id}/${Date.now()}-${i}-${slug(file.name)}`
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          upsert: true,
          contentType: file.type || "image/jpeg",
        })
        if (upErr) throw upErr
        paths.push(path)
      }

      // 2. cria a submissão
      setBusy((p) => ({ ...p, [aluno.id]: "Registrando submissão..." }))
      const { data: sub, error: subErr } = await supabase
        .from("submissoes")
        .insert({ aplicacao_id: aplicacaoId, aluno_id: aluno.id, imagens_urls: paths, status: "pendente" })
        .select("id")
        .single()
      if (subErr) throw subErr

      // 3. chama a correção (Gemini Vision)
      setBusy((p) => ({ ...p, [aluno.id]: "Corrigindo com IA..." }))
      const result = await corrigirSubmissao((sub as any).id)

      setSubByAluno((prev) => ({
        ...prev,
        [aluno.id]: { id: (sub as any).id, status: "corrigida", nota_final: result.nota_final },
      }))
      setFilesByAluno((prev) => ({ ...prev, [aluno.id]: [] }))
    } catch (e: any) {
      console.error("[correcao]", e)
      setErro(e?.message ?? "Falha ao corrigir a prova.")
    } finally {
      setBusy((p) => {
        const cp = { ...p }
        delete cp[aluno.id]
        return cp
      })
    }
  }

  async function verDetalhes(sub: SubmissaoView) {
    if (expandido === sub.id) {
      setExpandido(null)
      return
    }
    setExpandido(sub.id)
    if (detalhes[sub.id]) return
    const { data, error } = await supabase
      .from("respostas_aluno")
      .select(
        "id, resposta_extraida, correta, pontos_obtidos, confianca, feedback_ia, questao:questoes(ordem, enunciado, tipo, valor, resposta_correta)"
      )
      .eq("submissao_id", sub.id)
    if (error) return setErro(error.message)
    const lista = ((data || []) as unknown as RespostaDetalhe[]).sort(
      (a, b) => (a.questao?.ordem ?? 0) - (b.questao?.ordem ?? 0)
    )
    setDetalhes((prev) => ({ ...prev, [sub.id]: lista }))
  }

  function refazer(alunoId: string) {
    setSubByAluno((prev) => {
      const cp = { ...prev }
      delete cp[alunoId]
      return cp
    })
  }

  const corrigidas = Object.values(subByAluno).filter((s) => s.status === "corrigida").length

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
            <h1 className="text-2xl font-semibold text-gray-900">Corrigir provas</h1>
            <p className="text-sm text-gray-600">
              {titulo}
              {turmaNome ? ` · Turma ${turmaNome}` : ""}
            </p>
          </div>
        </div>

        {erro && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 whitespace-pre-wrap">{erro}</p>}

        {loading ? (
          <p className="text-sm text-gray-500">Carregando…</p>
        ) : alunos.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-5 text-sm text-gray-600">
            Esta turma não tem alunos.{" "}
            <button onClick={() => navigate("/turmas")} className="font-medium text-blue-600 hover:underline">
              Cadastre os alunos
            </button>{" "}
            para poder corrigir.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-4 shadow">
              <span className="text-sm text-gray-600">
                {corrigidas} de {alunos.length} aluno(s) corrigido(s)
              </span>
              <div className="flex items-center gap-3">
                {valorTotal != null && (
                  <span className="text-sm text-gray-500">Valor da prova: {valorTotal}</span>
                )}
                {corrigidas > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate(`/desempenho/${aplicacaoId}`)}
                    className="rounded-xl border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Ver desempenho →
                  </button>
                )}
              </div>
            </div>

            <ul className="space-y-3">
              {alunos.map((aluno) => {
                const sub = subByAluno[aluno.id]
                const estaOcupado = busy[aluno.id]
                const files = filesByAluno[aluno.id] || []
                return (
                  <li key={aluno.id} className="rounded-2xl bg-white p-5 shadow">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-gray-900">{aluno.nome}</div>
                        {aluno.matricula && <div className="text-xs text-gray-500">mat. {aluno.matricula}</div>}
                      </div>

                      {sub ? (
                        <div className="flex items-center gap-3">
                          <StatusBadge status={sub.status} />
                          {sub.status === "corrigida" && (
                            <span className="text-lg font-semibold text-gray-900">
                              {fmt(sub.nota_final)}
                              {valorTotal != null ? <span className="text-sm text-gray-400"> / {valorTotal}</span> : null}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => verDetalhes(sub)}
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            {expandido === sub.id ? "Ocultar" : "Ver detalhes"}
                          </button>
                          <button
                            type="button"
                            onClick={() => refazer(aluno.id)}
                            className="text-xs text-gray-500 hover:underline"
                          >
                            Refazer
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-medium hover:bg-gray-50">
                            {files.length ? `${files.length} foto(s)` : "Escolher foto(s)"}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => onPickFiles(aluno.id, e)}
                            />
                          </label>
                          <button
                            type="button"
                            disabled={Boolean(estaOcupado)}
                            onClick={() => enviarECorrigir(aluno)}
                            className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                          >
                            {estaOcupado || "Enviar e corrigir"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Detalhes por questão */}
                    {sub && expandido === sub.id && (
                      <div className="mt-4 border-t pt-4">
                        {!detalhes[sub.id] ? (
                          <p className="text-sm text-gray-500">Carregando correção…</p>
                        ) : detalhes[sub.id].length === 0 ? (
                          <p className="text-sm text-gray-500">Sem correção registrada para esta submissão.</p>
                        ) : (
                          <ul className="space-y-2">
                            {detalhes[sub.id].map((r) => (
                              <li key={r.id} className="rounded-xl border p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="text-sm font-medium text-gray-800">
                                    {r.questao?.ordem}. {r.questao?.enunciado}
                                  </div>
                                  <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                      r.correta ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {fmt(r.pontos_obtidos)}
                                    {r.questao ? ` / ${r.questao.valor}` : ""}
                                  </span>
                                </div>
                                <div className="mt-1 grid gap-1 text-xs text-gray-600 sm:grid-cols-2">
                                  <div>
                                    <span className="text-gray-400">Resposta do aluno:</span>{" "}
                                    {r.resposta_extraida || "—"}
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Gabarito:</span>{" "}
                                    {r.questao?.resposta_correta || "—"}
                                  </div>
                                </div>
                                {r.feedback_ia && (
                                  <div className="mt-1 text-xs italic text-gray-500">{r.feedback_ia}</div>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { txt: string; cls: string }> = {
    pendente: { txt: "Pendente", cls: "bg-gray-100 text-gray-600" },
    processando: { txt: "Processando", cls: "bg-amber-100 text-amber-700" },
    corrigida: { txt: "Corrigida", cls: "bg-green-100 text-green-700" },
    erro: { txt: "Erro", cls: "bg-red-100 text-red-700" },
  }
  const s = map[status] || map.pendente
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.txt}</span>
}

function fmt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "—"
  return String(Math.round(Number(n) * 100) / 100)
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "foto.jpg"
}
