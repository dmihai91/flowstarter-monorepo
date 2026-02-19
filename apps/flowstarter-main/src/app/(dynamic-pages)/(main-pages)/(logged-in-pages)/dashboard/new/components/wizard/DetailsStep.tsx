import { useWizardStore } from '@/store/wizard-store';
import type { WizardStepProps } from '@/types/project-config';
import { ProjectDetailsSection } from './components/ProjectDetailsSection';

export function DetailsStep({
  projectConfig,
  onProjectConfigChange,
}: WizardStepProps) {
  const isDiscarding = useWizardStore((state) => state.isDiscarding);

  return (
    <div className="w-full flex items-center justify-center">
      {!isDiscarding && (
        <ProjectDetailsSection
          projectConfig={projectConfig}
          onProjectConfigChange={onProjectConfigChange}
          templateId={projectConfig.template.id}
        />
      )}
    </div>
  );
}
