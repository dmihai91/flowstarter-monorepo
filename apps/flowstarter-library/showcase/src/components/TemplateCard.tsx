import React, { useEffect, useMemo, useRef, useState } from 'react';

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
  index?: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; shadow: string }> = {
  education:       { bg: '#2563EB', shadow: 'rgba(37,99,235,0.30)' },
  beauty:          { bg: '#DB2777', shadow: 'rgba(219,39,119,0.30)' },
  coaching:        { bg: '#D97706', shadow: 'rgba(217,119,6,0.30)' },
  health:          { bg: '#059669', shadow: 'rgba(5,150,105,0.30)' },
  wellness:        { bg: '#0891B2', shadow: 'rgba(8,145,178,0.30)' },
  creative:        { bg: '#7C3AED', shadow: 'rgba(124,58,237,0.30)' },
  business:        { bg: '#1E293B', shadow: 'rgba(30,41,59,0.30)' },
  fitness:         { bg: '#DC2626', shadow: 'rgba(220,38,38,0.30)' },
  'mental-health': { bg: '#0891B2', shadow: 'rgba(8,145,178,0.30)' },
};
const DEFAULT_CATEGORY_COLOR = { bg: '#52525B', shadow: 'rgba(82,82,91,0.25)' };

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category.toLowerCase()] ?? DEFAULT_CATEGORY_COLOR;
}

function formatCategoryLabel(category: string): string {
  return category.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

export function TemplateCard({ template, darkMode, onPreview, index = 0 }: TemplateCardProps): React.ReactElement {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError]   = useState(false);
  const [isVisible, setIsVisible]     = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const thumbnailUrl = darkMode
    ? template.thumbnailDark  || template.thumbnail
    : template.thumbnailLight || template.thumbnail;

  const swatches: string[] = useMemo(() => {
    const palettes = template.palettes || [];
    const colors = palettes.slice(0, 6).map((p) => p.colors?.primary).filter((c): c is string => Boolean(c));
    return colors.length > 0 ? colors : [template.color || '#8b5cf6'];
  }, [template.palettes, template.color]);

  const catColor = template.category ? getCategoryColor(template.category) : DEFAULT_CATEGORY_COLOR;

  // Scroll-reveal via IntersectionObserver
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`card-enter ${isVisible ? 'is-visible' : ''}`}
      style={{ animationDelay: `${(index % 6) * 0.06}s` }}
    >
      <div className="template-card group cursor-pointer" onClick={() => onPreview(template)}>
        {/* Thumbnail */}
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: '16/10' }}
        >
          {thumbnailUrl && !imageError ? (
            <img
              src={thumbnailUrl}
              alt={template.name}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`h-full w-full object-cover object-left-top transition-transform duration-500 group-hover:scale-[1.04] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          ) : null}

          {(!imageLoaded || imageError) && (
            <div className="absolute inset-0 animate-pulse bg-gray-100 dark:bg-white/[0.04]" />
          )}

          {/* Category badge */}
          {template.category && (
            <div
              className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold capitalize text-white"
              style={{
                background: catColor.bg,
                boxShadow: `0 2px 8px ${catColor.shadow}`,
                letterSpacing: '0.01em',
              }}
            >
              {formatCategoryLabel(template.category)}
            </div>
          )}

          {/* Hover overlay — just darkened with Preview button */}
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(2px)' }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(template); }}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-xl transition-all hover:scale-105"
            >
              <PlayIcon />
              Preview
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h3 className="mb-1 text-base font-bold leading-tight text-gray-900 dark:text-white">
              {template.name}
            </h3>
            <p className="line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-white/50">
              {template.description}
            </p>
          </div>

          {/* Palette swatches */}
          <div className="flex items-center gap-1.5">
            <span className="mr-0.5 text-xs text-gray-400 dark:text-white/40">Palettes:</span>
            {swatches.map((color, i) => (
              <div
                key={`${template.slug}-sw-${i}`}
                className="h-4 w-4 rounded-full transition-transform hover:scale-125"
                style={{
                  backgroundColor: color,
                  border: `2px solid ${darkMode ? 'rgba(255,255,255,0.12)' : '#fff'}`,
                  boxShadow: `0 0 0 1px ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'}`,
                }}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-auto flex items-center gap-2 pt-1">
            {/* Preview — ghost */}
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(template); }}
              className="btn-ghost flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold whitespace-nowrap"
            >
              <PlayIcon /> Preview
            </button>
            {/* Use — brand gradient */}
            <a
              href={`${import.meta.env.VITE_APP_URL ?? 'https://flowstarter.dev'}/new?template=${template.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="btn-brand flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold whitespace-nowrap text-white no-underline"
            >
              Use Template <ArrowIcon />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TemplateCardSkeleton(): React.ReactElement {
  return (
    <div className="template-card">
      <div className="w-full animate-pulse bg-gray-100 dark:bg-white/[0.04]" style={{ aspectRatio: '16/10' }} />
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded-lg bg-gray-200 dark:bg-white/[0.06]" />
        <div className="h-4 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.04]" />
        <div className="h-4 w-4/5 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.04]" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-4 animate-pulse rounded-full bg-gray-200 dark:bg-white/[0.06]" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="h-10 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.04]" />
          <div className="h-10 animate-pulse rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(77,93,217,0.25), rgba(124,58,237,0.18))' }} />
        </div>
      </div>
    </div>
  );
}
