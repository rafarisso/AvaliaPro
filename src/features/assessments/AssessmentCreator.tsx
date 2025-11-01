import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import StepIndicator from "./StepIndicator";
import Step1Topic from "./Step1Topic";
import Step2Content from "./Step2Content";
import Step3Config from "./Step3Config";
import Step4Review from "./Step4Review";
import BookOpenIcon from "./icons/BookOpenIcon";
import CameraIcon from "./icons/CameraIcon";
import FileTextIcon from "./icons/FileTextIcon";
import SparklesIcon from "./icons/SparklesIcon";
import ChevronLeftIcon from "./icons/ChevronLeftIcon";
import ChevronRightIcon from "./icons/ChevronRightIcon";
import { callAI } from "@/services/ai";
import { saveAssessment, type GeneratedAssessment } from "@/services/assessments";
import Spinner from "./Spinner";

type FormState = {
  topic: string;
  discipline: string;
  grade: string;
  skills: string;
  referenceText: string;
  evidenceImage: string | null;
  numQuestions: number;
  level: "facil" | "medio" | "dificil";
  questionType: "multipla_escolha" | "dissertativa" | "mista";
  includeAnswerKey: boolean;
};

const initialState: FormState = {
  topic: "",
  discipline: "Ciencias",
  grade: "6o ano",
  skills: "",
  referenceText: "",
  evidenceImage: null,
  numQuestions: 6,
  level: "medio",
  questionType: "multipla_escolha",
  includeAnswerKey: true,
};

const steps = [
  { id: 1, title: "Tema", description: "Base do conteudo", icon: BookOpenIcon },
  { id: 2, title: "Contexto", description: "BNCC e turma", icon: CameraIcon },
  { id: 3, title: "Configuracao", description: "Formato da avaliacao", icon: FileTextIcon },
  { id: 4, title: "Revisao", description: "Ajustes finais", icon: SparklesIcon },
];

export default function AssessmentCreator() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedAssessment | null>(null);

  const canAdvance = useMemo(() => {
    if (step === 1) {
      return form.topic.trim().length >= 3 && form.discipline.trim().length > 0 && form.grade.trim().length > 0;
    }
    if (step === 2) {
      return true;
    }
    if (step === 3) {
      return !loading;
    }
    return true;
  }, [form.topic, form.discipline, form.grade, step, loading]);

  const goNext = () => {
    if (step < 4 && canAdvance) {
      setStep(step + 1);
    }
  };

  const goPrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      alert("Entre com sua conta para gerar a avaliacao.");
      return;
    }
    if (form.topic.trim().length < 3) {
      alert("Informe um tema para continuar.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        topic: form.topic,
        grade: form.grade,
        discipline: form.discipline,
        numQuestions: form.numQuestions,
        level: form.level,
        questionType: form.questionType,
        skills: form.skills,
        referenceText: form.referenceText,
        includeAnswerKey: form.includeAnswerKey,
      };
      const data: GeneratedAssessment = await callAI("generate-structured", payload);
      setGenerated(data);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha inesperada.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !generated) return;
    setSaving(true);
    try {
      const id = await saveAssessment(user.id, generated);
      alert("Avaliacao salva com sucesso!");
      navigate(`/avaliacoes/${id}`);
    } catch (err) {
      alert(`Nao foi possivel salvar: ${err instanceof Error ? err.message : "erro desconhecido"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <header className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-semibold text-blue-600">Fluxo guiado</p>
          <h1 className="text-3xl font-semibold text-gray-900">Criar avaliacao com IA</h1>
          <p className="text-sm text-gray-600">
            Complete cada etapa com contexto da sua turma. Use o passo 4 para revisar e salvar direto no Supabase.
          </p>
        </header>

        <StepIndicator steps={steps} currentStep={step} />

        <div className="space-y-6">
          {step === 1 ? (
            <Step1Topic
              topic={form.topic}
              discipline={form.discipline}
              grade={form.grade}
              onChange={(values) => setForm((current) => ({ ...current, ...values }))}
            />
          ) : null}

          {step === 2 ? (
            <Step2Content
              skills={form.skills}
              referenceText={form.referenceText}
              evidenceImage={form.evidenceImage ?? undefined}
              onChange={(values) => setForm((current) => ({ ...current, ...values }))}
            />
          ) : null}

          {step === 3 ? (
            <Step3Config
              numQuestions={form.numQuestions}
              level={form.level}
              questionType={form.questionType}
              includeAnswerKey={form.includeAnswerKey}
              onChange={(values) => setForm((current) => ({ ...current, ...values }))}
            />
          ) : null}

          {step === 4 ? (
            <Step4Review
              loading={loading}
              assessment={generated}
              error={error}
              onRetry={handleGenerate}
              onSave={handleSave}
              saving={saving}
            />
          ) : null}
        </div>

        <footer className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 1}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Voltar
          </button>

          {step < 3 ? (
            <button
              type="button"
              disabled={!canAdvance}
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Avancar
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          ) : step === 3 ? (
            <div className="flex items-center gap-3">
              {loading ? <Spinner /> : null}
              <button
                type="button"
                disabled={!canAdvance || loading}
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Gerando..." : "Gerar avaliacao"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Ajustar configuracoes
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
