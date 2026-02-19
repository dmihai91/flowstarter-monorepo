import React, { useCallback, useEffect, useState } from 'react';
import { X, Check, Palette, Type, ExternalLink, Monitor, Tablet, Smartphone } from 'lucide-react';

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
  hero?: {
    headline?: string;
    subheadline?: string;
  };
}

interface PreviewModalProps {
  template: Template;
  darkMode: boolean;
  onClose: () => void;
}

type ViewMode = 'desktop' | 'tablet' | 'mobile';
type ActiveTab = 'preview' | 'palettes' | 'fonts';

export function PreviewModal({ template, darkMode, onClose }: PreviewModalProps) {
  const [selectedPalette, setSelectedPalette] = useState<Palette | null>(
    template.palettes?.[0] || null
  );
  const [selectedFont, setSelectedFont] = useState<Font | null>(
    template.fonts?.[0] || null
  );
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [activeTab, setActiveTab] = useState<ActiveTab>('preview');
  const [imageLoaded, setImageLoaded] = useState(false);

  const palettes = template.palettes || [];
  const fonts = template.fonts || [];

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [handleEscape]);

  const thumbnailUrl = darkMode 
    ? (template.thumbnailDark || template.thumbnail)
    : (template.thumbnailLight || template.thumbnail);

  const viewportSizes = {
    desktop: 'w-full',
    tablet: 'w-[768px] mx-auto',
    mobile: 'w-[375px] mx-auto',
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal - Full screen on mobile, large on desktop */}
      <div
        className="relative flex flex-col w-full h-full md:m-4 md:rounded-2xl bg-white dark:bg-surface-900 overflow-hidden animate-fade-in md:max-w-[95vw] md:max-h-[95vh] md:mx-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-surface-200 dark:border-surface-700 shrink-0 bg-surface-50 dark:bg-surface-800/50">
          <div className="flex items-center gap-4">
            {/* Template info */}
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: selectedPalette?.colors?.primary || '#3b82f6' }}
              >
                {template.name.charAt(0)}
              </div>
              <div>
                <h2 id="preview-title" className="font-display text-lg font-semibold text-surface-900 dark:text-white">
                  {template.name}
                </h2>
                <p className="text-xs text-surface-500 dark:text-surface-400 hidden sm:block">
                  {template.description.slice(0, 60)}...
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Viewport toggles */}
            <div className="hidden md:flex items-center gap-1 bg-surface-100 dark:bg-surface-700 rounded-lg p-1">
              {[
                { mode: 'desktop' as ViewMode, icon: Monitor, label: 'Desktop' },
                { mode: 'tablet' as ViewMode, icon: Tablet, label: 'Tablet' },
                { mode: 'mobile' as ViewMode, icon: Smartphone, label: 'Mobile' },
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-white shadow-sm'
                      : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                  }`}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Tab toggles */}
            <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('palettes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'palettes'
                    ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-white shadow-sm'
                    : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Colors</span>
              </button>
              <button
                onClick={() => setActiveTab('fonts')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'fonts'
                    ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-white shadow-sm'
                    : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                }`}
              >
                <Type className="w-4 h-4" />
                <span className="hidden sm:inline">Fonts</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors ml-2"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Preview area */}
          <div className="flex-1 bg-surface-100 dark:bg-surface-800 p-4 md:p-6 overflow-auto">
            <div className={`${viewportSizes[viewMode]} transition-all duration-300`}>
              {/* Preview card - shows thumbnail with palette overlay */}
              <div 
                className="relative bg-white dark:bg-surface-900 rounded-xl shadow-2xl overflow-hidden"
                style={{
                  '--preview-primary': selectedPalette?.colors?.primary || '#3b82f6',
                  '--preview-secondary': selectedPalette?.colors?.secondary || '#1e40af',
                  '--preview-accent': selectedPalette?.colors?.accent || '#dbeafe',
                } as React.CSSProperties}
              >
                {/* Mock browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white dark:bg-surface-700 rounded-md px-3 py-1.5 text-xs text-surface-500 dark:text-surface-400 flex items-center gap-2">
                      <span className="truncate">https://{template.slug}.flowstarter.app</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Preview content */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  {thumbnailUrl ? (
                    <>
                      {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-surface-100 dark:bg-surface-800">
                          <div className="w-8 h-8 border-2 border-surface-300 dark:border-surface-600 border-t-brand-500 rounded-full animate-spin" />
                        </div>
                      )}
                      <img
                        src={thumbnailUrl}
                        alt={template.name}
                        className={`w-full h-full object-cover object-top transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImageLoaded(true)}
                      />
                      {/* Color overlay hint */}
                      <div 
                        className="absolute inset-0 opacity-10 pointer-events-none transition-colors duration-500"
                        style={{ 
                          background: `linear-gradient(135deg, ${selectedPalette?.colors?.primary || '#3b82f6'}40, ${selectedPalette?.colors?.secondary || '#1e40af'}30)`
                        }}
                      />
                    </>
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ 
                        background: `linear-gradient(135deg, ${selectedPalette?.colors?.accent || '#dbeafe'}, ${selectedPalette?.colors?.primary || '#3b82f6'}20)`
                      }}
                    >
                      <div className="text-center p-8">
                        <div 
                          className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold"
                          style={{ backgroundColor: selectedPalette?.colors?.primary || '#3b82f6' }}
                        >
                          {template.name.charAt(0)}
                        </div>
                        <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                          {template.hero?.headline || template.name}
                        </h3>
                        <p className="text-surface-600 dark:text-surface-400 text-sm max-w-md">
                          {template.hero?.subheadline || template.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Side panel for palettes/fonts */}
          <div className={`w-80 border-l border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-y-auto shrink-0 transition-all duration-300 ${
            activeTab === 'preview' ? 'hidden md:block' : 'block'
          }`}>
            {activeTab === 'palettes' && (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Color Palettes
                </h3>
                <div className="space-y-3">
                  {palettes.map((palette) => (
                    <button
                      key={palette.id}
                      onClick={() => setSelectedPalette(palette)}
                      className={`w-full p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedPalette?.id === palette.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                          : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-surface-900 dark:text-white">
                          {palette.name}
                        </span>
                        {selectedPalette?.id === palette.id && (
                          <Check className="w-4 h-4 text-brand-500" />
                        )}
                      </div>
                      <div className="flex gap-1 rounded-lg overflow-hidden">
                        {['primary', 'secondary', 'accent'].map((key) => (
                          <div
                            key={key}
                            className="h-8 flex-1 first:rounded-l-md last:rounded-r-md"
                            style={{ backgroundColor: palette.colors?.[key as keyof PaletteColor] || '#e5e7eb' }}
                            title={`${key}: ${palette.colors?.[key as keyof PaletteColor]}`}
                          />
                        ))}
                      </div>
                      <div className="flex gap-1 mt-2">
                        {['background', 'text'].map((key) => (
                          <div
                            key={key}
                            className="h-4 flex-1 rounded border border-surface-200 dark:border-surface-600"
                            style={{ backgroundColor: palette.colors?.[key as keyof PaletteColor] || '#ffffff' }}
                            title={`${key}: ${palette.colors?.[key as keyof PaletteColor]}`}
                          />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'fonts' && (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Font Pairings
                </h3>
                <div className="space-y-3">
                  {fonts.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setSelectedFont(font)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedFont?.id === font.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                          : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-surface-900 dark:text-white">
                          {font.name}
                        </span>
                        {selectedFont?.id === font.id && (
                          <Check className="w-4 h-4 text-brand-500" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div 
                          className="text-lg font-semibold text-surface-900 dark:text-white"
                          style={{ fontFamily: font.heading || 'inherit' }}
                        >
                          Heading Font
                        </div>
                        <div 
                          className="text-sm text-surface-600 dark:text-surface-400"
                          style={{ fontFamily: font.body || 'inherit' }}
                        >
                          Body text appears like this
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with selected options */}
        <div className="px-4 md:px-6 py-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {selectedPalette && (
                <div className="flex items-center gap-2">
                  <span className="text-surface-500 dark:text-surface-400">Palette:</span>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-surface-700 rounded-md border border-surface-200 dark:border-surface-600">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: selectedPalette.colors?.primary }}
                    />
                    <span className="font-medium text-surface-900 dark:text-white">{selectedPalette.name}</span>
                  </div>
                </div>
              )}
              {selectedFont && (
                <div className="flex items-center gap-2">
                  <span className="text-surface-500 dark:text-surface-400">Font:</span>
                  <span className="font-medium text-surface-900 dark:text-white">{selectedFont.name}</span>
                </div>
              )}
            </div>
            <button
              className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              Use This Template
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
