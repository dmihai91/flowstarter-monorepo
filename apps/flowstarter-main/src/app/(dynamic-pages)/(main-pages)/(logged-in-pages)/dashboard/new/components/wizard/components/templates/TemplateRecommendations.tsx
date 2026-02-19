'use client';

import { projectTemplates } from '@/data/project-templates';
import { useTranslations } from '@/lib/i18n';
import { getRecommendedTemplates } from '@/lib/template-recommendations';
import { useWizardStore } from '@/store/wizard-store';
import type { ProjectConfig } from '@/types/project-config';
import type { ProjectTemplate } from '@/types/project-types';
import { Palette } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  WizardCard,
  WizardCardContent,
  WizardCardHeader,
  WizardCardHeaderContent,
} from '../WizardCard';
import { TemplateCard } from './TemplateCard';

interface TemplateRecommendationsProps {
  projectConfig: ProjectConfig;
  selectedTemplateId: string;
  onSelectTemplate: (template: ProjectTemplate) => void;
  onBrowseAll?: () => void;
  initialAvailableIds?: string[];
}

const fetchLocalTemplates = async (): Promise<string[]> => {
  try {
    const r = await fetch('/api/local-templates');
    const json = (await r.json()) as { templates: { id: string }[] };
    return json.templates?.map((t) => t.id) || [];
  } catch {
    return [];
  }
};

export function TemplateRecommendations({
  projectConfig,
  selectedTemplateId,
  onSelectTemplate,
  initialAvailableIds,
}: TemplateRecommendationsProps) {
  const { t } = useTranslations();
  const projectConfigState = useWizardStore((s) => s.projectConfig);
  const [availableIds, setAvailableIds] = useState<string[]>(
    initialAvailableIds || []
  );
  const [isLoading, setIsLoading] = useState(!initialAvailableIds?.length);

  // Determine if we have project details to base recommendations on
  // If we have details, show recommendations. If not, show all templates (gallery mode).
  const hasProjectDetails = Boolean(
    projectConfig.name?.trim() ||
      projectConfig.description?.trim() ||
      projectConfig.targetUsers?.trim() ||
      projectConfig.designConfig?.businessInfo?.industry
  );
  const isGalleryMode = !hasProjectDetails;

  // Fetch templates client-side if not provided
  useEffect(() => {
    if (initialAvailableIds && initialAvailableIds.length > 0) {
      setAvailableIds(initialAvailableIds);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    fetchLocalTemplates()
      .then((ids) => {
        if (!mounted) return;
        setAvailableIds(ids);
        setIsLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [initialAvailableIds]);

  // Get ONLY templates that actually exist in the filesystem
  const allValidTemplates = useMemo(() => {
    if (isLoading || availableIds.length === 0) {
      return [];
    }
    const availableSet = new Set(availableIds);
    return projectTemplates.filter(
      (t) => t.status === 'published' && availableSet.has(t.id)
    );
  }, [availableIds, isLoading]);

  // Get recommended template IDs for sorting (only if they exist in filesystem)
  // Skip recommendations in gallery mode - show all templates equally
  const recommendedTemplateIds = useMemo(() => {
    if (isGalleryMode || availableIds.length === 0) {
      return new Set<string>();
    }
    const availableSet = new Set(availableIds);
    const recommendations = getRecommendedTemplates(projectConfig, 10);
    // Only include recommendations that actually exist
    return new Set(
      recommendations
        .filter(({ template }) => availableSet.has(template.id))
        .map(({ template }) => template.id)
    );
  }, [projectConfig, availableIds, isGalleryMode]);

  // Split templates into recommended and others
  const { recommendedTemplates, otherTemplates } = useMemo(() => {
    const recommended: ProjectTemplate[] = [];
    const others: ProjectTemplate[] = [];

    allValidTemplates.forEach((template) => {
      if (recommendedTemplateIds.has(template.id)) {
        recommended.push(template);
      } else {
        others.push(template);
      }
    });

    return {
      recommendedTemplates: recommended,
      otherTemplates: others,
    };
  }, [allValidTemplates, recommendedTemplateIds]);

  const hasTemplates = allValidTemplates.length > 0;
  const hasRecommended = recommendedTemplates.length > 0;
  const hasOthers = otherTemplates.length > 0;

  return (
    <WizardCard maxWidth="large">
      <WizardCardHeader background="var(--wizard-section-template-bg)">
        <WizardCardHeaderContent
          title={t('wizard.chooseSiteStructure.title')}
          description={t('wizard.chooseSiteStructure.description')}
        />
      </WizardCardHeader>
      <WizardCardContent className="py-6">
        {/* Welcome Message */}
        <div className="mb-8">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {isGalleryMode
              ? t('wizard.template.chooseYourTemplate')
              : t('wizard.recommendations.allSetChooseTemplate')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isGalleryMode
              ? 'Browse all available templates and pick the one that best fits your needs.'
              : 'Select a template that matches your vision, or start from scratch and build something unique.'}
          </p>
        </div>

        {/* Templates Gallery */}
        {isLoading ? (
          <div className="text-center py-6 mb-4">
            <p className="text-gray-600 dark:text-gray-400">
              Loading templates...
            </p>
          </div>
        ) : hasTemplates ? (
          <div className="mb-4 space-y-4">
            {/* Recommended Templates Section - only show in non-gallery mode */}
            {!isGalleryMode && hasRecommended && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {t('wizard.template.recommendedForYou')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={selectedTemplateId === template.id}
                      isRecommended={true}
                      showRecommendedBadge={true}
                      onSelectAction={onSelectTemplate}
                      projectConfig={projectConfigState}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Templates Section */}
            {(isGalleryMode || hasOthers) && (
              <div>
                {!isGalleryMode && hasRecommended && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 mb-8" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      {t('wizard.template.allTemplates')}
                    </h3>
                  </>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(isGalleryMode ? allValidTemplates : otherTemplates).map(
                    (template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        isSelected={selectedTemplateId === template.id}
                        isRecommended={false}
                        showRecommendedBadge={false}
                        onSelectAction={onSelectTemplate}
                        projectConfig={projectConfigState}
                      />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 mb-10">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No templates available at the moment.
            </p>
          </div>
        )}

        {/* Start from Scratch Section */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't see what you're looking for? Start with a blank canvas and
              build your website from scratch.
            </p>
            <button
              onClick={() => {
                const store = useWizardStore.getState();
                const setTemplatePath = store.setTemplatePath;
                const setProjectConfig = store.setProjectConfig;
                const currentConfig = store.projectConfig;

                // Set blank template for scratch mode
                setProjectConfig({
                  ...currentConfig,
                  template: {
                    id: 'scratch',
                    name: 'Start from Scratch',
                    description: 'Build your website from scratch',
                    category: 'custom',
                    features: [],
                    complexity: 'simple',
                  },
                });
                setTemplatePath('scratch');
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-[var(--surface-2)] text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-[var(--surface-3)] transition-colors font-medium"
            >
              <Palette className="h-4 w-4" />
              {t('wizard.scratch.startBlank')}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              {t('wizard.scratch.helperText')}
            </p>
          </div>
        </div>
      </WizardCardContent>
    </WizardCard>
  );
}
