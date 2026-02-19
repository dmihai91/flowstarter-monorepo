'use client';

import { useTranslations } from '@/lib/i18n';
import { useWizardStore } from '@/store/wizard-store';
import type { ProjectTemplate } from '@/types/project-types';
import { Sparkles, User } from 'lucide-react';
import { WizardCardContent } from '../WizardCard';
import { TemplateCard } from './TemplateCard';

type TemplateGridProps = {
  filteredTemplates: ProjectTemplate[];
  recommendedTemplates: ProjectTemplate[];
  otherTemplates: ProjectTemplate[];
  activeCategory: string;
  selectedTemplateId: string;
  recommendedCategories: string[];
  myTemplates?: ProjectTemplate[];
  onSelectTemplateAction: (template: ProjectTemplate) => void;
  clearFiltersAction: () => void;
};

export function TemplateGrid({
  filteredTemplates,
  recommendedTemplates,
  otherTemplates,
  activeCategory,
  selectedTemplateId,
  recommendedCategories,
  myTemplates = [],
  onSelectTemplateAction,
  clearFiltersAction,
}: TemplateGridProps) {
  const { t } = useTranslations();
  const projectConfig = useWizardStore((state) => state.projectConfig);

  return (
    <WizardCardContent className="!py-6 rounded-b-[24px]">
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('wizard.template.noTemplatesFound')}
          </p>
          <button
            onClick={clearFiltersAction}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 dark:bg-gray-700 text-white dark:text-white hover:bg-gray-800 dark:hover:bg-gray-600 transition-all"
          >
            {t('wizard.template.clearAllFilters')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* My Templates - Highest Priority */}
          {myTemplates.length > 0 && activeCategory === 'all' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5" style={{ color: 'var(--blue)' }} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('wizard.template.myTemplates')}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                {myTemplates.map((template) => {
                  const isSelected = selectedTemplateId === template.id;
                  return (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={isSelected}
                      isRecommended={false}
                      showRecommendedBadge={false}
                      onSelectAction={onSelectTemplateAction}
                      projectConfig={projectConfig}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Templates - Second Priority */}
          {recommendedTemplates.length > 0 && activeCategory === 'all' && (
            <div id="recommended-templates">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('wizard.template.recommendedForYou')}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                {recommendedTemplates.map((template) => {
                  const isSelected = selectedTemplateId === template.id;
                  const categoryId =
                    typeof template.category === 'string'
                      ? template.category
                      : template.category.id;
                  const isRecommended =
                    recommendedCategories.includes(categoryId);
                  return (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={isSelected}
                      isRecommended={isRecommended}
                      showRecommendedBadge={true}
                      onSelectAction={onSelectTemplateAction}
                      projectConfig={projectConfig}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Flowstarter Library - Third Priority */}
          {((otherTemplates.length > 0 && activeCategory === 'all') ||
            activeCategory !== 'all') && (
            <div>
              {(recommendedTemplates.length > 0 || myTemplates.length > 0) &&
                activeCategory === 'all' && (
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {t('wizard.template.flowstarterLibrary')}
                  </h3>
                )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                {(activeCategory === 'all'
                  ? otherTemplates
                  : filteredTemplates
                ).map((template) => {
                  const isSelected = selectedTemplateId === template.id;
                  const categoryId =
                    typeof template.category === 'string'
                      ? template.category
                      : template.category.id;
                  const isRecommended =
                    recommendedCategories.includes(categoryId);
                  return (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={isSelected}
                      isRecommended={isRecommended}
                      showRecommendedBadge={activeCategory !== 'all'}
                      onSelectAction={onSelectTemplateAction}
                      projectConfig={projectConfig}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </WizardCardContent>
  );
}
