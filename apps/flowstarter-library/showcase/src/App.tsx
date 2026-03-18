import React, { useEffect, useMemo, useState } from 'react';
import { I18nProvider, useTranslation } from './i18n';
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
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'auto') {
        return storedTheme;
      }
    }
    return 'auto';
  });
  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const darkMode = themeMode === 'auto' ? systemDark : themeMode === 'dark';

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
    localStorage.setItem('theme', themeMode);
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

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    async function loadTemplates(): Promise<void> {
      const endpoints: string[] = ['/api/templates', '/api/templates.json'];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint);
          if (!response.ok) {
            continue;
          }

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
    <div className="relative min-h-screen overflow-hidden bg-neutral-50 text-neutral-900 transition-colors duration-300 dark:bg-neutral-950 dark:text-white">
      <div className="absolute inset-0 flow-grid-bg" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-purple-500/5 blur-3xl dark:bg-purple-500/10" />
      </div>

      <div className="relative z-10">
        <Header
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <Hero templateCount={templates.length} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
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
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400 dark:text-neutral-500">
                    Curated Selection
                  </p>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {filteredTemplates.length} {filteredTemplates.length === 1 ? 'Template' : 'Templates'}
                    {selectedCategory ? (
                      <span className="ml-2 text-lg font-medium text-neutral-400 dark:text-neutral-500">
                        in {selectedCategory}
                      </span>
                    ) : null}
                  </h2>
                </div>

                {(selectedCategory || selectedFeatures.length > 0 || searchQuery) ? (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm font-semibold text-purple-600 transition-colors hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>

              {error ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-16 text-center dark:border-red-900/60 dark:bg-red-950/30">
                  <p className="font-medium text-red-600 dark:text-red-400">{error}</p>
                </div>
              ) : null}

              {!loading && !error && filteredTemplates.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center gap-4 py-20">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-2xl dark:bg-neutral-800">
                    🔍
                  </div>
                  <p className="font-medium text-neutral-500 dark:text-neutral-400">No templates found</p>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm font-semibold text-purple-600 hover:underline dark:text-purple-400"
                  >
                    Clear filters
                  </button>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {loading
                  ? Array.from({ length: 6 }).map((_: unknown, index: number) => (
                      <TemplateCardSkeleton key={`skeleton-${index}`} />
                    ))
                  : filteredTemplates.map((template: Template, index: number) => (
                      <div
                        key={template.slug}
                        className="animate-fade-up opacity-0"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <TemplateCard
                          template={template}
                          darkMode={darkMode}
                          onPreview={setPreviewTemplate}
                        />
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </main>

        <Footer />

        {previewTemplate ? (
          <PreviewModal
            template={previewTemplate}
            darkMode={darkMode}
            onClose={() => setPreviewTemplate(null)}
          />
        ) : null}
      </div>
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
