'use client';

import type { ProjectConfig } from '@/types/project-config';
import { useWizardStore } from '@/store/wizard-store';
import { useCreateProject, useUpdateProject } from './useProjects';
import { useDraft, type DraftShape } from './useDraft';

export function useCreateProjectFromConfig(projectId?: string | null) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const { data: draft } = useDraft(projectId);
  const reviewState = useWizardStore((s) => s.reviewState);

  const create = async (projectConfig: ProjectConfig) => {
    // Check if we have an existing draft to convert
    const draftData = draft as DraftShape | null;
    const draftId = draftData?.id || projectId;

    const formData = new FormData();
    formData.append('name', projectConfig.name);
    formData.append('description', projectConfig.description);
    formData.append('chat', JSON.stringify(projectConfig));
    formData.append('domain_type', projectConfig.domainConfig.domainType);
    formData.append('domain_name', projectConfig.domainConfig.domain || '');
    formData.append('domain_provider', projectConfig.domainConfig.provider);
    formData.append(
      'is_published',
      projectConfig.publishImmediately ? '1' : '0'
    );

    // Include review state if available
    if (reviewState) {
      if (reviewState.generatedCode) {
        formData.append('generated_code', reviewState.generatedCode);
      }
      if (reviewState.generatedFiles) {
        formData.append(
          'generated_files',
          JSON.stringify(reviewState.generatedFiles)
        );
      }
      if (reviewState.previewHtml) {
        formData.append('preview_html', reviewState.previewHtml);
      }
      if (reviewState.qualityMetrics) {
        formData.append(
          'quality_metrics',
          JSON.stringify(reviewState.qualityMetrics)
        );
      }
    }

    // Persist key business info explicitly for backend consumption
    const industry = projectConfig.designConfig?.businessInfo?.industry || '';
    const targetAudience =
      projectConfig.designConfig?.businessInfo?.targetAudience ||
      projectConfig.targetUsers ||
      '';
    const businessGoals = projectConfig.businessGoals || '';
    formData.append('industry', industry);
    formData.append('target_audience', targetAudience);
    formData.append('business_goals', businessGoals);

    // If we have a draft, convert it to active instead of creating new
    if (draftId) {
      formData.append('status', 'active');
      formData.append('is_draft', 'false');
      if (projectConfig.template?.id) {
        formData.append('template_id', projectConfig.template.id);
      }

      const result = await updateProject.mutateAsync({
        id: draftId,
        formData,
      });
      return result.project?.id || draftId;
    }

    // No draft exists, create new project
    const result = await createProject.mutateAsync(formData);
    return result.projectId;
  };

  return {
    create,
    isPending: createProject.isPending || updateProject.isPending,
  };
}
