import React, { useEffect, useState, useMemo } from 'react';
import { I18nProvider, useTranslation } from './i18n';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TemplateCard, TemplateCardSkeleton } from './components/TemplateCard';
import { PreviewModal } from './components/PreviewModal';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';

interface Template {
  slug: string;
  name: string;
  description: string;
  category?: string;
  tags?: string[];
  color: string;
  thumbnail: string;
  thumbnailLight?: string;
  thumbnailDark?: string;
  palettes?: Array<{
    id: string;
    name: string;
    colors?: { primary?: string; secondary?: string; accent?: string; background?: string; text?: string };
  }>;
  fonts?: Array<{ id: string; name: string; heading?: string; body?: string }>;
  features?: string[];
  hasPreview?: boolean;
  hero?: {
    headline?: string;
    subheadline?: string;
  };
}

type ThemeMode = 'light' | 'dark' | 'auto';

function AppContent(): React.ReactElement {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as ThemeMode | null;
      if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored;
    }
    return 'auto';
  });

  const getSystemPreference = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const [systemDark, setSystemDark] = useState(getSystemPreference);
  const darkMode = themeMode === 'auto' ? systemDark : themeMode === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Get unique categories from templates
  const categories = useMemo(() => {
    const cats = new Map<string, number>();
    templates.forEach((t) => {
      const cat = t.category || 'other';
      cats.set(cat, (cats.get(cat) || 0) + 1);
    });
    return Array.from(cats.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [templates]);

  // Get unique features from templates
  const availableFeatures = useMemo(() => {
    const features = new Set<string>();
    templates.forEach((t) => {
      t.features?.forEach((f) => features.add(f));
    });
    return Array.from(features).sort();
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((t) => (t.category || 'other') === selectedCategory);
    }

    // Feature filters
    if (selectedFeatures.length > 0) {
      filtered = filtered.filter((t) =>
        selectedFeatures.every((f) => t.features?.includes(f))
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [templates, searchQuery, selectedCategory, selectedFeatures]);

  useEffect(() => {
    localStorage.setItem('theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setSystemDark(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    // Try API first, fall back to static JSON
    const fetchTemplates = async () => {
      try {
        // Try the MCP server API first
        const apiRes = await fetch('/api/templates');
        if (apiRes.ok) {
          const data = await apiRes.json();
          setTemplates(data || []);
          return;
        }
      } catch {
        // API failed, try static JSON
      }

      try {
        // Fall back to static JSON
        const staticRes = await fetch('/api/templates.json');
        if (staticRes.ok) {
          const data = await staticRes.json();
          setTemplates(data || []);
          return;
        }
      } catch {
        // Static also failed
      }

      setError(t('errors.loadFailed'));
    };

    fetchTemplates().finally(() => setLoading(false));
  }, [t]);

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-100 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 text-surface-900 dark:text-surface-100 transition-colors duration-300">
      <Header
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        darkMode={darkMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Hero Section */}
      <Hero templateCount={templates.length} />

      {/* Main Content with Sidebar */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex gap-8">
          {/* Sidebar */}
          <Sidebar
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            features={availableFeatures}
            selectedFeatures={selectedFeatures}
            toggleFeature={toggleFeature}
            darkMode={darkMode}
          />

          {/* Template Grid */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                {filteredTemplates.length} {filteredTemplates.length === 1 ? 'Template' : 'Templates'}
                {selectedCategory && (
                  <span className="font-normal text-surface-500 dark:text-surface-400">
                    {' '}in {selectedCategory}
                  </span>
                )}
              </h2>
              {(selectedCategory || selectedFeatures.length > 0) && (
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedFeatures([]);
                  }}
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="text-center py-16 px-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                <p className="text-red-600 dark:text-red-400 font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filteredTemplates.length === 0 && (
              <div className="text-center py-20 px-6 rounded-2xl bg-surface-100 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700/50">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
                  <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-surface-600 dark:text-surface-400 font-medium">
                  No templates found
                </p>
                <p className="text-surface-500 dark:text-surface-500 text-sm mt-1">
                  Try adjusting your filters or search query
                </p>
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TemplateCardSkeleton key={i} darkMode={darkMode} />
                ))}
              {!loading &&
                filteredTemplates.map((template, i) => (
                  <div
                    key={template.slug}
                    className="animate-fade-up opacity-0"
                    style={{ animationDelay: `${i * 0.05}s` }}
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

      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          darkMode={darkMode}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
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
