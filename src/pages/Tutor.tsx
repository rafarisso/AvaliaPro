import React from 'react'
import FeaturePlaceholder from './shared/FeaturePlaceholder'

const highlights = [
  {
    title: 'Assistente pedagógico',
    description: 'Receba respostas contextualizadas sobre planejamento, avaliações e engajamento estudantil.',
  },
  {
    title: 'Sugestões de intervenção',
    description: 'Identifique estudantes com baixa participação e receba propostas de acompanhamento personalizado.',
  },
  {
    title: 'Registro de interações',
    description: 'Mantenha o histórico de dúvidas e decisões tomadas com o tutor virtual.',
  },
]

const steps = [
  'Informe a turma ou o conteúdo sobre o qual precisa de suporte.',
  'Acompanhe o resumo das recomendações e materiais sugeridos.',
  'Marque ações concluídas para alimentar o painel de acompanhamento.',
]

const sideNotes = [
  {
    title: 'Tom de voz personalizado',
    description: 'Escolha entre linguagem mais formal ou descontraída para as respostas do tutor.',
  },
  {
    title: 'Atualizações constantes',
    description: 'Conteúdo pedagógico revisado com especialistas a cada ciclo letivo.',
  },
]

const extraSection = (
  <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-slate-900">Perguntas frequentes</h2>
    <ul className="mt-4 space-y-3 text-sm text-slate-600">
      <li>• Como criar um plano de recuperação por habilidade?</li>
      <li>• Quais estratégias usar para aumentar a participação nas aulas?</li>
      <li>• Como apresentar resultados para famílias e coordenação?</li>
    </ul>
  </section>
)

export default function Tutor() {
  return (
    <FeaturePlaceholder
      badge="IA pedagógica"
      title="Tutor do AvaliaPro"
      description="Converse com um assistente especializado que entende a realidade da sua rede de ensino."
      highlights={highlights}
      steps={steps}
      sideNotes={sideNotes}
      extra={extraSection}
    />
  )
}
