'use client';

import { useWizardStore } from '@/store/wizard-store';
import type { ProjectConfig } from '@/types/project-config';
import { useEffect } from 'react';
import { TemplateRecommendations } from './templates/TemplateRecommendations';

interface AssistantTransitionProps {
  projectConfig: ProjectConfig;
  initialAvailableIds?: string[];
}

export function AssistantTransition({
  projectConfig,
  initialAvailableIds,
}: AssistantTransitionProps) {
  const setShowAssistantTransition = useWizardStore(
    (s) => s.setShowAssistantTransition
  );
  const setCurrentStep = useWizardStore((s) => s.setCurrentStep);
  const projectConfigState = useWizardStore((s) => s.projectConfig);
  const setProjectConfig = useWizardStore((s) => s.setProjectConfig);
  const currentStep = useWizardStore((s) => s.currentStep);

  // Auto-advance to design step when template is selected
  useEffect(() => {
    if (
      projectConfigState.template?.id &&
      currentStep === 'details' &&
      projectConfigState.template.id !== ''
    ) {
      // Small delay to ensure state is updated
      const timer = setTimeout(() => {
        setShowAssistantTransition(false);
        setCurrentStep('design');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [
    projectConfigState.template?.id,
    currentStep,
    setShowAssistantTransition,
    setCurrentStep,
  ]);

  return (
    <TemplateRecommendations
      projectConfig={projectConfig}
      selectedTemplateId={projectConfigState.template?.id || ''}
      onSelectTemplate={(template) => {
        setProjectConfig({
          ...projectConfigState,
          template,
        });
      }}
      initialAvailableIds={initialAvailableIds}
    />
  );
}
