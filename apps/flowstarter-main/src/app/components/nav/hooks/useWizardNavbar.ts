'use client';
import { projectTemplates } from '@/data/project-templates';
import { useWizardStore } from '@/store/wizard-store';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export interface WizardNavbarState {
  isOnWizard: boolean;
  projectName: string;
  templateId: string;
  templateName: string | undefined;
  currentStep: string | null;
  showTemplateName: boolean;
  wizardActions: {
    onCancel?: () => void;
    onPublish?: () => void;
    canPublish?: boolean;
    autosaveElement?: React.ReactNode;
  } | null;
  setIsDiscarding: (value: boolean) => void;
}

/**
 * Hook to manage all wizard-related navbar state.
 * Reads store data unconditionally to avoid Zustand selector issues,
 * then applies conditional logic after the read.
 */
export function useWizardNavbar(): WizardNavbarState {
  const pathname = usePathname();
  const isOnWizard = Boolean(
    pathname?.startsWith('/dashboard/new') ||
      pathname?.startsWith('/wizard/project')
  );

  // Read store values unconditionally to ensure stable selectors
  // This prevents issues where conditional selectors can mask store changes
  const rawProjectName = useWizardStore((state) => state.projectConfig.name);
  const rawTemplateId = useWizardStore(
    (state) => state.projectConfig.template?.id
  );
  const rawCurrentStep = useWizardStore((state) => state.currentStep);
  const setIsDiscarding = useWizardStore((state) => state.setIsDiscarding);
  const rawWizardActions = useWizardStore((state) => state.wizardActions);

  // Apply conditional logic after reading from store
  const projectName = isOnWizard ? rawProjectName : '';
  const templateId = isOnWizard ? rawTemplateId ?? '' : '';
  const currentStep = isOnWizard ? rawCurrentStep : null;
  const wizardActions = isOnWizard ? rawWizardActions : null;

  // Get template name from templateId
  const templateName = useMemo(() => {
    if (!templateId) return undefined;
    const template = projectTemplates.find((t) => t.id === templateId);
    return template?.name;
  }, [templateId]);

  // Show template name only on review step
  const showTemplateName = isOnWizard && currentStep === 'review';

  return {
    isOnWizard,
    projectName,
    templateId,
    templateName,
    currentStep,
    showTemplateName,
    wizardActions,
    setIsDiscarding,
  };
}
