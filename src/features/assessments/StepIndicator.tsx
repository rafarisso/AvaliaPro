import type { ComponentType, SVGProps } from "react";

type Step = {
  id: number;
  title: string;
  description?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

type StepIndicatorProps = {
  steps: Step[];
  currentStep: number;
};

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <ol className="mb-8 flex flex-col gap-4 md:flex-row">
      {steps.map((step) => {
        const Icon = step.icon;
        const active = step.id === currentStep;
        const completed = step.id < currentStep;
        return (
          <li
            key={step.id}
            className={`flex flex-1 items-center gap-3 rounded-xl border p-4 transition ${
              active
                ? "border-blue-500 bg-blue-50"
                : completed
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                active
                  ? "bg-blue-500 text-white"
                  : completed
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {step.id}. {step.title}
              </p>
              {step.description ? <p className="text-xs text-gray-500">{step.description}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
