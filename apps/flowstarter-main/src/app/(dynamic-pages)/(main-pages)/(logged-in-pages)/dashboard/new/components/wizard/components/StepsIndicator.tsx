import type { ProjectWizardStep } from '@/types/project-config';
import { StepButton } from './StepButton';

interface StepsIndicatorProps {
  steps: Array<{
    id: ProjectWizardStep;
    title: string;
    description: string;
  }>;
  navigateToStep: (stepId: ProjectWizardStep) => void;
  isStepAccessible: (index: number, stepId: ProjectWizardStep) => boolean;
  getStepState: (
    index: number,
    stepId: ProjectWizardStep
  ) => {
    isCompleted: boolean;
    isCurrent: boolean;
  };
}

export function StepsIndicator({
  steps,
  navigateToStep,
  isStepAccessible,
  getStepState,
}: StepsIndicatorProps) {
  const renderSteps = (variant: 'mobile' | 'tablet' | 'desktop') => {
    return steps.map((step, index) => {
      const { isCompleted, isCurrent } = getStepState(index, step.id);
      const isAccessible = isStepAccessible(index, step.id);

      return (
        <StepButton
          key={step.id}
          step={step}
          index={index}
          isAccessible={isAccessible}
          isCompleted={isCompleted}
          isCurrent={isCurrent}
          isLastStep={index === steps.length - 1}
          onClick={() => isAccessible && navigateToStep(step.id)}
          variant={variant}
        />
      );
    });
  };

  return (
    <div className="sticky top-0 z-50 border-t border-gray-300/50 dark:border-white/25 bg-white/70 dark:bg-[rgba(58,58,74,0.3)] backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.1)]">
      <div className="relative z-10 w-full p-1">
        <div className="py-1">
          {/* Mobile */}
          <div className="block sm:hidden">
            <div className="overflow-x-auto no-scrollbar px-3 py-2 snap-x snap-mandatory touch-pan-x">
              <div className="min-w-max flex items-center gap-2 mr-24">
                {renderSteps('mobile')}
              </div>
            </div>
          </div>

          {/* Tablet */}
          <div className="hidden sm:block lg:hidden">
            <div className="overflow-x-auto no-scrollbar px-2 mb-1 snap-x snap-mandatory touch-pan-x">
              <div className="min-w-max flex items-center gap-1.5 p-0.5 mr-28">
                {renderSteps('tablet')}
              </div>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto no-scrollbar -mx-2 px-2 p-1 snap-x snap-mandatory touch-pan-x">
              <div className="min-w-max mx-auto flex items-center justify-center gap-1.5">
                {renderSteps('desktop')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
