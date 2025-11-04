import React from 'react'
import FeaturePlaceholder from './shared/FeaturePlaceholder'

const highlights = [
  {
    title: 'Organização por coleção',
    description: 'Agrupe avaliações, planos e slides por turma, disciplina ou período letivo.',
  },
  {
    title: 'Histórico completo',
    description: 'Acompanhe atualizações, comentários e versões anteriores de cada criação.',
  },
  {
    title: 'Compartilhamento seguro',
    description: 'Defina permissões para colegas, coordenação e responsáveis.',
  },
]

const steps = [
  'Use filtros por tipo de material e turma para encontrar rapidamente o que precisa.',
  'Crie coleções temáticas para projetos interdisciplinares.',
  'Compartilhe links com permissões específicas de visualização ou edição.',
]

const sideNotes = [
  {
    title: 'Favoritos',
    description: 'Marque materiais usados com frequência para acesso instantâneo no painel.',
  },
  {
    title: 'Relatórios automáticos',
    description: 'Veja quantos materiais foram reutilizados pela equipe e quais precisam de revisão.',
  },
]

const extraSection = (
  <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-slate-900">Filtros principais</h2>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Tipo de material</p>
        <p className="mt-1">Avaliações, planos, rubricas, slides e materiais extras.</p>
      </div>
      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Situação</p>
        <p className="mt-1">Rascunhos, publicados, em revisão ou arquivados.</p>
      </div>
    </div>
  </section>
)

export default function MyCreations() {
  return (
    <FeaturePlaceholder
      badge="Biblioteca"
      title="Minhas criações"
      description="Centralize todos os materiais pedagógicos e acompanhe o impacto das suas produções."
      highlights={highlights}
      steps={steps}
      sideNotes={sideNotes}
      extra={extraSection}
    />
  )
}
