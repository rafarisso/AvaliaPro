import React from 'react'
import FeaturePlaceholder from '@/src/pages/shared/FeaturePlaceholder'

const highlights = [
  {
    title: 'Passo a passo personalizado',
    description: 'Configure escola, turmas e metas de aprendizagem em menos de 10 minutos.',
  },
  {
    title: 'Importação guiada',
    description: 'Receba ajuda para migrar dados da escola e integrar com sistemas existentes.',
  },
  {
    title: 'Treinamento rápido',
    description: 'Acesso a vídeos curtos, templates e checklist de adoção para a equipe.',
  },
]

const steps = [
  'Defina os responsáveis pela implantação e convide a equipe inicial.',
  'Configure turmas, séries e componentes curriculares prioritários.',
  'Ative recursos experimentais conforme a maturidade da rede.',
]

const sideNotes = [
  {
    title: 'Suporte dedicado',
    description: 'Um especialista acompanha sua escola durante o período de ativação.',
  },
  {
    title: 'Comunicação com famílias',
    description: 'Modelos de apresentação para reuniões e canais oficiais.',
  },
]

export default function OnboardingWizard() {
  return (
    <FeaturePlaceholder
      badge="Primeiros passos"
      title="Assistente de implantação"
      description="Estamos preparando um fluxo de boas-vindas para deixar sua escola pronta para usar o AvaliaPro."
      highlights={highlights}
      steps={steps}
      sideNotes={sideNotes}
    />
  )
}
