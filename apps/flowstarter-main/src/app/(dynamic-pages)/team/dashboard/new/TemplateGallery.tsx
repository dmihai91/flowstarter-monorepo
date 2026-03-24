'use client';

import { useState, useMemo } from 'react';
import { Check, X, Sparkles, ExternalLink } from 'lucide-react';
import { templateThumbnailUrl } from '@/lib/assets';

// ── Template data ──────────────────────────────────────────────────────────────

export interface WizardTemplate {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  demoUrl?: string;
}

const TEMPLATES: WizardTemplate[] = [
  { id: 'local-business-1',       name: 'Local Business',         category: 'local-business',   categoryLabel: 'Local Business' },
  { id: 'local-business-2',       name: 'Local Business 2',       category: 'local-business',   categoryLabel: 'Local Business' },
  { id: 'local-business-pro',     name: 'Local Business Pro',     category: 'local-business',   categoryLabel: 'Local Business' },
  { id: 'personal-brand-1',       name: 'Personal Brand',         category: 'personal-brand',   categoryLabel: 'Personal Brand' },
  { id: 'personal-brand-2',       name: 'Personal Brand 2',       category: 'personal-brand',   categoryLabel: 'Personal Brand' },
  { id: 'personal-brand-pro',     name: 'Personal Brand Pro',     category: 'personal-brand',   categoryLabel: 'Personal Brand' },
  { id: 'saas-product-launch-1',  name: 'SaaS Launch',            category: 'saas-product',     categoryLabel: 'SaaS / Product' },
  { id: 'saas-product-launch-2',  name: 'SaaS Launch 2',          category: 'saas-product',     categoryLabel: 'SaaS / Product' },
  { id: 'saas-product-pro',       name: 'SaaS Pro',               category: 'saas-product',     categoryLabel: 'SaaS / Product' },
  { id: 'coach-pro',              name: 'Coach Pro',              category: 'personal-brand',   categoryLabel: 'Personal Brand' },
  { id: 'fitness-coach',          name: 'Fitness Coach',          category: 'local-business',   categoryLabel: 'Local Business' },
  { id: 'beauty-stylist',         name: 'Beauty Stylist',         category: 'local-business',   categoryLabel: 'Local Business' },
  { id: 'therapist-care',         name: 'Therapist Care',         category: 'local-business',   categoryLabel: 'Local Business' },
  { id: 'academic-tutor',         name: 'Academic Tutor',         category: 'personal-brand',   categoryLabel: 'Personal Brand' },
  { id: 'creative-portfolio',     name: 'Creative Portfolio',     category: 'personal-brand',   categoryLabel: 'Personal Brand' },
];

const CATEGORIES = [
  { id: 'all',            label: 'All' },
  { id: 'local-business', label: 'Local Business' },
  { id: 'personal-brand', label: 'Personal Brand' },
  { id: 'saas-product',   label: 'SaaS / Product' },
];

// ── Template card ──────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  selected,
  recommended,
  recommendedReason,
  onSelect,
  dark = false,
}: {
  template: WizardTemplate;
  selected: boolean;
  recommended?: boolean;
  recommendedReason?: string;
  onSelect: () => void;
  dark?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const thumbUrl = templateThumbnailUrl(template.id, dark);

  return (
    <button
      onClick={onSelect}
      className={`
        group relative w-full rounded-xl overflow-hidden border text-left transition-all duration-200
        ${selected
          ? 'border-[var(--purple)]/60 ring-2 ring-[var(--purple)]/30 shadow-[0_0_20px_rgba(77,93,217,0.20)]'
          : 'border-white/[0.08] hover:border-white/20'}
      `}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] bg-white/[0.04] overflow-hidden">
        {!imgError ? (
          <img
            src={thumbUrl}
            alt={template.name}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-white/20">{template.name}</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />

        {/* Selected check */}
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--purple)] flex items-center justify-center shadow-lg">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}

        {/* AI Best match badge */}
        {recommended && !selected && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-[var(--purple)]/90 backdrop-blur-sm text-white text-[0.6rem] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
            <Sparkles className="w-2.5 h-2.5" />
            Best match
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white truncate">{template.name}</p>
          {template.demoUrl && (
            <a
              href={template.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="shrink-0 p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        <p className="text-[0.6875rem] text-white/40 mt-0.5">{template.categoryLabel}</p>
        {recommended && recommendedReason && (
          <p className="text-[0.6rem] text-[var(--purple)]/70 mt-1 leading-relaxed">{recommendedReason}</p>
        )}
      </div>
    </button>
  );
}

// ── Main gallery ───────────────────────────────────────────────────────────────

interface TemplateGalleryProps {
  selectedId: string | null;
  recommendedIds?: string[];
  recommendedReasons?: Record<string, string>;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function TemplateGallery({
  selectedId,
  recommendedIds = [],
  recommendedReasons = {},
  onSelect,
  onClose,
}: TemplateGalleryProps) {
  const [category, setCategory] = useState<string>('all');
  const [darkMode, setDarkMode] = useState(false);

  const filtered = useMemo(() => {
    const list = category === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.category === category);
    // Recommended first
    return [
      ...list.filter(t => recommendedIds.includes(t.id)),
      ...list.filter(t => !recommendedIds.includes(t.id)),
    ];
  }, [category, recommendedIds]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#08060f]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white">Choose a template</h2>
          <p className="text-sm text-white/40">
            {recommendedIds.length > 0
              ? `${recommendedIds.length} AI recommendations highlighted`
              : 'Browse all templates'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Dark/light toggle */}
          <button
            onClick={() => setDarkMode(d => !d)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            {darkMode ? 'Light preview' : 'Dark preview'}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-white/[0.07] shrink-0 overflow-x-auto">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`
              shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full transition-all
              ${category === cat.id
                ? 'bg-[var(--purple)] text-white'
                : 'bg-white/[0.05] text-white/50 hover:text-white hover:bg-white/[0.08]'}
            `}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selectedId === template.id}
              recommended={recommendedIds.includes(template.id)}
              recommendedReason={recommendedReasons[template.id]}
              onSelect={() => { onSelect(template.id); onClose(); }}
              dark={darkMode}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      {selectedId && (
        <div className="px-6 py-4 border-t border-white/[0.07] shrink-0 flex items-center justify-between">
          <p className="text-sm text-white/50">
            Selected: <span className="text-white font-medium">
              {TEMPLATES.find(t => t.id === selectedId)?.name}
            </span>
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[var(--purple)] text-white text-sm font-semibold hover:bg-[var(--purple)]/90 transition-all"
          >
            Confirm selection
          </button>
        </div>
      )}
    </div>
  );
}

// ── Compact 3-card picker (shown inline in wizard) ────────────────────────────

interface TemplatePickerProps {
  selectedId: string | null;
  recommendedIds: string[];
  recommendedReasons?: Record<string, string>;
  onSelect: (id: string) => void;
  onBrowseAll: () => void;
  dark?: boolean;
}

export function TemplatePicker({
  selectedId,
  recommendedIds,
  recommendedReasons = {},
  onSelect,
  onBrowseAll,
  dark = false,
}: TemplatePickerProps) {
  const topThree = TEMPLATES.filter(t => recommendedIds.slice(0, 3).includes(t.id));
  const displayTemplates = topThree.length > 0
    ? topThree
    : TEMPLATES.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {displayTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            selected={selectedId === template.id}
            recommended={recommendedIds.includes(template.id)}
            recommendedReason={recommendedReasons[template.id]}
            onSelect={() => onSelect(template.id)}
            dark={dark}
          />
        ))}
      </div>

      <button
        onClick={onBrowseAll}
        className="w-full py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white/50 hover:text-white hover:bg-white/[0.06] hover:border-white/15 transition-all"
      >
        Browse all templates →
      </button>
    </div>
  );
}

export { TEMPLATES };
