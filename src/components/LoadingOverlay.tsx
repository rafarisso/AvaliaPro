// Overlay de carregamento fixo na tela — visível em qualquer rolagem,
// no celular e no desktop. Bloqueia a tela durante a geração com IA.
export default function LoadingOverlay({ show, message }: { show: boolean; message?: string }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm">
      <div className="flex max-w-xs flex-col items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-xl">
        <span className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-center text-sm font-medium text-gray-800">{message || "Gerando com IA…"}</p>
        <p className="text-center text-xs text-gray-400">Isso pode levar alguns segundos. Não feche a página.</p>
      </div>
    </div>
  )
}
