import React from 'react'
import FeaturePlaceholder from './shared/FeaturePlaceholder'

const highlights = [
  {
    title: 'Modelos prontos',
    description: 'Escolha entre layouts modernos com cores institucionais e fontes legíveis.',
  },
  {
    title: 'Conteúdo automático',
    description: 'Gere tópicos-chave a partir do plano de aula e receba sugestões de imagens e ícones.',
  },
  {
    title: 'Exportação instantânea',
    description: 'Baixe em PPTX ou PDF, ou compartilhe via link para turmas virtuais.',
  },
]

const steps = [
  'Selecione o objetivo da apresentação e a série dos estudantes.',
  'Revise os tópicos sugeridos e personalize com exemplos da sua realidade.',
  'Exporte e compartilhe com a turma ou equipe pedagógica.',
]

const sideNotes = [
  {
    title: 'Dinâmica de abertura',
    description: 'Comece com uma pergunta provocativa ou uma situação-problema para engajar a turma.',
  },
  {
    title: 'Tempo estimado',
    description: 'O gerador sugere duração para cada bloco e aponta slides extensos.',
  },
]

const extraSection = (
  <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-slate-900">Boas práticas de apresentação</h2>
    <ul className="mt-4 space-y-3 text-sm text-slate-600">
      <li>• Utilize até três cores principais para manter a consistência visual.</li>
      <li>• Prefira frases curtas e destaque palavras-chave.</li>
      <li>• Insira momentos de interação a cada 10 minutos.</li>
    </ul>
  </section>
)

export default function CreateSlides() {
  return (
    <FeaturePlaceholder
      badge="Apresentações"
      title="Criar slides pedagógicos"
      description="Transforme seus planejamentos em apresentações visuais prontas para sala de aula ou ambientes virtuais."
      highlights={highlights}
      steps={steps}
      sideNotes={sideNotes}
      extra={extraSection}
    />
  )
}
