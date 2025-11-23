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

/**
 * Gera um PDF profissional, sem data e sem marca d’água.
 * Layout limpo, cabeçalho elegante e espaçamento adequado.
 */
export function exportAssessmentToPdf(data: AssessmentForPdf) {
  if (!data.questoes.length) {
    throw new Error("Sem questões para exportar.")
  }

  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  })

  const marginLeft = 40
  let cursorY = 50

  // ------------------------------
  // TÍTULO
  // ------------------------------
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text(data.titulo || "Avaliação", marginLeft, cursorY)
  cursorY += 28

  // ------------------------------
  // CABEÇALHO ORGANIZADO EM BLOCO
  // ------------------------------
  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)

  const headerLeft = [
    `Disciplina: ${data.disciplina}`,
    `Série/Ano: ${data.serie}`,
  ]

  const headerRight = [
    `Nível: ${data.nivel}`,
    `Tipo: ${data.tipo}`,
  ]

  const rightX = 320

  headerLeft.forEach((line, index) => {
    doc.text(line, marginLeft, cursorY + index * 14)
  })

  headerRight.forEach((line, index) => {
    doc.text(line, rightX, cursorY + index * 14)
  })

  cursorY += 40

  // Nome do aluno
  doc.text(`Nome do aluno: ${"_".repeat(50)}`, marginLeft, cursorY)
  cursorY += 18

  // Linha divisóriaória
  doc.setDrawColor(180)
  doc.line(marginLeft, cursorY, 555, cursorY)
  cursorY += 25

  if (data.enunciadoGeral) {
    doc.setFont("helvetica", "italic")
    doc.setFontSize(11)
    const splitIntro = doc.splitTextToSize(data.enunciadoGeral, 520)
    doc.text(splitIntro, marginLeft, cursorY)
    cursorY += splitIntro.length * 16 + 12
    doc.setFont("helvetica", "normal")
    doc.setFontSize(12)
  }

  // ------------------------------
  // TÍTULO DAS QUESTÕES
  // ------------------------------
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("Questões", marginLeft, cursorY)
  cursorY += 24

  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)

  // ------------------------------
  // RENDERIZAÇÃO DAS QUESTÕES
  // ------------------------------
  data.questoes.forEach((q, idx) => {
    if (cursorY > 760) {
      doc.addPage()
      cursorY = 50
    }

    const enunciado = `${idx + 1}. ${q.enunciado}  (${q.valor} ponto${q.valor !== 1 ? "s" : ""})`
    const splitEnunciado = doc.splitTextToSize(enunciado, 520)

    doc.text(splitEnunciado, marginLeft, cursorY)
    cursorY += splitEnunciado.length * 16 + 8

    if (q.tipo === "objetiva") {
      // múltipla escolha
      const alternativas = q.alternativas?.length
        ? q.alternativas
        : ["A)", "B)", "C)", "D)"]

      alternativas.forEach((alt, altIdx) => {
        if (cursorY > 760) {
          doc.addPage()
          cursorY = 50
        }

        const letra = String.fromCharCode(65 + altIdx)
        const cleanedAlt = cleanAlternative(alt)
        doc.text(`${letra}) ${cleanedAlt}`, marginLeft + 20, cursorY)
        cursorY += 16
      })
    } else {
      // discursiva — linhas de resposta
      const linhas = 6
      for (let i = 0; i < linhas; i++) {
        if (cursorY > 760) {
          doc.addPage()
          cursorY = 50
        }
        doc.line(marginLeft + 10, cursorY, 545, cursorY)
        cursorY += 22
      }
    }

    cursorY += 18
  })

  // ------------------------------
  // SALVAR ARQUIVO
  // ------------------------------
  doc.save(`${data.titulo || "avaliacao"}.pdf`)
}

export function exportAnswerKeyToPdf(data: AssessmentKeyForPdf) {
  if (!data.questoes.length) {
    throw new Error("Sem questoes para exportar.")
  }

  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  })

  const marginLeft = 40
  let cursorY = 50

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text(`${data.titulo || "Avaliação"} - Gabarito`, marginLeft, cursorY)
  cursorY += 28

  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)

  const headerLeft = [
    `Disciplina: ${data.disciplina}`,
    `Série/Ano: ${data.serie}`,
  ]

  const headerRight = [
    `Nível: ${data.nivel}`,
    `Tipo: ${data.tipo}`,
  ]

  const rightX = 320

  headerLeft.forEach((line, index) => {
    doc.text(line, marginLeft, cursorY + index * 14)
  })

  headerRight.forEach((line, index) => {
    doc.text(line, rightX, cursorY + index * 14)
  })

  cursorY += 40
  doc.setDrawColor(180)
  doc.line(marginLeft, cursorY, 555, cursorY)
  cursorY += 25

  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("Gabarito", marginLeft, cursorY)
  cursorY += 24

  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)

  data.questoes.forEach((q, idx) => {
    if (cursorY > 760) {
      doc.addPage()
      cursorY = 50
    }

    const enunciado = `${idx + 1}. ${q.enunciado}`
    const splitEnunciado = doc.splitTextToSize(enunciado, 520)
    doc.text(splitEnunciado, marginLeft, cursorY)
    cursorY += splitEnunciado.length * 16 + 8

    if (q.tipo === "objetiva") {
      const alternativas = q.alternativas ?? []
      const letra = (q.resposta_correta || "").trim()
      const idxCorreto = letra ? letra.charCodeAt(0) - 65 : -1
      const textoRaw = idxCorreto >= 0 && alternativas[idxCorreto] ? alternativas[idxCorreto] : ""
      const texto = cleanAlternative(textoRaw)
      const label = letra ? `Alternativa correta: ${letra}${texto ? ` - ${texto}` : ""}` : "Alternativa correta: -"
      doc.text(label, marginLeft + 10, cursorY)
      cursorY += 18
    } else {
      const resp = q.resposta_correta?.trim() || "Resposta não informada."
      const splitResp = doc.splitTextToSize(`Resposta esperada: ${resp}`, 520)
      doc.text(splitResp, marginLeft + 10, cursorY)
      cursorY += splitResp.length * 16
    }

    doc.setFontSize(10)
    doc.text(`Valor: ${q.valor} ponto(s)`, marginLeft + 10, cursorY + 10)
    doc.setFontSize(12)
    cursorY += 24
  })

  doc.save(`${data.titulo || "avaliacao"}-gabarito.pdf`)
}


function cleanAlternative(value: string): string {
  if (!value) return ""
  return value.replace(/^[A-Da-d]\s*[\)\.\-:]?\s*/, "").trim()
}
