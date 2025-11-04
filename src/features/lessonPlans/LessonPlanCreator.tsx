import React from 'react'
import FeaturePlaceholder from '@/src/pages/shared/FeaturePlaceholder'

const highlights = [
  {
    title: 'Assistente de planejamento',
    description: 'Estruture etapas da aula com objetivos, metodologias e estratégias diferenciadas.',
  },
  {
    title: 'Biblioteca de recursos',
    description: 'Sugestões de vídeos, textos e dinâmicas alinhadas ao perfil da turma.',
  },
  {
    title: 'Acompanhamento contínuo',
    description: 'Sincronize o plano com avaliações e receba alertas sobre habilidades pouco trabalhadas.',
  },
]

const steps = [
  'Informe a duração do ciclo e os componentes curriculares.',
  'Personalize cada etapa com tempos estimados e recursos recomendados.',
  'Publique para a coordenação validar e compartilhar com o time.',
]

const sideNotes = [
  {
    title: 'Coautoria',
    description: 'Convide professores parceiros para editar o mesmo plano em tempo real.',
  },
  {
    title: 'Evidências de aprendizagem',
    description: 'Registre observações diretamente no plano para futuras revisões.',
  },
]

export default function LessonPlanCreator() {
  return (
    <FeaturePlaceholder
      badge="Planejamento inteligente"
      title="Construtor de planos de aula"
      description="Em breve você poderá criar planos dinâmicos com recomendações automáticas de atividades e recursos."
      highlights={highlights}
      steps={steps}
      sideNotes={sideNotes}
    />
  )
}
