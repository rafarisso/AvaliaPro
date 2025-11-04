import React from 'react'
import FeaturePlaceholder from '@/src/pages/shared/FeaturePlaceholder'

const highlights = [
  {
    title: 'Fluxo guiado',
    description: 'Preencha rapidamente dados da turma, objetivos e formatos de questões com orientações passo a passo.',
  },
  {
    title: 'Conteúdos recomendados',
    description: 'Sugestões automáticas de habilidades, descritores e exemplos para cada etapa.',
  },
  {
    title: 'Exportação instantânea',
    description: 'Gere PDF, DOCX ou envie um link para revisão com a coordenação pedagógica.',
  },
]

const steps = [
  'Informe os dados da turma e o objetivo da avaliação.',
  'Escolha ou edite questões sugeridas para cada habilidade.',
  'Revise feedbacks automáticos e confirme a geração do material.',
]

const sideNotes = [
  {
    title: 'Integração com rubricas',
    description: 'Associe rubricas existentes para orientar correções e devolutivas.',
  },
  {
    title: 'Trabalho em equipe',
    description: 'Convide outro educador para coeditar o rascunho antes da publicação.',
  },
]

export default function AssessmentCreator() {
  return (
    <FeaturePlaceholder
      badge="Fluxo guiado"
      title="Gerador passo a passo de avaliações"
      description="Estamos finalizando o assistente interativo que transforma planos pedagógicos em avaliações prontas."
      highlights={highlights}
      steps={steps}
      sideNotes={sideNotes}
    />
  )
}
