import React from 'react'
import FeaturePlaceholder from './shared/FeaturePlaceholder'

const highlights = [
  {
    title: 'Modelos guiados pela BNCC',
    description: 'Selecione habilidades e competências e receba sugestões de questões alinhadas ao nível da turma.',
  },
  {
    title: 'Editor com feedback imediato',
    description: 'Ajuste critérios, níveis de dificuldade e pontos de atenção com orientação pedagógica automática.',
  },
  {
    title: 'Compartilhamento simplificado',
    description: 'Envie para colegas, exporte em PDF ou gere um link público para revisão e comentários.',
  },
]

const steps = [
  'Escolha a turma e o componente curricular que deseja avaliar.',
  'Combine questões sugeridas com itens próprios da sua escola.',
  'Revise os critérios de correção e gere a versão final para impressão ou envio.',
]

const sideNotes = [
  {
    title: 'Sugestão pedagógica',
    description:
      'Varie formatos (múltipla escolha, discursiva, produção criativa) para contemplar diferentes perfis de aprendizagem.',
  },
  {
    title: 'Colaboração facilitada',
    description: 'Convide outro professor para revisar a avaliação antes de aplicá-la.',
  },
]

const extraSection = (
  <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-slate-900">Checklist rápido</h2>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Antes de gerar</p>
        <ul className="mt-2 space-y-2">
          <li>• Confirme a matriz de habilidades que deseja abordar.</li>
          <li>• Defina o tempo estimado da avaliação.</li>
        </ul>
      </div>
      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Após finalizar</p>
        <ul className="mt-2 space-y-2">
          <li>• Compartilhe com a coordenação pedagógica.</li>
          <li>• Acompanhe o desempenho das turmas nos relatórios.</li>
        </ul>
      </div>
    </div>
  </section>
)

export default function CreateAssessment() {
  return (
    <FeaturePlaceholder
      badge="Gerador"
      title="Criar avaliação personalizada"
      description="Construa avaliações equilibradas em minutos, combinando sugestões inteligentes com o repertório da sua escola."
      highlights={highlights}
      steps={steps}
      sideNotes={sideNotes}
      extra={extraSection}
    />
  )
}
