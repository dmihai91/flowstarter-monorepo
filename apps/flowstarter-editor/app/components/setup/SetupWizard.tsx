/**
 * Setup Wizard
 *
 * Multi-step wizard for new projects: business data → template → design → confirm.
 */

import { useState } from 'react';
import { BusinessDataStep } from './BusinessDataStep';
import { TemplateStep } from './TemplateStep';
import { DesignStep } from './DesignStep';
import { ConfirmStep } from './ConfirmStep';

export interface SetupData {
  businessName?: string;
  businessDescription?: string;
  industry?: string;
  templateSlug?: string;
  templateName?: string;
  palette?: string;
  headingFont?: string;
  bodyFont?: string;
}

interface SetupWizardProps {
  projectId: string;
  initialBusinessData?: {
    name?: string;
    description?: string;
    industry?: string;
  };
  onComplete: (data: SetupData) => void;
  isLoading?: boolean;
}

const STEPS = ['business', 'template', 'design', 'confirm'] as const;
type Step = (typeof STEPS)[number];

export function SetupWizard({
  projectId,
  initialBusinessData,
  onComplete,
  isLoading,
}: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(
    initialBusinessData?.name ? 'template' : 'business',
  );
  const [data, setData] = useState<SetupData>({
    businessName: initialBusinessData?.name,
    businessDescription: initialBusinessData?.description,
    industry: initialBusinessData?.industry,
  });

  const stepIndex = STEPS.indexOf(currentStep);
  const totalSteps = STEPS.length;

  const goNext = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const goPrev = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const updateData = (updates: Partial<SetupData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-emerald-600 dark:text-emerald-400 text-lg font-bold">f</span>
          <span className="text-xs font-medium tracking-widest uppercase text-gray-400 dark:text-zinc-500">
            Flowstarter Editor
          </span>
        </div>
        <div className="flex gap-1 mb-1">
          {STEPS.map((step, i) => (
            <div
              key={step}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-zinc-800'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-zinc-500">
          Step {stepIndex + 1} of {totalSteps}
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl">
          {currentStep === 'business' && (
            <BusinessDataStep
              data={data}
              onUpdate={updateData}
              onNext={goNext}
            />
          )}
          {currentStep === 'template' && (
            <TemplateStep
              projectId={projectId}
              data={data}
              onUpdate={updateData}
              onNext={goNext}
              onPrev={goPrev}
            />
          )}
          {currentStep === 'design' && (
            <DesignStep
              data={data}
              onUpdate={updateData}
              onNext={goNext}
              onPrev={goPrev}
            />
          )}
          {currentStep === 'confirm' && (
            <ConfirmStep
              data={data}
              onConfirm={() => onComplete(data)}
              onPrev={goPrev}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
