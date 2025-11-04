import React from 'react'
import FeaturePlaceholder from './shared/FeaturePlaceholder'

const highlights = [
  {
    title: 'Planilhas inteligentes',
    description: 'Faça upload de arquivos CSV ou XLSX e valide automaticamente colunas obrigatórias.',
  },
  {
    title: 'Detecção de duplicidades',
    description: 'Identifique estudantes já cadastrados e confirme atualizações com poucos cliques.',
  },
  {
    title: 'Integração com turmas',
    description: 'Associe alunos a turmas e responsáveis, garantindo comunicação alinhada.',
  },
]

const steps = [
  'Baixe o modelo de planilha do AvaliaPro para padronizar informações.',
  'Faça o upload do arquivo e corrija possíveis inconsistências sinalizadas.',
  'Confirme as turmas sugeridas e finalize a importação.',
]

const sideNotes = [
  {
    title: 'Proteção de dados',
    description: 'Todos os envios são criptografados e seguem a LGPD.',
  },
  {
    title: 'Suporte dedicado',
    description: 'Conte com nossa equipe para migrar dados históricos da sua escola.',
  },
]

const extraSection = (
  <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-slate-900">Antes de importar</h2>
    <ul className="mt-4 space-y-3 text-sm text-slate-600">
      <li>• Verifique se cada estudante possui CPF ou registro único.</li>
      <li>• Garanta que os e-mails responsáveis estejam atualizados.</li>
      <li>• Prepare uma planilha para responsáveis com telefone de emergência.</li>
    </ul>
  </section>
)

export default function ImportStudents() {
  return (
    <FeaturePlaceholder
      badge="Turmas"
      title="Importar estudantes"
      description="Organize rapidamente os dados dos alunos e mantenha registros confiáveis para toda a comunidade escolar."
      highlights={highlights}
      steps={steps}
      sideNotes={sideNotes}
      extra={extraSection}
    />
  )
}
