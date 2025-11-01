import { useEffect, useRef } from "react";

type CameraModalProps = {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
};

export default function CameraModal({ open, onClose, onCapture }: CameraModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Anexar imagem de referencia</h2>
            <p className="text-sm text-gray-600">
              Use a camera do dispositivo ou selecione um arquivo existente. A imagem nao vai para a IA; fica apenas para
              consulta no painel.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            Fechar
          </button>
        </header>

        <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-5 text-center text-sm text-gray-600">
          <p className="font-medium text-blue-700">Capture ou selecione um arquivo (PNG ou JPG)</p>
          <p className="mt-2 text-xs text-gray-500">Tamanho sugerido: ate 3 MB.</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="mt-4 block w-full text-sm text-gray-600"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const value = typeof reader.result === "string" ? reader.result : "";
                if (value) {
                  onCapture(value);
                }
              };
              reader.readAsDataURL(file);
            }}
          />
        </div>
      </div>
    </div>
  );
}
