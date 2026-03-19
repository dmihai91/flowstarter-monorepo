import React, { useMemo, useState } from 'react';

export interface PaletteColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
}

export interface Palette {
  id: string;
  name: string;
  colors?: PaletteColors;
}

interface TemplateFont {
  id: string;
  name: string;
  heading?: string;
  body?: string;
}

interface Template {
  slug: string;
  name: string;
  description: string;
  category?: string;
  color: string;
  thumbnail?: string;
  thumbnailLight?: string;
  thumbnailDark?: string;
  palettes?: Palette[];
  fonts?: TemplateFont[];
  features?: string[];
  tags?: string[];
}

interface TemplateCardProps {
  template: Template;
  darkMode: boolean;
  onPreview: (template: Template) => void;
}

function formatCategoryLabel(category: string): string {
  return category.split('-').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}

export function TemplateCard({ template, darkMode, onPreview }: TemplateCardProps): React.ReactElement {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError]   = useState<boolean>(false);

  const thumbnailUrl = darkMode
    ? template.thumbnailDark  || template.thumbnail
    : template.thumbnailLight || template.thumbnail;

  const swatches: string[] = useMemo(() => {
    const palettes = template.palettes || [];
    const colors = palettes.slice(0, 6).map((p: Palette) => p.colors?.primary).filter((c): c is string => Boolean(c));
    return colors.length > 0 ? colors : [template.color || '#8b5cf6'];
  }, [template.palettes, template.color]);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-white/95 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-[2px] hover:border-purple-500/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] dark:hover:border-purple-500/30 dark:hover:shadow-[0_12px_40px_rgba(124,58,237,0.15)]">

      {/* Thumbnail — full bleed, no padding */}
      <div className="relative w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800" style={{ aspectRatio: '16/10' }}>
        {thumbnailUrl && !imageError ? (
          <img
            src={thumbnailUrl}
            alt={template.name}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`h-full w-full object-cover object-left-top transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : null}

        {(!imageLoaded || imageError) ? (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700" />
        ) : null}

        {template.category ? (
          <div className="absolute left-3 top-3 rounded-full border border-neutral-200/50 bg-white/90 px-2.5 py-1 text-xs font-semibold capitalize text-neutral-700 shadow-sm backdrop-blur-sm dark:border-neutral-700/50 dark:bg-neutral-900/90 dark:text-neutral-200">
            {formatCategoryLabel(template.category)}
          </div>
        ) : null}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            onClick={() => onPreview(template)}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 shadow-lg transition-colors hover:bg-neutral-50"
          >
            <PlayIcon />
            Preview
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="mb-1 text-base font-bold leading-tight text-neutral-900 dark:text-white">
            {template.name}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {template.description}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="mr-0.5 text-xs text-neutral-400 dark:text-neutral-500">Palettes:</span>
          {swatches.map((color: string, i: number) => (
            <div
              key={`${template.slug}-sw-${i}`}
              className="h-4 w-4 rounded-full border-2 border-white shadow-sm ring-1 ring-neutral-200 transition-transform hover:scale-125 dark:border-neutral-900 dark:ring-neutral-700"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <button
            onClick={() => onPreview(template)}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-neutral-600"
          >
            <PlayIcon /> Preview
          </button>
          <button
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700"
          >
            Use Template <ArrowIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TemplateCardSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-white/95 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="w-full animate-pulse bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700" style={{ aspectRatio: '16/10' }} />
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-full animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
        <div className="h-4 w-4/5 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_: unknown, i: number) => (
            <div key={i} className="h-4 w-4 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="h-10 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <div className="h-10 animate-pulse rounded-lg bg-purple-200/60 dark:bg-purple-500/20" />
        </div>
      </div>
    </div>
  );
}
