export type QuestaoObjetiva = {
  tipo: "objetiva"
  enunciado: string
  alternativas: string[]
  resposta_correta: string
  habilidade?: string
  dificuldade?: "fácil" | "médio" | "difícil"
  tags?: string[]
}

export type QuestaoDissertativa = {
  tipo: "dissertativa"
  enunciado: string
  rubrica_sugestao?: { criterio: string; niveis: string[] }[]
  tags?: string[]
}

export type Questao = QuestaoObjetiva | QuestaoDissertativa

export type AvaliacaoJSON = {
  titulo: string
  disciplina?: string
  tema?: string
  serie?: string
  questoes: Questao[]
  gabarito?: { [index: number]: string }
}
