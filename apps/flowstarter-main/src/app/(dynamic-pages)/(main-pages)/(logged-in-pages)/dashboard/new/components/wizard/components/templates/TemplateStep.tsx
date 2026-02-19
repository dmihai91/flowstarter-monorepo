import { useWizardStore } from '@/store/wizard-store';
import type { TemplateStepProps } from '@/types/project-config';
import { TemplateRecommendations } from './TemplateRecommendations';

export function TemplateStep({
  onTemplateSelect,
  initialAvailableIds,
  projectConfig,
}: TemplateStepProps) {
  const projectConfigState = useWizardStore((s) => s.projectConfig);
  const setProjectConfig = useWizardStore((s) => s.setProjectConfig);

  return (
    <TemplateRecommendations
      projectConfig={projectConfig || projectConfigState}
      selectedTemplateId={projectConfigState.template?.id || ''}
      onSelectTemplate={(template) => {
        const updatedConfig = {
          ...projectConfigState,
          template,
        };
        setProjectConfig(updatedConfig);
        onTemplateSelect(template);
      }}
      initialAvailableIds={initialAvailableIds}
    />
  );
}
