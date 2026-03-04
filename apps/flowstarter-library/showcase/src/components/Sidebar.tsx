import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
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
  darkMode: boolean;
}

const categoryKeys: Record<string, string> = {
  education: 'categories.education',
  coaching: 'categories.coaching',
  health: 'categories.health',
  creative: 'categories.creative',
  business: 'categories.business',
  other: 'categories.other',
};

const categoryIcons: Record<string, string> = {
  education: '📚',
  coaching: '🎯',
  health: '💚',
  creative: '🎨',
  business: '💼',
  other: '✨',
};

export function Sidebar({
  categories,
  selectedCategory,
  setSelectedCategory,
  features,
  selectedFeatures,
  toggleFeature,
  darkMode,
}: SidebarProps) {
  const { t } = useTranslation();

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24 space-y-6">
        {/* Categories */}
        <div className="bg-white dark:bg-surface-800/50 rounded-2xl border border-surface-200 dark:border-surface-700/50 p-4">
          <button
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white">
              {t('sidebar.categories')}
            </h3>
            <ChevronDown className="w-4 h-4 text-surface-400" />
          </button>
          
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === null
                  ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 font-medium'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🌟</span>
                <span>{t('sidebar.allTemplates')}</span>
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                selectedCategory === null
                  ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
              }`}>
                {categories.reduce((sum, c) => sum + c.count, 0)}
              </span>
            </button>
            
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === category.name
                    ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 font-medium'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{categoryIcons[category.name] || '📁'}</span>
                  <span>{categoryKeys[category.name] ? t(categoryKeys[category.name]) : category.name}</span>
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedCategory === category.name
                    ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
                }`}>
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-surface-800/50 rounded-2xl border border-surface-200 dark:border-surface-700/50 p-4">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">
            {t('sidebar.features')}
          </h3>
          
          <div className="space-y-2">
            {features.slice(0, 8).map((feature) => (
              <label
                key={feature}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  selectedFeatures.includes(feature)
                    ? 'bg-brand-500 border-brand-500'
                    : 'border-surface-300 dark:border-surface-600 group-hover:border-brand-400'
                }`}>
                  {selectedFeatures.includes(feature) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className={`text-sm transition-colors ${
                  selectedFeatures.includes(feature)
                    ? 'text-surface-900 dark:text-white font-medium'
                    : 'text-surface-600 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-white'
                }`}>
                  {feature}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Pro tip */}
        <div className="bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-950/30 dark:to-brand-900/20 rounded-2xl border border-brand-200/50 dark:border-brand-800/30 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500/10 dark:bg-brand-400/10 flex items-center justify-center shrink-0">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <p className="text-sm font-medium text-brand-900 dark:text-brand-100">
                {t('sidebar.proTip')}
              </p>
              <p className="text-xs text-brand-700 dark:text-brand-300 mt-1">
                {t('sidebar.proTipDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
