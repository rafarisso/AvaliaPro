import React from 'react'
import FeaturePlaceholder from './shared/FeaturePlaceholder'

const highlights = [
  {
    title: 'Sequências sugeridas',
    description: 'Combine objetivos de aprendizagem com atividades já testadas na rede parceira.',
  },
  {
    title: 'Integração com avaliações',
    description: 'Acompanhe quais habilidades serão avaliadas e receba alertas de lacunas.',
  },
  {
    title: 'Materiais prontos',
    description: 'Baixe listas de exercícios, roteiros de aula e slides personalizáveis.',
  },
]

const steps = [
  'Defina a duração da sequência e as habilidades foco.',
  'Personalize atividades sugeridas e adicione recursos próprios.',
  'Compartilhe com a coordenação ou publique no mural da turma.',
]

const sideNotes = [
  {
    title: 'Organização semanal',
    description: 'Planeje objetivos mensuráveis para cada encontro com indicadores de sucesso.',
  },
  {
    title: 'Integração com famílias',
    description: 'Disponibilize tarefas complementares para casa com orientações claras.',
  },
]

const extraSection = (
  <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-slate-900">Sugestões de estrutura</h2>
    <div className="mt-4 space-y-3 text-sm text-slate-600">
      <div>
        <p className="font-semibold text-slate-900">1. Abertura</p>
        <p className="mt-1">Retome o objetivo da aula e conecte com experiências prévias.</p>
      </div>
      <div>
        <p className="font-semibold text-slate-900">2. Desenvolvimento</p>
        <p className="mt-1">Alterne momentos expositivos, colaborativos e de prática guiada.</p>
      </div>
      <div>
        <p className="font-semibold text-slate-900">3. Fechamento</p>
        <p className="mt-1">Registre evidências de aprendizagem e indique desafios para casa.</p>
      </div>
    </div>
  </section>
)

export default function CreateLessonPlan() {
  return (
    <FeaturePlaceholder
      badge="Planejamento"
      title="Criar plano de aula"
      description="Estruture experiências completas em sala com sugestões inteligentes e materiais complementares."
      highlights={highlights}
      steps={steps}
      sideNotes={sideNotes}
      extra={extraSection}
    />
  )
}
