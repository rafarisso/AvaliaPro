import React from 'react'
import FeaturePlaceholder from '@/src/pages/shared/FeaturePlaceholder'

const highlights = [
  {
    title: 'Assistente visual',
    description: 'Selecione temas visuais, organize blocos e gere slides coerentes em poucos cliques.',
  },
  {
    title: 'Sugestões de narrativa',
    description: 'Receba roteiro de fala e momentos de interação para cada slide.',
  },
  {
    title: 'Entrega multicanal',
    description: 'Apresente em sala, compartilhe link ou exporte para plataformas de reunião.',
  },
]

const steps = [
  'Informe o objetivo da apresentação e o tempo disponível.',
  'Ajuste a sequência de slides, adicionando exemplos e exercícios.',
  'Faça o download ou envie o link para a turma.',
]

const sideNotes = [
  {
    title: 'Personalização de branding',
    description: 'Inclua logo da escola e cores oficiais automaticamente.',
  },
  {
    title: 'Compatibilidade',
    description: 'Arquivos otimizados para Google Slides, PowerPoint e PDF.',
  },
]

export default function SlidesCreator() {
  return (
    <FeaturePlaceholder
      badge="Slides dinâmicos"
      title="Gerador de apresentações"
      description="O construtor de slides está em fase final de testes com professores parceiros."
      highlights={highlights}
      steps={steps}
      sideNotes={sideNotes}
    />
  )
}
