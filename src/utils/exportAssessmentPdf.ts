import jsPDF from "jspdf"

export type AssessmentForPdf = {
  titulo: string
  disciplina: string
  nivel: string
  serie: string
  tipo: string
  enunciadoGeral?: string
  questoes: {
    tipo: "objetiva" | "discursiva"
    enunciado: string
    alternativas?: string[]
    valor: number
    resposta_correta?: string
  }[]
}

export type AssessmentKeyForPdf = {
  titulo: string
  disciplina: string
  nivel: string
  serie: string
  tipo: string
  questoes: {
    tipo: "objetiva" | "discursiva"
    enunciado: string
    alternativas?: string[]
    resposta_correta?: string
    valor: number
  }[]
}

const MARGIN = 48
type Style = "normal" | "bold" | "italic"

/**
 * "Escritor" sobre o jsPDF que SEMPRE quebra linha dentro da margem e
 * pagina automaticamente — evita o texto sair cortado na borda direita.
 */
function createWriter() {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const right = pageW - MARGIN
  const bottom = pageH - MARGIN
  const state = { y: MARGIN + 6 }

  const ensure = (h: number) => {
    if (state.y + h > bottom) {
      doc.addPage()
      state.y = MARGIN + 6
    }
  }

  const write = (
    str: string,
    opts: { x?: number; size?: number; style?: Style; lineH?: number; gapAfter?: number; color?: number } = {}
  ) => {
    const x = opts.x ?? MARGIN
    const size = opts.size ?? 11
    const lineH = opts.lineH ?? size * 1.4
    doc.setFont("helvetica", opts.style ?? "normal")
    doc.setFontSize(size)
    doc.setTextColor(opts.color ?? 25)
    const lines = doc.splitTextToSize(str, right - x) as string[]
    for (const line of lines) {
      ensure(lineH)
      doc.text(line, x, state.y)
      state.y += lineH
    }
    if (opts.gapAfter) state.y += opts.gapAfter
  }

  // Cabeçalho em duas colunas (campos curtos)
  const meta = (leftLines: string[], rightLines: string[]) => {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    doc.setTextColor(60)
    const startY = state.y
    const colRightX = MARGIN + (right - MARGIN) / 2 + 8
    const lineH = 16
    leftLines.forEach((l, i) => doc.text(l, MARGIN, startY + i * lineH))
    rightLines.forEach((l, i) => doc.text(l, colRightX, startY + i * lineH))
    const rows = Math.max(leftLines.length, rightLines.length)
    state.y = startY + rows * lineH + 4
  }

  const hr = (gapAfter = 14) => {
    ensure(gapAfter + 2)
    doc.setDrawColor(200)
    doc.line(MARGIN, state.y, right, state.y)
    state.y += gapAfter
  }

  // Linhas em branco para a resposta dissertativa
  const answerLines = (n: number, x: number) => {
    for (let i = 0; i < n; i++) {
      ensure(22)
      doc.setDrawColor(215)
      doc.line(x, state.y, right, state.y)
      state.y += 22
    }
  }

  const gap = (h: number) => {
    state.y += h
  }

  const footer = () => {
    const total = doc.getNumberOfPages()
    for (let p = 1; p <= total; p++) {
      doc.setPage(p)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(150)
      doc.text(`Página ${p} de ${total}`, pageW / 2, pageH - 24, { align: "center" })
    }
  }

  return { doc, write, meta, hr, answerLines, gap, footer }
}

export function exportAssessmentToPdf(data: AssessmentForPdf) {
  if (!data.questoes.length) {
    throw new Error("Sem questões para exportar.")
  }

  const w = createWriter()

  w.write(data.titulo || "Avaliação", { size: 18, style: "bold", gapAfter: 12 })
  w.meta(
    [`Disciplina: ${data.disciplina}`, `Série/Ano: ${data.serie}`],
    [`Nível: ${data.nivel}`, `Tipo: ${data.tipo}`]
  )
  w.gap(6)
  w.write(`Nome do aluno: ${"_".repeat(42)}`, { size: 11, color: 60 })
  w.write(`Turma: ${"_".repeat(18)}      Data: ____ / ____ / ________`, { size: 11, color: 60, gapAfter: 6 })
  w.hr()

  if (data.enunciadoGeral) {
    w.write(data.enunciadoGeral, { size: 11, style: "italic", color: 70, gapAfter: 10 })
  }

  w.write("Questões", { size: 14, style: "bold", gapAfter: 10 })

  data.questoes.forEach((q, idx) => {
    w.gap(2)
    const pts = `(${q.valor} ponto${q.valor !== 1 ? "s" : ""})`
    w.write(`${idx + 1}. ${q.enunciado}  ${pts}`, { size: 12, style: "bold", gapAfter: 4 })

    if (q.tipo === "objetiva") {
      const alternativas = q.alternativas?.length ? q.alternativas : ["", "", "", ""]
      alternativas.forEach((alt, altIdx) => {
        const letra = String.fromCharCode(65 + altIdx)
        w.write(`${letra}) ${cleanAlternative(alt)}`, { x: MARGIN + 18, size: 11 })
      })
      w.gap(12)
    } else {
      w.gap(4)
      w.answerLines(6, MARGIN + 10)
      w.gap(8)
    }
  })

  w.footer()
  w.doc.save(`${data.titulo || "avaliacao"}.pdf`)
}

export function exportAnswerKeyToPdf(data: AssessmentKeyForPdf) {
  if (!data.questoes.length) {
    throw new Error("Sem questões para exportar.")
  }

  const w = createWriter()

  w.write(`${data.titulo || "Avaliação"} — Gabarito`, { size: 18, style: "bold", gapAfter: 12 })
  w.meta(
    [`Disciplina: ${data.disciplina}`, `Série/Ano: ${data.serie}`],
    [`Nível: ${data.nivel}`, `Tipo: ${data.tipo}`]
  )
  w.gap(6)
  w.hr()

  w.write("Gabarito", { size: 14, style: "bold", gapAfter: 10 })

  data.questoes.forEach((q, idx) => {
    w.gap(2)
    w.write(`${idx + 1}. ${q.enunciado}`, { size: 12, style: "bold", gapAfter: 4 })

    if (q.tipo === "objetiva") {
      const alternativas = q.alternativas ?? []
      const letra = (q.resposta_correta || "").trim()
      const idxCorreto = letra ? letra.charCodeAt(0) - 65 : -1
      const textoRaw = idxCorreto >= 0 && alternativas[idxCorreto] ? alternativas[idxCorreto] : ""
      const texto = cleanAlternative(textoRaw)
      const label = letra
        ? `Alternativa correta: ${letra}${texto ? ` — ${texto}` : ""}`
        : "Alternativa correta: —"
      w.write(label, { x: MARGIN + 10, size: 11, color: 30 })
    } else {
      const resp = q.resposta_correta?.trim() || "Resposta não informada."
      w.write(`Resposta esperada: ${resp}`, { x: MARGIN + 10, size: 11, color: 30 })
    }

    w.write(`Valor: ${q.valor} ponto${q.valor !== 1 ? "s" : ""}`, {
      x: MARGIN + 10,
      size: 9,
      color: 120,
      gapAfter: 12,
    })
  })

  w.footer()
  w.doc.save(`${data.titulo || "avaliacao"}-gabarito.pdf`)
}

function cleanAlternative(value: string): string {
  if (!value) return ""
  return value.replace(/^[A-Da-d]\s*[\)\.\-:]?\s*/, "").trim()
}
