import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Monitor, Smartphone, Tablet, X } from 'lucide-react';

export interface PaletteColor {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
}

export interface Palette {
  id: string;
  name: string;
  colors?: PaletteColor;
}

export interface Font {
  id: string;
  name: string;
  heading?: string;
  body?: string;
}

interface TemplateHero {
  headline?: string;
  subheadline?: string;
}

interface Template {
  slug: string;
  name: string;
  description: string;
  thumbnail?: string;
  thumbnailLight?: string;
  thumbnailDark?: string;
  palettes?: Palette[];
  fonts?: Font[];
  hasPreview?: boolean;
  hero?: TemplateHero;
}

interface PreviewModalProps {
  template: Template;
  darkMode: boolean;
  onClose: () => void;
}

type ViewMode = 'desktop' | 'tablet' | 'mobile';

interface ViewModeOption {
  mode: ViewMode;
  label: string;
  icon: IconComponent;
  widthClassName: string;
}

type IconComponent = (props: { className?: string }) => React.JSX.Element;

const MonitorIcon = Monitor as unknown as IconComponent;
const TabletIcon = Tablet as unknown as IconComponent;
const SmartphoneIcon = Smartphone as unknown as IconComponent;
const CloseIcon = X as unknown as IconComponent;
const ExternalLinkIcon = ExternalLink as unknown as IconComponent;

const viewModeOptions: ViewModeOption[] = [
  { mode: 'desktop', label: 'Desktop', icon: MonitorIcon, widthClassName: 'w-full' },
  { mode: 'tablet', label: 'Tablet', icon: TabletIcon, widthClassName: 'mx-auto w-[768px]' },
  { mode: 'mobile', label: 'Mobile', icon: SmartphoneIcon, widthClassName: 'mx-auto w-[390px]' },
];

export function PreviewModal({
  template,
  darkMode,
  onClose,
}: PreviewModalProps): React.ReactElement {
  const [selectedPalette, setSelectedPalette] = useState<Palette | null>(
    template.palettes?.[0] || null,
  );
  const [selectedFont, setSelectedFont] = useState<Font | null>(template.fonts?.[0] || null);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');

  const palettes: Palette[] = template.palettes || [];
  const fonts: Font[] = template.fonts || [];

  useEffect(() => {
    setSelectedPalette(template.palettes?.[0] || null);
    setSelectedFont(template.fonts?.[0] || null);
    setViewMode('desktop');
  }, [template]);

  const handleEscape = useCallback(
    (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [handleEscape]);

  const previewUrl = useMemo((): string => {
    const searchParams = new URLSearchParams();

    if (selectedPalette?.id) {
      searchParams.set('palette', selectedPalette.id);
    }
    if (selectedFont?.id) {
      searchParams.set('font', selectedFont.id);
    }
    searchParams.set('mode', darkMode ? 'dark' : 'light');

    const search = searchParams.toString();
    return `/templates/${template.slug}/${search ? `?${search}` : ''}`;
  }, [darkMode, selectedFont, selectedPalette, template.slug]);

  const fallbackUrl = useMemo((): string => `/templates/${template.slug}/`, [template.slug]);

  const currentViewportClassName =
    viewModeOptions.find((option: ViewModeOption) => option.mode === viewMode)?.widthClassName ||
    'w-full';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md" onClick={onClose} aria-hidden />

      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-white md:max-h-[96vh] md:rounded-3xl md:border md:border-neutral-200 dark:bg-neutral-900 dark:md:border-neutral-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 px-4 py-4 dark:border-neutral-800 md:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-purple-500">
              Live Preview
            </p>
            <h2
              id="preview-title"
              className="truncate font-display text-lg font-bold text-neutral-900 dark:text-white"
            >
              {template.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-700 dark:bg-neutral-800">
              {viewModeOptions.map(({ mode, icon: Icon, label }: ViewModeOption) => {
                const isActive = viewMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    title={label}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
                        : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
              aria-label="Close preview"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 md:px-6">
          {/* Palettes — circles only on mobile, circles+name on md+ */}
          {palettes.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {palettes.map((palette: Palette) => {
                const isActive = selectedPalette?.id === palette.id;
                return (
                  <button
                    key={palette.id}
                    onClick={() => setSelectedPalette(palette)}
                    title={palette.name}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-all md:px-3 md:text-sm ${
                      isActive
                        ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300'
                        : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400'
                    }`}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: palette.colors?.primary || '#8b5cf6' }}
                    />
                    <span className="hidden sm:inline">{palette.name}</span>
                  </button>
                );
              })}
              {fonts.length > 0 && (
                <div className="mx-1 h-5 w-px shrink-0 bg-neutral-200 dark:bg-neutral-700" />
              )}
              {fonts.map((font: Font) => {
                const isActive = selectedFont?.id === font.id;
                return (
                  <button
                    key={font.id}
                    onClick={() => setSelectedFont(font)}
                    className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium transition-colors md:px-3 md:text-sm ${
                      isActive
                        ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300'
                        : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400'
                    }`}
                  >
                    {font.name}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-auto bg-neutral-100 p-3 dark:bg-neutral-950 md:p-5">
          <div className={`${currentViewportClassName} transition-all duration-300`}>
            <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-2xl shadow-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/40">
              <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <div className="ml-3 flex min-w-0 flex-1 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                  <span className="truncate">{previewUrl}</span>
                  <ExternalLinkIcon className="h-3 w-3 shrink-0" />
                </div>
              </div>

              <iframe
                key={previewUrl}
                title={`${template.name} preview`}
                src={previewUrl}
                className="h-[calc(100vh-120px)] w-full bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900 md:px-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
            {selectedPalette ? (
              <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 dark:border-purple-500/30 dark:bg-purple-500/10">
                Palette: <span className="font-semibold text-purple-700 dark:text-purple-300">{selectedPalette.name}</span>
              </span>
            ) : null}
            {selectedFont ? (
              <span className="rounded-full border border-neutral-200 px-3 py-1 dark:border-neutral-700">
                Font: <span className="font-semibold text-neutral-900 dark:text-white">{selectedFont.name}</span>
              </span>
            ) : null}
          </div>

          <a
            href={fallbackUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-colors hover:bg-purple-700"
          >
            Open full preview
            <ExternalLinkIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
