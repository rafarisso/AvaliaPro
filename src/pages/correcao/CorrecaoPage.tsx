import { useEffect, useState, type ChangeEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Header from "../../components/Header"
import { useAuth } from "../../../hooks/useAuth"
import { useToast } from "../../../hooks/useToast"
import { getSupabase } from "../../services/supabaseClient"
import { corrigirSubmissao } from "../../services/correcao"

type Aluno = { id: string; nome: string; matricula: string | null }
type SubmissaoView = {
  id: string
  status: string
  nota_final: number | null
  revisado: boolean
  imagens_urls: string[]
}
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
const CONFIANCA_BAIXA = 0.6

export default function CorrecaoPage() {
  const { aplicacaoId = "" } = useParams()
  const supabase = getSupabase()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [titulo, setTitulo] = useState("")
  const [valorTotal, setValorTotal] = useState<number | null>(null)
  const [turmaNome, setTurmaNome] = useState("")
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [subByAluno, setSubByAluno] = useState<Record<string, SubmissaoView>>({})
  const [detalhes, setDetalhes] = useState<Record<string, RespostaDetalhe[]>>({})
  const [fotos, setFotos] = useState<Record<string, string[]>>({})
  const [expandido, setExpandido] = useState<string | null>(null)
  const [salvandoRev, setSalvandoRev] = useState<Record<string, boolean>>({})

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
        .select("id, aluno_id, status, nota_final, revisado, imagens_urls, criado_em")
        .eq("aplicacao_id", aplicacaoId)
        .order("criado_em", { ascending: false }),
    ])

    setLoading(false)
    if (al.error) return setErro(al.error.message)
    if (subs.error) return setErro(subs.error.message)

    setAlunos((al.data || []) as Aluno[])

    const map: Record<string, SubmissaoView> = {}
    for (const s of (subs.data || []) as any[]) {
      if (s.aluno_id && !map[s.aluno_id]) {
        map[s.aluno_id] = {
          id: s.id,
          status: s.status,
          nota_final: s.nota_final,
          revisado: Boolean(s.revisado),
          imagens_urls: Array.isArray(s.imagens_urls) ? s.imagens_urls : [],
        }
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

      setBusy((p) => ({ ...p, [aluno.id]: "Registrando submissão..." }))
      const { data: sub, error: subErr } = await supabase
        .from("submissoes")
        .insert({ aplicacao_id: aplicacaoId, aluno_id: aluno.id, imagens_urls: paths, status: "pendente" })
        .select("id")
        .single()
      if (subErr) throw subErr

      setBusy((p) => ({ ...p, [aluno.id]: "Corrigindo com IA..." }))
      const result = await corrigirSubmissao((sub as any).id)

      setSubByAluno((prev) => ({
        ...prev,
        [aluno.id]: {
          id: (sub as any).id,
          status: "corrigida",
          nota_final: result.nota_final,
          revisado: false,
          imagens_urls: paths,
        },
      }))
      setFilesByAluno((prev) => ({ ...prev, [aluno.id]: [] }))
      showToast(`Prova de ${aluno.nome} corrigida (nota ${fmt(result.nota_final)}).`, "success")
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
    if (!detalhes[sub.id]) {
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
    if (!fotos[sub.id]) void carregarFotos(sub)
  }

  async function carregarFotos(sub: SubmissaoView) {
    const urls: string[] = []
    for (const ref of sub.imagens_urls) {
      const path = ref.replace(new RegExp(`^${BUCKET}/`), "")
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
      if (data?.signedUrl) urls.push(data.signedUrl)
    }
    setFotos((prev) => ({ ...prev, [sub.id]: urls }))
  }

  function updateResposta(subId: string, idx: number, patch: Partial<RespostaDetalhe>) {
    setDetalhes((prev) => {
      const lista = [...(prev[subId] || [])]
      lista[idx] = { ...lista[idx], ...patch }
      return { ...prev, [subId]: lista }
    })
  }

  async function salvarRevisao(aluno: Aluno, sub: SubmissaoView) {
    const lista = detalhes[sub.id] || []
    if (!lista.length) return
    setErro(null)
    setSalvandoRev((p) => ({ ...p, [sub.id]: true }))
    try {
      for (const r of lista) {
        const maxValor = Number(r.questao?.valor) || 0
        const pontos = Math.max(0, Math.min(Number(r.pontos_obtidos) || 0, maxValor))
        const { error } = await supabase
          .from("respostas_aluno")
          .update({
            resposta_extraida: r.resposta_extraida ?? "",
            correta: Boolean(r.correta),
            pontos_obtidos: pontos,
          })
          .eq("id", r.id)
        if (error) throw error
      }

      const nota = round2(
        lista.reduce((acc, r) => {
          const maxValor = Number(r.questao?.valor) || 0
          return acc + Math.max(0, Math.min(Number(r.pontos_obtidos) || 0, maxValor))
        }, 0)
      )

      const { error: subErr } = await supabase
        .from("submissoes")
        .update({ nota_final: nota, revisado: true })
        .eq("id", sub.id)
      if (subErr) throw subErr

      setSubByAluno((prev) => ({
        ...prev,
        [aluno.id]: { ...prev[aluno.id], nota_final: nota, revisado: true },
      }))
      showToast("Revisão salva.", "success")
    } catch (e: any) {
      console.error("[revisao]", e)
      setErro(e?.message ?? "Não foi possível salvar a revisão.")
    } finally {
      setSalvandoRev((p) => {
        const cp = { ...p }
        delete cp[sub.id]
        return cp
      })
    }
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
                {valorTotal != null && <span className="text-sm text-gray-500">Valor da prova: {valorTotal}</span>}
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
                          {sub.revisado ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              ✓ Revisada
                            </span>
                          ) : (
                            <StatusBadge status={sub.status} />
                          )}
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
                            {expandido === sub.id ? "Ocultar" : "Revisar"}
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
                              capture="environment"
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

                    {/* Revisão da correção */}
                    {sub && expandido === sub.id && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        {/* Fotos da prova */}
                        {fotos[sub.id]?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {fotos[sub.id].map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer" className="block">
                                <img
                                  src={url}
                                  alt={`Prova ${i + 1}`}
                                  className="h-28 w-auto rounded-lg border object-cover hover:opacity-90"
                                />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">Carregando imagens…</p>
                        )}

                        {!detalhes[sub.id] ? (
                          <p className="text-sm text-gray-500">Carregando correção…</p>
                        ) : detalhes[sub.id].length === 0 ? (
                          <p className="text-sm text-gray-500">Sem correção registrada para esta submissão.</p>
                        ) : (
                          <>
                            <p className="text-xs text-gray-500">
                              Revise a leitura da IA, ajuste os pontos se necessário e salve. Itens com leitura
                              incerta estão marcados.
                            </p>
                            <ul className="space-y-2">
                              {detalhes[sub.id].map((r, idx) => {
                                const baixa = (r.confianca ?? 1) < CONFIANCA_BAIXA
                                const maxValor = Number(r.questao?.valor) || 0
                                return (
                                  <li key={r.id} className="rounded-xl border p-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="text-sm font-medium text-gray-800">
                                        {r.questao?.ordem}. {r.questao?.enunciado}
                                      </div>
                                      {baixa && (
                                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                          IA incerta
                                        </span>
                                      )}
                                    </div>

                                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                      <label className="text-xs text-gray-500">
                                        Resposta do aluno
                                        <input
                                          value={r.resposta_extraida ?? ""}
                                          onChange={(e) =>
                                            updateResposta(sub.id, idx, { resposta_extraida: e.target.value })
                                          }
                                          className="mt-1 w-full rounded-lg border px-2 py-1 text-sm text-gray-800"
                                        />
                                      </label>
                                      <div className="text-xs text-gray-500">
                                        Gabarito
                                        <div className="mt-1 rounded-lg bg-gray-50 px-2 py-1 text-sm text-gray-700">
                                          {r.questao?.resposta_correta || "—"}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-2 flex flex-wrap items-center gap-4">
                                      <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <span>Pontos</span>
                                        <input
                                          type="number"
                                          min={0}
                                          max={maxValor}
                                          step={0.5}
                                          value={r.pontos_obtidos ?? 0}
                                          onChange={(e) =>
                                            updateResposta(sub.id, idx, {
                                              pontos_obtidos: Number(e.target.value || 0),
                                            })
                                          }
                                          className="w-20 rounded-lg border px-2 py-1 text-sm"
                                        />
                                        <span className="text-gray-400">/ {maxValor}</span>
                                      </label>
                                      <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(r.correta)}
                                          onChange={(e) => updateResposta(sub.id, idx, { correta: e.target.checked })}
                                        />
                                        Correta
                                      </label>
                                    </div>

                                    {r.feedback_ia && (
                                      <div className="mt-1 text-xs italic text-gray-500">{r.feedback_ia}</div>
                                    )}
                                  </li>
                                )
                              })}
                            </ul>

                            <div className="flex items-center justify-end gap-3">
                              <span className="text-sm text-gray-600">
                                Nota:{" "}
                                <strong>
                                  {fmt(
                                    (detalhes[sub.id] || []).reduce((acc, r) => {
                                      const mv = Number(r.questao?.valor) || 0
                                      return acc + Math.max(0, Math.min(Number(r.pontos_obtidos) || 0, mv))
                                    }, 0)
                                  )}
                                </strong>
                                {valorTotal != null ? ` / ${valorTotal}` : ""}
                              </span>
                              <button
                                type="button"
                                disabled={Boolean(salvandoRev[sub.id])}
                                onClick={() => salvarRevisao(aluno, sub)}
                                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                              >
                                {salvandoRev[sub.id] ? "Salvando..." : "Salvar revisão"}
                              </button>
                            </div>
                          </>
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

function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100
}

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "foto.jpg"
  )
}
