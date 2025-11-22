import jsPDF from "jspdf"

export type AssessmentForPdf = {
  titulo: string
  disciplina: string
  nivel: string
  serie: string
  tipo: string
  questoes: {
    tipo: "objetiva" | "discursiva"
    enunciado: string
    alternativas?: string[]
    valor: number
  }[]
}

/**
 * Gera um PDF com cabeçalho da avaliação e lista de questões.
 * Objetivas recebem alternativas; discursivas mostram 5 linhas em branco para resposta.
 */
export function exportAssessmentToPdf(data: AssessmentForPdf) {
  if (!data.questoes.length) {
    throw new Error("Sem questões para exportar.")
  }

  const doc = new jsPDF()
  const marginLeft = 14
  let cursorY = 20

  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text(data.titulo || "Avaliação", marginLeft, cursorY)
  cursorY += 8

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  const hoje = new Date().toLocaleDateString()
  const headerLines = [
    `Disciplina: ${data.disciplina}`,
    `Nível: ${data.nivel}`,
    `Série/Ano: ${data.serie || "Não informado"}`,
    `Tipo: ${data.tipo}`,
    `Data de geração: ${hoje}`,
  ]
  headerLines.forEach((line) => {
    doc.text(line, marginLeft, cursorY)
    cursorY += 6
  })

  cursorY += 4
  doc.setDrawColor(200, 200, 200)
  doc.line(marginLeft, cursorY, 200, cursorY)
  cursorY += 10

  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Questões", marginLeft, cursorY)
  cursorY += 8

  doc.setFont("helvetica", "normal")
  data.questoes.forEach((q, idx) => {
    if (cursorY > 270) {
      doc.addPage()
      cursorY = 20
    }
    const enunciado = `${idx + 1}. ${q.enunciado} (${q.valor} ponto${q.valor !== 1 ? "s" : ""})`
    doc.text(enunciado, marginLeft, cursorY)
    cursorY += 6

    if (q.tipo === "objetiva") {
      const alternativas = q.alternativas && q.alternativas.length ? q.alternativas : ["A)", "B)", "C)", "D)"]
      alternativas.forEach((alt, altIdx) => {
        if (cursorY > 280) {
          doc.addPage()
          cursorY = 20
        }
        const letra = String.fromCharCode(65 + altIdx)
        doc.text(`${letra}) ${alt || ""}`, marginLeft + 4, cursorY)
        cursorY += 6
      })
    } else {
      for (let i = 0; i < 5; i++) {
        if (cursorY > 280) {
          doc.addPage()
          cursorY = 20
        }
        doc.text("______________________________________________", marginLeft + 4, cursorY)
        cursorY += 6
      }
    }

    cursorY += 4
  })

  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text("Gerado pelo AvaliaPro", marginLeft, 290)

  doc.save(`${data.titulo || "avaliacao"}.pdf`)
}
