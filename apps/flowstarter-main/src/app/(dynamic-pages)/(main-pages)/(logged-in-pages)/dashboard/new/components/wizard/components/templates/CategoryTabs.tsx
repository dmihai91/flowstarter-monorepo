'use client';

import { projectCategories } from '@/data/project-templates';
import { useTranslations } from '@/lib/i18n';
import { Sparkles } from 'lucide-react';

type CategoryTabsProps = {
  activeCategory: string;
  onChangeAction: (categoryId: string) => void;
  recommendedCategories: string[];
  categoryCounts?: Record<string, number>;
  totalCount?: number;
};

export function CategoryTabs({
  activeCategory,
  onChangeAction,
  recommendedCategories,
  categoryCounts = {},
  totalCount = 0,
}: CategoryTabsProps) {
  const { t } = useTranslations();

  return (
    <div className="flex flex-wrap gap-2.5 items-center py-1">
      <button
        onClick={() => onChangeAction('all')}
        className={`px-3 py-1 rounded-xl text-[0.85rem] font-medium transition-colors border ${
          activeCategory === 'all'
            ? 'bg-gray-900 text-white border-gray-900/40 shadow-sm dark:bg-white dark:text-gray-900 dark:border-white/60'
            : 'bg-white/90 dark:bg-[var(--surface-2)] text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-[var(--surface-3)]'
        }`}
        role="tab"
        aria-selected={activeCategory === 'all'}
        tabIndex={0}
      >
        {t('wizard.template.all')} ({totalCount})
      </button>
      {projectCategories.map((category) => {
        const isRecommended = recommendedCategories.includes(category.id);
        return (
          <button
            key={category.id}
            onClick={() => onChangeAction(category.id)}
            className={`px-3 py-1 rounded-xl text-[0.85rem] font-medium transition-colors flex items-center gap-1 border ${
              activeCategory === category.id
                ? 'bg-gray-900 text-white border-gray-900/40 shadow-sm dark:bg-white dark:text-gray-900 dark:border-white/60'
                : 'bg-white/90 dark:bg-[var(--surface-2)] text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-[var(--surface-3)]'
            }`}
            role="tab"
            aria-selected={activeCategory === category.id}
            tabIndex={0}
          >
            {category.name} ({categoryCounts[category.id] || 0})
            {isRecommended && <Sparkles className="h-3 w-3 text-yellow-500" />}
          </button>
        );
      })}
    </div>
  );
}
