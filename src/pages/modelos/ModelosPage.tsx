import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import PptxGenJS from "pptxgenjs"
import { generateSlides, type Slide } from "../../services/slides"

type Attachment = { name: string; type: string; data: string }

export default function ModelosPage() {
  const navigate = useNavigate()
  const [tema, setTema] = useState("")
  const [disciplina, setDisciplina] = useState("")
  const [serie, setSerie] = useState("")
  const [objetivos, setObjetivos] = useState("")
  const [arquivos, setArquivos] = useState<File[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const MAX_FILES = 5
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024

  const fileToAttachment = (file: File): Promise<Attachment> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(",")[1] || ""
        resolve({ name: file.name, type: file.type || "application/octet-stream", data: base64 })
      }
      reader.onerror = () => reject(new Error("Erro ao ler arquivo."))
      reader.readAsDataURL(file)
    })
  }

  const handleFiles = async (files: File[]) => {
    if (!files.length) return
    setErro(null)
    const limited = [...arquivos, ...files].slice(0, MAX_FILES)
    const images = limited.filter((f) => f.type.startsWith("image/") && f.size <= MAX_IMAGE_BYTES)
    if (images.length < limited.length) {
      setErro("Apenas imagens de até 5MB são aceitas (máx 5 arquivos).")
    }
    try {
      const atts = await Promise.all(images.map(fileToAttachment))
      setAttachments(atts)
    } catch {
      setErro("Não foi possível ler os arquivos.")
    }
    setArquivos(limited)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    void handleFiles(files)
  }

  const generate = async () => {
    setErro(null)
    setSlides([])
    if (!tema.trim()) {
      setErro("Informe um tema para gerar os slides.")
      return
    }
    setLoading(true)
    try {
      const resp = await generateSlides({
        tema,
        disciplina,
        serie,
        objetivos,
        attachments,
      })
      setSlides(resp)
    } catch (error: any) {
      setErro(error?.message || "Erro ao gerar slides.")
    } finally {
      setLoading(false)
    }
  }

  const downloadPPTX = async () => {
    if (!slides.length) {
      alert("Gere os slides primeiro.")
      return
    }
    try {
      const pptx = new PptxGenJS()
      pptx.title = tema || "Slides"
      pptx.layout = "16x9"
      slides.forEach((s, idx) => {
        const slide = pptx.addSlide()
        slide.addText(s.titulo || `Slide ${idx + 1}`, {
          x: 0.5,
          y: 0.4,
          w: 9,
          fontSize: 26,
          bold: true,
          color: "203864",
        })

        const bulletItems =
          s.topicos?.length && s.topicos.length > 0
            ? s.topicos.map((t) => ({ text: t, options: { bullet: true } }))
            : [{ text: "", options: { bullet: true } }]

        slide.addText(bulletItems as any, {
          x: 0.7,
          y: 1.4,
          w: 8.6,
          h: 3.5,
          fontSize: 18,
          lineSpacing: 30,
          color: "1f1f1f",
        })

        if (s.nota) {
          slide.addText(`Nota: ${s.nota}`, { x: 0.7, y: 4.5, fontSize: 12, color: "6b7280", italic: true })
        }
      })
      await pptx.writeFile({ fileName: `${tema || "slides"}.pptx` })
    } catch (error: any) {
      console.error("[PPTX]", error)
      setErro("Não foi possível baixar o PPTX. Tente novamente.")
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-semibold">Criar slides com IA</h1>
        </div>
        <p className="text-gray-600">Envie imagens ou descreva o tema e receba um PPT com tópicos prontos.</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Tema</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex.: Revolução Industrial, Clima Equatorial"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Disciplina</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
              placeholder="Ex.: História, Geografia"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Série/Ano</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
              placeholder="Ex.: 8º ano, 1º EM"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Objetivo da aula (opcional)</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={objetivos}
              onChange={(e) => setObjetivos(e.target.value)}
              placeholder="Ex.: Destacar causas e consequências principais"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Enviar material (imagens, até 5)</label>
          <div className="flex gap-2">
            <label className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50 cursor-pointer">
              Selecionar arquivos
              <input type="file" accept="image/*" multiple onChange={onFileChange} className="hidden" ref={inputRef} />
            </label>
          </div>
          {arquivos.length > 0 && (
            <ul className="text-sm text-gray-600 space-y-1">
              {arquivos.map((file, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  {file.name}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-500">Use fotos das páginas do livro ou infográficos para contextualizar.</p>
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white text-sm font-medium transition hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Gerando..." : "Gerar slides com IA"}
        </button>

        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </div>

      {slides.length > 0 && (
        <div className="space-y-3 rounded-2xl bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Preview</h2>
            <button
              type="button"
              onClick={downloadPPTX}
              className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Baixar PPTX
            </button>
          </div>
          <div className="space-y-3">
            {slides.map((s, idx) => (
              <div key={idx} className="rounded-xl border p-3 space-y-2">
                <div className="text-base font-semibold text-gray-800">
                  {idx + 1}. {s.titulo}
                </div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {s.topicos?.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
                {s.nota && <div className="text-xs text-gray-600 italic">Nota: {s.nota}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
