'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, GlassPanel, Input, Spinner } from '@flowstarter/flow-design-system';

interface Template {
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  features: string[];
  thumbnailUrl: string;
}

interface TemplatePickerProps {
  onSelect: (template: Template) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  education: 'Education',
  fitness: 'Fitness',
  beauty: 'Beauty',
  coaching: 'Coaching',
  'mental-health': 'Mental Health',
  wellness: 'Wellness',
  creative: 'Creative',
};

export function TemplatePicker({ onSelect, onClose }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    fetch('/api/editor/templates')
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Get unique categories from templates
  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category));
    return ['all', ...Array.from(cats).sort()];
  }, [templates]);

  // Filter templates
  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (category !== 'all' && t.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [templates, search, category]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <GlassPanel
        shadow="elevated"
        padding="none"
        className="w-full max-w-5xl max-h-[85vh] flex flex-col bg-[var(--flow-bg-secondary)] border border-[var(--flow-border-default)] rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--flow-border-default)]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--flow-text-primary)]">
              Choose a Template
            </h2>
            <p className="text-sm text-[var(--flow-text-tertiary)] mt-0.5">
              Pick a starting point, then customize with AI
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--flow-text-muted)] hover:text-[var(--flow-text-primary)] transition-colors p-1"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-6 py-3 border-b border-[var(--flow-border-default)] flex flex-col sm:flex-row gap-3">
          <Input
            variant="filled"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  category === cat
                    ? 'bg-[var(--flow-accent-purple)] text-white'
                    : 'bg-[var(--flow-bg-tertiary)] text-[var(--flow-text-secondary)] hover:bg-[var(--flow-bg-elevated)]'
                }`}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--flow-text-tertiary)]">
                No templates found{search ? ` for "${search}"` : ''}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((template) => (
                <TemplateCard
                  key={template.slug}
                  template={template}
                  onSelect={() => onSelect(template)}
                />
              ))}
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: Template;
  onSelect: () => void;
}) {
  return (
    <Card
      variant="outline"
      hoverable
      className="group bg-[var(--flow-bg-secondary)] border-[var(--flow-border-default)] hover:border-[var(--flow-accent-purple)]/50 transition-all cursor-pointer overflow-hidden"
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="aspect-[16/10] bg-[var(--flow-bg-tertiary)] overflow-hidden">
        <img
          src={template.thumbnailUrl}
          alt={template.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-sm font-semibold text-[var(--flow-text-primary)] truncate">
            {template.name}
          </h3>
          <span className="shrink-0 px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-[var(--flow-bg-tertiary)] text-[var(--flow-text-tertiary)]">
            {CATEGORY_LABELS[template.category] || template.category}
          </span>
        </div>
        <p className="text-xs text-[var(--flow-text-tertiary)] line-clamp-2 mb-3">
          {template.description}
        </p>
        <div className="flex flex-wrap gap-1">
          {template.features.slice(0, 3).map((feature) => (
            <span
              key={feature}
              className="px-1.5 py-0.5 rounded text-[0.625rem] text-[var(--flow-text-muted)] bg-[var(--flow-bg-primary)]"
            >
              {feature}
            </span>
          ))}
          {template.features.length > 3 && (
            <span className="px-1.5 py-0.5 text-[0.625rem] text-[var(--flow-text-muted)]">
              +{template.features.length - 3}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
