'use client';

import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/lib/i18n';
import type { ProjectTemplate } from '@/types/project-types';
import { Sparkles } from 'lucide-react';
import { TemplateCard } from './wizard/components/templates/TemplateCard';

type TemplateGridProps = {
  filteredTemplates: ProjectTemplate[];
  recommendedTemplates: ProjectTemplate[];
  otherTemplates: ProjectTemplate[];
  activeCategory: string;
  selectedTemplateId: string;
  recommendedCategories: string[];
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
  onSelectTemplateAction,
  clearFiltersAction,
}: TemplateGridProps) {
  const { t } = useTranslations();

  return (
    <Card>
      {filteredTemplates.length === 0 ? (
        <CardContent className="py-6 px-8 space-y-6 bg-card-foreground rounded-xl">
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
        </CardContent>
      ) : (
        <CardContent className="py-6 px-8 space-y-6 bg-card-foreground rounded-b-xl">
          {recommendedTemplates.length > 0 && activeCategory === 'all' && (
            <Card>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('wizard.template.recommendedForYou')}
                  </CardTitle>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {((otherTemplates.length > 0 && activeCategory === 'all') ||
            activeCategory !== 'all') && (
            <div>
              {recommendedTemplates.length > 0 && activeCategory === 'all' && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {t('wizard.template.otherTemplates')}
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    />
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
