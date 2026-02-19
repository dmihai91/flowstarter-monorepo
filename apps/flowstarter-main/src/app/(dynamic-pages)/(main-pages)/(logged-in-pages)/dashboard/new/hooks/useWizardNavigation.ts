import { useWizardStore } from '@/store/wizard-store';
import type { ProjectWizardStep } from '@/types/project-config';

interface UseWizardNavigationProps {
  currentStep: ProjectWizardStep;
  steps: Array<{
    id: ProjectWizardStep;
    title: string;
    description: string;
  }>;
}

export function useWizardNavigation({
  currentStep,
  steps,
}: UseWizardNavigationProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const current = steps[currentStepIndex];
  const setCurrentStep = useWizardStore((s) => s.setCurrentStep);
  const showAssistantTransition = useWizardStore(
    (s) => s.showAssistantTransition
  );

  const navigateToStep = (stepId: ProjectWizardStep) => {
    setCurrentStep(stepId);
    const url = new URL(window.location.href);
    url.searchParams.set('step', stepId);
    window.history.pushState({}, '', url.toString());
  };

  const isStepAccessible = (index: number, stepId: ProjectWizardStep) => {
    return (
      index <= currentStepIndex ||
      (stepId === 'template' && showAssistantTransition)
    );
  };

  const getStepState = (index: number, stepId: ProjectWizardStep) => {
    const isCompleted =
      index < currentStepIndex ||
      (stepId === 'details' &&
        showAssistantTransition &&
        index !== currentStepIndex);
    const isCurrent =
      index === currentStepIndex
        ? !showAssistantTransition
        : stepId === 'template' && showAssistantTransition;

    return { isCompleted, isCurrent };
  };

  return {
    currentStepIndex,
    current,
    navigateToStep,
    isStepAccessible,
    getStepState,
  };
}
