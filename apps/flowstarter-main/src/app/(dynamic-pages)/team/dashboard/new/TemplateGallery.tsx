'use client';

import { useMemo, useState } from 'react';
import { Check, ExternalLink, X } from 'lucide-react';
import { templateThumbnailUrl } from '@/lib/assets';
import type {
  TemplateFont,
  TemplatePalette,
} from '../components/scaffold/useScaffoldForm';

export interface WizardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  demoUrl?: string;
  palettes: TemplatePalette[];
  fonts: TemplateFont[];
  defaultPaletteId?: string;
  defaultFontId?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'local-business', label: 'Local Business' },
  { id: 'personal-brand', label: 'Personal Brand' },
  { id: 'saas-product', label: 'SaaS / Product' },
];

function formatCategoryLabel(category: string): string {
  return category
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function PalettePreview({ palette }: { palette: TemplatePalette }) {
  return (
    <div className="flex items-center gap-1">
      {Object.values(palette.colors)
        .slice(0, 5)
        .map((color, index) => (
          <span
            key={`${palette.id}-${index}`}
            className="h-3 w-3 rounded-full border border-white/10"
            style={{ backgroundColor: String(color) }}
          />
        ))}
    </div>
  );
}

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
  const previewPalette = template.palettes[0];

  return (
    <button
      onClick={onSelect}
      className={`group relative w-full overflow-hidden rounded-xl border text-left transition-all duration-200 ${
        selected
          ? 'border-[var(--purple)]/60 ring-2 ring-[var(--purple)]/30 shadow-[0_0_20px_rgba(77,93,217,0.20)]'
          : 'border-white/[0.08] hover:border-white/20'
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-white/[0.04]">
        {!imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbUrl}
            alt={template.name}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs text-white/20">{template.name}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 transition-all duration-200 group-hover:bg-black/20" />

        {selected && (
          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--purple)] shadow-lg">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
        )}

        {recommended && !selected && (
          <div className="absolute left-2 top-2 rounded-full bg-[var(--purple)]/90 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            Best match
          </div>
        )}
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-white">
            {template.name}
          </p>
          {template.demoUrl && (
            <a
              href={template.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="shrink-0 rounded-lg p-1 text-white/30 transition-all hover:bg-white/10 hover:text-white/70"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        <p className="text-[0.6875rem] text-white/40">
          {template.categoryLabel}
        </p>
        {previewPalette ? <PalettePreview palette={previewPalette} /> : null}
        <p className="line-clamp-2 text-[0.65rem] leading-relaxed text-white/50">
          {template.description}
        </p>
        {recommended && recommendedReason ? (
          <p className="text-[0.6rem] text-[var(--purple)]/70">
            {recommendedReason}
          </p>
        ) : null}
      </div>
    </button>
  );
}

interface TemplateGalleryProps {
  templates: WizardTemplate[];
  selectedId: string | null;
  recommendedIds?: string[];
  recommendedReasons?: Record<string, string>;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function TemplateGallery({
  templates,
  selectedId,
  recommendedIds = [],
  recommendedReasons = {},
  onSelect,
  onClose,
}: TemplateGalleryProps) {
  const [category, setCategory] = useState<string>('all');
  const [darkMode, setDarkMode] = useState(false);

  const filtered = useMemo(() => {
    const list =
      category === 'all'
        ? templates
        : templates.filter((template) => template.category === category);

    return [
      ...list.filter((template) => recommendedIds.includes(template.id)),
      ...list.filter((template) => !recommendedIds.includes(template.id)),
    ];
  }, [category, recommendedIds, templates]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#08060f]">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-white">Choose a template</h2>
          <p className="text-sm text-white/40">
            {recommendedIds.length > 0
              ? `${recommendedIds.length} recommendations highlighted`
              : 'Browse all templates'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode((current) => !current)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white"
          >
            {darkMode ? 'Light preview' : 'Dark preview'}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] bg-white/[0.06] p-2 text-white/60 transition-all hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-white/[0.07] px-6 py-3">
        {CATEGORIES.map((categoryOption) => (
          <button
            key={categoryOption.id}
            onClick={() => setCategory(categoryOption.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              category === categoryOption.id
                ? 'bg-[var(--purple)] text-white'
                : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            {categoryOption.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selectedId === template.id}
              recommended={recommendedIds.includes(template.id)}
              recommendedReason={recommendedReasons[template.id]}
              onSelect={() => {
                onSelect(template.id);
                onClose();
              }}
              dark={darkMode}
            />
          ))}
        </div>
      </div>

      {selectedId ? (
        <div className="flex shrink-0 items-center justify-between border-t border-white/[0.07] px-6 py-4">
          <p className="text-sm text-white/50">
            Selected:{' '}
            <span className="font-medium text-white">
              {templates.find((template) => template.id === selectedId)?.name}
            </span>
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-[var(--purple)] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[var(--purple)]/90"
          >
            Confirm selection
          </button>
        </div>
      ) : null}
    </div>
  );
}

interface TemplatePickerProps {
  templates: WizardTemplate[];
  selectedId: string | null;
  recommendedIds: string[];
  recommendedReasons?: Record<string, string>;
  onSelect: (id: string) => void;
  onBrowseAll: () => void;
  dark?: boolean;
}

export function TemplatePicker({
  templates,
  selectedId,
  recommendedIds,
  recommendedReasons = {},
  onSelect,
  onBrowseAll,
  dark = false,
}: TemplatePickerProps) {
  const recommended = templates.filter((template) =>
    recommendedIds.slice(0, 3).includes(template.id)
  );
  const displayTemplates =
    recommended.length > 0 ? recommended : templates.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {displayTemplates.map((template) => (
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
        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-sm text-white/50 transition-all hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
      >
        Browse all templates →
      </button>
    </div>
  );
}

export function mapRegistryTemplateToWizardTemplate(template: {
  slug: string;
  name: string;
  description: string;
  category: string;
  palettes: TemplatePalette[];
  fonts: TemplateFont[];
  defaultPaletteId?: string;
  defaultFontId?: string;
}): WizardTemplate {
  return {
    id: template.slug,
    name: template.name,
    description: template.description,
    category: template.category,
    categoryLabel: formatCategoryLabel(template.category),
    palettes: template.palettes,
    fonts: template.fonts,
    defaultPaletteId: template.defaultPaletteId,
    defaultFontId: template.defaultFontId,
  };
}
