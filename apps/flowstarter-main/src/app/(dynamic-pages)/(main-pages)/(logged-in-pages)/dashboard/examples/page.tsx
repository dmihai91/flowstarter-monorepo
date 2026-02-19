'use client';

import { PageContainer } from '@/components/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { ExampleSite } from '@/data/example-sites';
import { useTranslations } from '@/lib/i18n';
import { useCallback, useEffect, useState } from 'react';
import { ExamplesEmptyState } from './components/ExamplesEmptyState';
import { ExamplesFilters } from './components/ExamplesFilters';
import { ExamplesHeader } from './components/ExamplesHeader';
import { ExampleSiteCard } from './components/ExampleSiteCard';

export default function ExampleSitesPage() {
  const { t } = useTranslations();
  const [sites, setSites] = useState<ExampleSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [showFeatured, setShowFeatured] = useState(false);
  const [categories, setCategories] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [industries, setIndustries] = useState<string[]>([]);

  const fetchSites = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (selectedCategory && selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }
      if (selectedIndustry && selectedIndustry !== 'All Industries') {
        params.set('industry', selectedIndustry);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      if (showFeatured) {
        params.set('featured', 'true');
      }

      const response = await fetch(`/api/example-sites?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch example sites');
      }

      const data = await response.json();
      setSites(data.sites || []);
      setCategories(data.categories || []);
      setIndustries(data.industries || []);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load example sites'
      );
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedIndustry, searchQuery, showFeatured]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const hasActiveFilters =
    !!searchQuery ||
    selectedCategory !== 'all' ||
    selectedIndustry !== 'All Industries' ||
    showFeatured;

  return (
    <PageContainer gradientVariant="dashboard">
      <div className="space-y-6">
        {/* Header */}
        <ExamplesHeader />

        {/* Filters */}
        <Card>
          <CardContent className="py-6">
            <ExamplesFilters
              categories={categories}
              industries={industries}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              selectedIndustry={selectedIndustry}
              showFeatured={showFeatured}
              onSearchChange={handleSearch}
              onCategoryChange={setSelectedCategory}
              onIndustryChange={setSelectedIndustry}
              onFeaturedToggle={() => setShowFeatured(!showFeatured)}
            />
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i}>
                <div className="w-full space-y-4">
                  <Skeleton className="h-48 w-full rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </SkeletonCard>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {error}. {t('examples.pleaseTryAgain')}
              </p>
            </CardContent>
          </Card>
        ) : sites.length === 0 ? (
          <ExamplesEmptyState
            isFiltered={hasActiveFilters}
            onClearFilters={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedIndustry('All Industries');
              setShowFeatured(false);
            }}
          />
        ) : (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                {sites.length}{' '}
                {t('examples.sitesFound', {
                  plural: sites.length === 1 ? '' : 's',
                })}
              </p>
            </div>

            {/* Sites Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {sites.map((site) => (
                <ExampleSiteCard key={site.id} site={site} />
              ))}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
