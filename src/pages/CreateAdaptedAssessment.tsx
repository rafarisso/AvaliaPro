import React from 'react'
import FeaturePlaceholder from './shared/FeaturePlaceholder'

const highlights = [
  {
    title: 'Trilhas inclusivas',
    description: 'Adapte conteúdos para estudantes com diferentes necessidades e mantenha os objetivos pedagógicos.',
  },
  {
    title: 'Sugestões de apoio',
    description: 'Receba orientações de recursos visuais, auditivos e táteis para enriquecer a experiência de aprendizagem.',
  },
  {
    title: 'Monitoramento de progresso',
    description: 'Acompanhe avanços individuais e compartilhe evidências com a equipe multiprofissional.',
  },
]

const steps = [
  'Selecione a avaliação base que deseja adaptar.',
  'Defina metas personalizadas e recursos complementares.',
  'Compartilhe com a família ou responsáveis para alinhamento das estratégias.',
]

const sideNotes = [
  {
    title: 'Atenção à linguagem',
    description: 'Utilize instruções simples, objetivas e contextualizadas na realidade do estudante.',
  },
  {
    title: 'Feedback contínuo',
    description: 'Combine devolutivas escritas e verbais para reforçar conquistas.',
  },
]

const extraSection = (
  <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-slate-900">Recursos recomendados</h2>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Apoio pedagógico</p>
        <ul className="mt-2 space-y-2">
          <li>• Sugestões de mediação com família e equipe de apoio.</li>
          <li>• Planejamento semanal com indicadores de avanço.</li>
        </ul>
      </div>
      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Materiais complementares</p>
        <ul className="mt-2 space-y-2">
          <li>• Kits de comunicação alternativa.</li>
          <li>• Roteiros visuais personalizáveis.</li>
        </ul>
      </div>
    </div>
  </section>
)

export default function CreateAdaptedAssessment() {
  return (
    <FeaturePlaceholder
      badge="Inclusão"
      title="Criar avaliação adaptada"
      description="Personalize atividades avaliativas para garantir equidade e participação de todos os estudantes."
      highlights={highlights}
      steps={steps}
      sideNotes={sideNotes}
      extra={extraSection}
    />
  )
}
