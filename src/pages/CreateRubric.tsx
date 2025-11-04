import React from 'react'
import FeaturePlaceholder from './shared/FeaturePlaceholder'

const highlights = [
  {
    title: 'Critérios personalizáveis',
    description: 'Monte rubricas por habilidade, produto ou comportamento observável.',
  },
  {
    title: 'Níveis de desempenho sugeridos',
    description: 'Use referências prontas para cada faixa etária e ajuste a linguagem conforme o contexto.',
  },
  {
    title: 'Registro simplificado',
    description: 'Registre observações durante a aula e gere relatórios de evolução.',
  },
]

const steps = [
  'Defina o objetivo e o público da rubrica.',
  'Escolha critérios e níveis propostos ou crie os seus.',
  'Compartilhe com a equipe e cole em atividades avaliativas.',
]

const sideNotes = [
  {
    title: 'Transparência com estudantes',
    description: 'Apresente a rubrica antes da atividade para alinhar expectativas.',
  },
  {
    title: 'Evidências qualitativas',
    description: 'Adicione comentários e anexos para cada critério avaliado.',
  },
]

const extraSection = (
  <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-slate-900">Sugestões de critérios</h2>
    <div className="mt-4 space-y-3 text-sm text-slate-600">
      <p>• Domínio do conteúdo</p>
      <p>• Participação e colaboração</p>
      <p>• Organização e clareza na comunicação</p>
      <p>• Criatividade e inovação</p>
    </div>
  </section>
)

export default function CreateRubric() {
  return (
    <FeaturePlaceholder
      badge="Rubricas"
      title="Criar rubrica avaliativa"
      description="Construa instrumentos claros para orientar expectativas e dar devolutivas mais ricas."
      highlights={highlights}
      steps={steps}
      sideNotes={sideNotes}
      extra={extraSection}
    />
  )
}
