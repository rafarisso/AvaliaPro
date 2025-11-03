import { useState } from "react";
import CameraModal from "@/features/common/CameraModal";
import CameraIcon from "./icons/CameraIcon";

type Step2Values = {
  skills: string;
  referenceText: string;
  evidenceImage?: string | null;
};

type Step2ContentProps = Step2Values & {
  onChange: (values: Partial<Step2Values>) => void;
};

export default function Step2Content({ skills, referenceText, evidenceImage, onChange }: Step2ContentProps) {
  const [cameraOpen, setCameraOpen] = useState(false);

  return (
    <>
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow">
        <header className="space-y-1">
          <p className="text-sm font-medium text-blue-600">Passo 2</p>
          <h2 className="text-2xl font-semibold text-gray-900">Adicione contexto pedagogico</h2>
          <p className="text-sm text-gray-600">
            Conte a habilidade da BNCC, objetivos ou situacoes reais da turma. Isso deixa a geracao mais personalizada.
          </p>
        </header>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Competencias e habilidades (opcional)</span>
          <textarea
            value={skills}
            onChange={(event) => onChange({ skills: event.target.value })}
            rows={4}
            placeholder="Ex.: EF06CI05 - Identificar a importancia da agua..."
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Anotacoes da aula (opcional)</span>
          <textarea
            value={referenceText}
            onChange={(event) => onChange({ referenceText: event.target.value })}
            rows={4}
            placeholder="Principais pontos trabalhados, dificuldades observadas, exemplos que os alunos gostaram..."
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-100"
          />
        </label>

        <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Anexar referencia visual (opcional)</p>
              <p className="text-xs text-gray-600">
                Capture uma imagem da lousa ou material impresso. A imagem fica apenas para consulta do professor.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm ring-1 ring-blue-200 transition hover:bg-blue-50"
            >
              <CameraIcon className="h-4 w-4" />
              Abrir camera
            </button>
          </div>
          {evidenceImage ? (
            <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
              <img src={evidenceImage} alt="Referencia capturada" className="h-40 w-full object-cover" />
            </div>
          ) : null}
        </div>
      </div>

      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(dataUrl) => {
          onChange({ evidenceImage: dataUrl });
          setCameraOpen(false);
        }}
      />
    </>
  );
}
