import React, { useMemo, useState } from 'react';
import { GlassCard, Button } from '@flowstarter/flow-design-system';

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
  return category
    .split('-')
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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
  const [imageError, setImageError] = useState<boolean>(false);

  const thumbnailUrl = darkMode
    ? template.thumbnailDark || template.thumbnail
    : template.thumbnailLight || template.thumbnail;

  const palettes: Palette[] = template.palettes || [];
  const swatches: string[] = useMemo(() => {
    const paletteSwatches = palettes
      .slice(0, 6)
      .map((p: Palette) => p.colors?.primary)
      .filter((c: string | undefined): c is string => Boolean(c));
    return paletteSwatches.length > 0 ? paletteSwatches : [template.color || '#8b5cf6'];
  }, [palettes, template.color]);

  return (
    <GlassCard noHover={false} className="!p-0 overflow-hidden rounded-2xl flex flex-col group cursor-default">
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {thumbnailUrl && !imageError ? (
          <img
            src={thumbnailUrl}
            alt={template.name}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`h-full w-full object-cover object-left-top transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : null}

        {!imageLoaded || imageError ? (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700" />
        ) : null}

        {template.category ? (
          <div className="absolute left-3 top-3 rounded-full border border-neutral-200/50 bg-white/90 px-2.5 py-1 text-xs font-semibold capitalize text-neutral-700 shadow-sm backdrop-blur-sm dark:border-neutral-700/50 dark:bg-neutral-900/90 dark:text-neutral-200">
            {formatCategoryLabel(template.category)}
          </div>
        ) : null}

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
      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        <div>
          <h3 className="mb-1 text-base font-bold leading-tight text-neutral-900 dark:text-white font-display">
            {template.name}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {template.description}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="mr-0.5 text-xs text-neutral-400 dark:text-neutral-500">Palettes:</span>
          {swatches.map((color: string, index: number) => (
            <div
              key={`${template.slug}-swatch-${index}`}
              className="h-4 w-4 rounded-full border-2 border-white shadow-sm ring-1 ring-neutral-200 transition-transform hover:scale-125 dark:border-neutral-900 dark:ring-neutral-700"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(template)}
            icon={<PlayIcon />}
            iconPosition="left"
            className="flex-1"
          >
            Preview
          </Button>
          <Button
            variant="brand-gradient"
            size="sm"
            icon={<ArrowIcon />}
            iconPosition="right"
            className="flex-1"
          >
            Use Template
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

export function TemplateCardSkeleton(): React.ReactElement {
  return (
    <GlassCard noHover className="overflow-hidden rounded-2xl">
      <div className="aspect-[16/10] animate-pulse bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700" />
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
    </GlassCard>
  );
}
