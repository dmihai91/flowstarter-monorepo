import React from 'react';
import { useTranslation } from '../i18n';

interface Category {
  name: string;
  count: number;
}

interface SidebarProps {
  categories: Category[];
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  features: string[];
  selectedFeatures: string[];
  toggleFeature: (feature: string) => void;
}

const categoryKeys: Record<string, string> = {
  education: 'categories.education',
  coaching: 'categories.coaching',
  health: 'categories.health',
  creative: 'categories.creative',
  business: 'categories.business',
  other: 'categories.other',
};

export function Sidebar({
  categories,
  selectedCategory,
  setSelectedCategory,
  features,
  selectedFeatures,
  toggleFeature,
}: SidebarProps): React.ReactElement {
  const { t } = useTranslation();
  const allTemplatesCount = categories.reduce(
    (total: number, category: Category) => total + category.count,
    0,
  );

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-20 space-y-4">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-900">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            Industry
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300'
                  : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800'
              }`}
            >
              <span>All templates</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  !selectedCategory
                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                }`}
              >
                {allTemplatesCount}
              </span>
            </button>

            {categories.map(({ name, count }: Category) => (
              <button
                key={name}
                onClick={() => setSelectedCategory(name === selectedCategory ? null : name)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  selectedCategory === name
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300'
                    : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800'
                }`}
              >
                <span>{categoryKeys[name] ? t(categoryKeys[name]) : name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    selectedCategory === name
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
                      : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {features.length > 0 ? (
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-900">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              Features
            </h3>
            <div className="flex flex-wrap gap-2">
              {features.map((feature: string) => {
                const isSelected = selectedFeatures.includes(feature);

                return (
                  <button
                    key={feature}
                    onClick={() => toggleFeature(feature)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-purple-200 bg-purple-100 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-300'
                        : 'border-transparent bg-neutral-100 text-neutral-600 hover:border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600'
                    }`}
                  >
                    {feature}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
