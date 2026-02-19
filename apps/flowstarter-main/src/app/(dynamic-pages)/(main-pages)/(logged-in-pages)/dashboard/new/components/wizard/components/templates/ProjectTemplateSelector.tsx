'use client';

import { projectTemplates } from '@/data/project-templates';
import { useTemplateSelector } from '@/hooks/wizard/useTemplateSelector';
import { useTranslations } from '@/lib/i18n';
import { useWizardStore } from '@/store/wizard-store';
import type { ProjectTemplate } from '@/types/project-types';
import { Check } from 'lucide-react';
import { useMemo } from 'react';
import { WizardCard, WizardCardHeader } from '../WizardCard';
import { CategoryTabs } from './CategoryTabs';
import { TemplateGrid } from './TemplateGrid';

interface ProjectTemplateSelectorProps {
  onSelectTemplateAction: (template: ProjectTemplate) => void;
  selectedTemplateId: string;
  projectIndustry?: string;
  initialAvailableIds?: string[];
}

export default function ProjectTemplateSelector({
  onSelectTemplateAction,
  selectedTemplateId,
  projectIndustry,
  initialAvailableIds,
}: ProjectTemplateSelectorProps) {
  const { t } = useTranslations();
  const currentStep = useWizardStore((s) => s.currentStep);
  const showAssistantTransition = useWizardStore(
    (s) => s.showAssistantTransition
  );
  const projectConfig = useWizardStore((s) => s.projectConfig);

  // Determine if we're in gallery mode based on whether we have project details
  const hasProjectDetails = Boolean(
    projectConfig.name?.trim() ||
      projectConfig.description?.trim() ||
      projectConfig.targetUsers?.trim()
  );

  // Only show "Choose Template" text when in gallery mode (no project details filled)
  const isActuallyBrowsingTemplates =
    currentStep === 'template' &&
    !showAssistantTransition &&
    !hasProjectDetails;
  const {
    activeCategory,
    setActiveCategory,
    filteredTemplates,
    recommendedTemplates,
    otherTemplates,
    recommendedCategories,
    clearFilters,
    categoryCounts,
    totalCount,
  } = useTemplateSelector(projectIndustry, initialAvailableIds);

  // Find the selected template
  const selectedTemplate = useMemo(() => {
    return projectTemplates.find((t) => t.id === selectedTemplateId);
  }, [selectedTemplateId]);

  return (
    <WizardCard maxWidth="large">
      {/* Header with Filter Tabs */}
      <WizardCardHeader background="var(--wizard-section-template-bg)">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-1">
          <div className="flex-1">
            <h3
              className="text-[1.2rem] font-bold mb-1 uppercase tracking-tight"
              style={{ color: 'var(--wizard-header-text)' }}
            >
              {isActuallyBrowsingTemplates
                ? t('wizard.template.chooseYourTemplate')
                : t('wizard.template.chooseYourStructure')}
            </h3>
            <p
              className="text-sm opacity-90 mb-3"
              style={{ color: 'var(--wizard-header-text)' }}
            >
              {isActuallyBrowsingTemplates
                ? t('wizard.template.tagline')
                : t('wizard.template.taglineStructure')}
            </p>
          </div>
          {selectedTemplate && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-gray-950/70 border border-white/60 dark:border-gray-800 text-gray-900 dark:text-gray-200 shadow-sm shrink-0">
              <Check className="h-3.5 w-3.5 text-gray-900 dark:text-gray-200" />
              <span className="text-xs font-medium whitespace-nowrap">
                {t('wizard.template.selected')}: {selectedTemplate.name}
              </span>
            </div>
          )}
        </div>

        {/* Templates count */}
        <div className="mb-4 text-sm text-white/90 dark:text-gray-800 font-normal">
          {t('wizard.template.templatesAvailable', {
            count: filteredTemplates.length,
          })}
        </div>

        {/* Category Tabs */}
        <CategoryTabs
          activeCategory={activeCategory}
          onChangeAction={setActiveCategory}
          recommendedCategories={recommendedCategories}
          categoryCounts={categoryCounts}
          totalCount={totalCount}
        />
      </WizardCardHeader>

      {/* Template Grid */}
      <TemplateGrid
        filteredTemplates={filteredTemplates}
        recommendedTemplates={recommendedTemplates}
        otherTemplates={otherTemplates}
        activeCategory={activeCategory}
        selectedTemplateId={selectedTemplateId}
        recommendedCategories={recommendedCategories}
        onSelectTemplateAction={onSelectTemplateAction}
        clearFiltersAction={clearFilters}
      />
    </WizardCard>
  );
}
