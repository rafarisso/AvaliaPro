import React, { ReactNode } from 'react'
import Header from '../../components/Header'
import PrototypeBanner from '../../components/PrototypeBanner'

export interface FeatureHighlight {
  title: string
  description: string
}

export interface FeaturePlaceholderProps {
  badge?: string
  title: string
  description: string
  highlightsTitle?: string
  highlights?: FeatureHighlight[]
  stepsTitle?: string
  steps?: string[]
  sideNotesTitle?: string
  sideNotes?: FeatureHighlight[]
  extra?: ReactNode
}

export default function FeaturePlaceholder({
  badge,
  title,
  description,
  highlightsTitle = 'Como o AvaliaPro pode ajudar',
  highlights,
  stepsTitle = 'Próximos passos',
  steps,
  sideNotesTitle = 'Dicas rápidas',
  sideNotes,
  extra,
}: FeaturePlaceholderProps) {
  const hasHighlights = Boolean(highlights?.length)
  const hasSteps = Boolean(steps?.length)
  const hasSideNotes = Boolean(sideNotes?.length)

  return (
    <div className="min-h-screen bg-slate-950/5">
      <PrototypeBanner />
      <Header />

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-16">
        <section className="space-y-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          {badge ? (
            <span className="accent-pill bg-primary/10 px-3 py-0.5 text-blue-600">{badge}</span>
          ) : null}
          <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">{title}</h1>
          <p className="text-base text-slate-500">{description}</p>
        </section>

        {(hasHighlights || hasSteps || hasSideNotes) && (
          <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-6">
              {hasHighlights && (
                <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-slate-900">{highlightsTitle}</h2>
                    <p className="text-sm text-slate-500">
                      Veja como estamos estruturando este recurso dentro do protótipo.
                    </p>
                  </div>
                  <div className="space-y-4">
                    {highlights!.map((item) => (
                      <div key={item.title} className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="text-sm text-slate-500">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasSteps && (
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">{stepsTitle}</h2>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    {steps!.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {hasSideNotes && (
              <aside className="space-y-6">
                <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">{sideNotesTitle}</h2>
                  <div className="space-y-3 text-sm text-slate-600">
                    {sideNotes!.map((item) => (
                      <div key={item.title}>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-slate-500">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </section>
        )}

        {extra}
      </main>
    </div>
  )
}
