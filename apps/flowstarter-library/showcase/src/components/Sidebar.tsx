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
  coaching:  'categories.coaching',
  health:    'categories.health',
  creative:  'categories.creative',
  business:  'categories.business',
  other:     'categories.other',
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
  const allCount = categories.reduce((n, c) => n + c.count, 0);

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-20 space-y-3">

        {/* ── Industry ── */}
        <div className="glass-card px-4 py-4" style={{ borderRadius: '1rem' }}>
          <h3 className="mb-3 text-[0.6rem] font-bold uppercase tracking-[0.24em] text-gray-400 dark:text-white/40">
            Industry
          </h3>
          <div className="space-y-0.5">
            <CategoryRow
              label="All templates"
              count={allCount}
              active={!selectedCategory}
              onClick={() => setSelectedCategory(null)}
            />
            {categories.map(({ name, count }) => (
              <CategoryRow
                key={name}
                label={categoryKeys[name] ? t(categoryKeys[name]) : name}
                count={count}
                active={selectedCategory === name}
                onClick={() => setSelectedCategory(name === selectedCategory ? null : name)}
                capitalize
              />
            ))}
          </div>
        </div>

        {/* ── Features ── */}
        {features.length > 0 ? (
          <div className="glass-card px-4 py-4" style={{ borderRadius: '1rem' }}>
            <h3 className="mb-3 text-[0.6rem] font-bold uppercase tracking-[0.24em] text-gray-400 dark:text-white/40">
              Features
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {features.map((feature) => {
                const on = selectedFeatures.includes(feature);
                return (
                  <button
                    key={feature}
                    onClick={() => toggleFeature(feature)}
                    className={`feature-tag ${on ? 'feature-tag--active' : 'feature-tag--inactive'}`}
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

function CategoryRow({
  label, count, active, onClick, capitalize,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  capitalize?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`sidebar-item ${active ? 'sidebar-item--active' : 'sidebar-item--inactive'} ${capitalize ? 'capitalize' : ''}`}
    >
      <span>{label}</span>
      <span className={`sidebar-badge ${active ? 'sidebar-badge--active' : 'sidebar-badge--inactive'}`}>
        {count}
      </span>
    </button>
  );
}
