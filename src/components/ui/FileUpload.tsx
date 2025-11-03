import { useCallback, useRef, useState } from "react"
import type { FileContent } from "../../services/ai"

type FileUploadProps = {
  onFilesChange?: (files: FileContent[]) => void
  multiple?: boolean
  accept?: string
}

async function fileToContent(file: File): Promise<FileContent> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== "string") {
        reject(new Error("Formato de arquivo inválido"))
        return
      }
      resolve(result.split(",").pop() ?? "")
    }
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"))
    reader.readAsDataURL(file)
  })

  return {
    mimeType: file.type || "application/octet-stream",
    data: base64,
    name: file.name,
  }
}

export function FileUpload({ onFilesChange, multiple = true, accept }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [files, setFiles] = useState<FileContent[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const notify = useCallback(
    (contents: FileContent[], previewNames: string[]) => {
      setFiles(contents)
      setPreviews(previewNames)
      onFilesChange?.(contents)
    },
    [onFilesChange]
  )

  const handleFiles = useCallback(
    async (list: FileList | null) => {
      if (!list?.length) return
      const arr = Array.from(list)
      const contents = await Promise.all(arr.map(fileToContent))
      notify(multiple ? contents : [contents[0]], arr.map((file) => file.name))
    },
    [multiple, notify]
  )

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      await handleFiles(event.dataTransfer.files)
    },
    [handleFiles]
  )

  const onRemove = useCallback(
    (index: number) => {
      const nextFiles = files.filter((_, i) => i !== index)
      const nextPreviews = previews.filter((_, i) => i !== index)
      notify(nextFiles, nextPreviews)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    },
    [files, previews, notify]
  )

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault()
        }}
        onDrop={onDrop}
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center text-sm text-gray-600 transition hover:border-gray-400 hover:bg-gray-100"
      >
        <p className="font-medium">Anexe arquivos de referência (opcional)</p>
        <p className="text-xs text-gray-500">Arraste e solte ou use o botão abaixo</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Selecionar arquivos
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(event) => {
            void handleFiles(event.target.files)
          }}
        />
      </div>

      {previews.length > 0 && (
        <div className="space-y-2 rounded-2xl border bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-700">Arquivos selecionados</p>
          <ul className="space-y-1 text-sm text-gray-600">
            {previews.map((name, index) => (
              <li key={`${name}-${index}`} className="flex items-center justify-between gap-2">
                <span className="truncate">{name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-xs font-medium text-red-500 hover:text-red-600"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
