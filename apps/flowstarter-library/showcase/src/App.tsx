import React, { useEffect, useMemo, useState } from 'react';
import { I18nProvider, useTranslation } from './i18n';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { PreviewModal } from './components/PreviewModal';
import { Sidebar } from './components/Sidebar';
import { TemplateCard, TemplateCardSkeleton } from './components/TemplateCard';

interface TemplatePaletteColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
}

interface TemplatePalette {
  id: string;
  name: string;
  colors?: TemplatePaletteColors;
}

interface TemplateFont {
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
  category?: string;
  tags?: string[];
  color: string;
  thumbnail?: string;
  thumbnailLight?: string;
  thumbnailDark?: string;
  palettes?: TemplatePalette[];
  fonts?: TemplateFont[];
  features?: string[];
  hasPreview?: boolean;
  hero?: TemplateHero;
}

interface CategoryCount {
  name: string;
  count: number;
}

type ThemeMode = 'light' | 'dark' | 'auto';

function isTemplateArray(value: unknown): value is Template[] {
  return Array.isArray(value);
}

function AppContent(): React.ReactElement {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const cookieMatch = document.cookie.split(';').map(c => c.trim())
        .find(c => c.startsWith('flowstarter_theme='));
      const cookieVal = cookieMatch?.split('=')[1];
      if (cookieVal === 'dark') return 'dark';
      if (cookieVal === 'light') return 'light';
      if (cookieVal === 'system') return 'auto';
      const ls = localStorage.getItem('theme') || localStorage.getItem('flowstarter_theme');
      if (ls === 'light' || ls === 'dark' || ls === 'auto') return ls;
    }
    return 'auto';
  });
  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [scrolled, setScrolled] = useState(false);

  const darkMode = themeMode === 'auto' ? systemDark : themeMode === 'dark';

  // Scroll tracking for header glassmorphism (matching main platform)
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = useMemo((): CategoryCount[] => {
    const counts = new Map<string, number>();
    templates.forEach((template: Template) => {
      const categoryName = template.category || 'other';
      counts.set(categoryName, (counts.get(categoryName) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]: [string, number]) => ({ name, count }))
      .sort((left: CategoryCount, right: CategoryCount) => right.count - left.count);
  }, [templates]);

  const availableFeatures = useMemo((): string[] => {
    const featureSet = new Set<string>();
    templates.forEach((template: Template) => {
      template.features?.forEach((feature: string) => featureSet.add(feature));
    });
    return Array.from(featureSet).sort((left: string, right: string) => left.localeCompare(right));
  }, [templates]);

  const filteredTemplates = useMemo((): Template[] => {
    let filtered = templates;
    if (selectedCategory) {
      filtered = filtered.filter(
        (template: Template) => (template.category || 'other') === selectedCategory,
      );
    }
    if (selectedFeatures.length > 0) {
      filtered = filtered.filter((template: Template) =>
        selectedFeatures.every((feature: string) => template.features?.includes(feature)),
      );
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((template: Template) => {
        const nameMatches = template.name.toLowerCase().includes(query);
        const descriptionMatches = template.description.toLowerCase().includes(query);
        const tagMatches =
          template.tags?.some((tag: string) => tag.toLowerCase().includes(query)) || false;
        return nameMatches || descriptionMatches || tagMatches;
      });
    }
    return filtered;
  }, [templates, selectedCategory, selectedFeatures, searchQuery]);

  useEffect(() => {
    const val = themeMode === 'auto' ? 'system' : themeMode;
    const h = window.location.hostname;
    const domain = h.includes('flowstarter.dev') ? '; domain=.flowstarter.dev'
                 : h.includes('flowstarter.app') ? '; domain=.flowstarter.app' : '';
    document.cookie = `flowstarter_theme=${val}; path=/; max-age=31536000; SameSite=Lax${domain}`;
    localStorage.setItem('theme', themeMode);
    localStorage.setItem('flowstarter_theme', val);
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent): void => {
      setSystemDark(event.matches);
    };
    setSystemDark(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    async function loadTemplates(): Promise<void> {
      const endpoints: string[] = ['/api/templates', '/api/templates.json'];
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint);
          if (!response.ok) continue;
          const payload: unknown = await response.json();
          if (isTemplateArray(payload)) {
            setTemplates(payload);
            setError(null);
            return;
          }
        } catch {
          // Continue to the fallback endpoint.
        }
      }
      setError(t('errors.loadFailed'));
    }
    loadTemplates().finally(() => setLoading(false));
  }, [t]);

  const toggleFeature = (feature: string): void => {
    setSelectedFeatures((previousFeatures: string[]) =>
      previousFeatures.includes(feature)
        ? previousFeatures.filter((currentFeature: string) => currentFeature !== feature)
        : [...previousFeatures, feature],
    );
  };

  const clearAllFilters = (): void => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedFeatures([]);
  };

  return (
    <div className="relative min-h-screen text-gray-900 dark:text-white">
      {/* FlowBackground — page-level, behind all content.
          It renders with position:absolute inset:0 z-index:-1 and paints its own base bg color. */}
      {/* @ts-expect-error FlowBackground props mismatch */}
      <FlowBackground variant="landing" animated style={{ position: 'fixed', zIndex: 0 }} />

      {/* All content above the background */}
      <div className="relative" style={{ zIndex: 1 }}>
      <Header
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        darkMode={darkMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        features={availableFeatures}
        selectedFeatures={selectedFeatures}
        toggleFeature={toggleFeature}
        scrolled={scrolled}
      />

      <Hero templateCount={templates.length} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex gap-8 items-start">
          <Sidebar
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            features={availableFeatures}
            selectedFeatures={selectedFeatures}
            toggleFeature={toggleFeature}
          />

          <div className="min-w-0 flex-1">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.26em] text-gray-400 dark:text-white/40">
                  Curated Selection
                </p>
                <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {filteredTemplates.length} {filteredTemplates.length === 1 ? 'Template' : 'Templates'}
                  {selectedCategory ? (
                    <span className="ml-2 text-lg font-medium capitalize text-gray-400 dark:text-white/40">
                      in {selectedCategory}
                    </span>
                  ) : null}
                </h2>
              </div>

              {(selectedCategory || selectedFeatures.length > 0 || searchQuery) ? (
                <button
                  onClick={clearAllFilters}
                  className="text-sm font-semibold transition-colors hover:opacity-75"
                  style={{ color: 'var(--purple)' }}
                >
                  ✕ Clear filters
                </button>
              ) : null}
            </div>

            {error ? (
              <div className="glass-card px-6 py-16 text-center" style={{ borderRadius: '1.5rem' }}>
                <p className="font-medium text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : null}

            {!loading && !error && filteredTemplates.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center gap-4 py-20">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl"
                  style={{
                    background: 'color-mix(in srgb, var(--purple) 8%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--purple) 15%, transparent)',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
                <p className="font-medium text-gray-500 dark:text-white/50">No templates found</p>
                <button
                  onClick={clearAllFilters}
                  className="text-sm font-semibold transition-opacity hover:opacity-75"
                  style={{ color: 'var(--purple)' }}
                >
                  Clear filters
                </button>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }).map((_: unknown, index: number) => (
                    <TemplateCardSkeleton key={`skeleton-${index}`} />
                  ))
                : filteredTemplates.map((template: Template, index: number) => (
                    <TemplateCard
                      key={template.slug}
                      template={template}
                      darkMode={darkMode}
                      onPreview={setPreviewTemplate}
                      index={index}
                    />
                  ))}
            </div>
          </div>
        </div>
      </main>

      <Footer darkMode={darkMode} />

      {previewTemplate ? (
        <PreviewModal
          template={previewTemplate}
          darkMode={darkMode}
          onClose={() => setPreviewTemplate(null)}
        />
      ) : null}
      </div>{/* end content wrapper */}
    </div>
  );
}

function App(): React.ReactElement {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

export default App;
