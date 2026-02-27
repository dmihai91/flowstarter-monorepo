'use client';

import { PageContainer } from '@/components/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { useExampleSites } from '@/hooks/useExampleSites';
import { useTranslations } from '@/lib/i18n';
import { useState, useMemo } from 'react';
import { ExamplesEmptyState } from './components/ExamplesEmptyState';
import { ExamplesFilters } from './components/ExamplesFilters';
import { ExamplesHeader } from './components/ExamplesHeader';
import { ExampleSiteCard } from './components/ExampleSiteCard';

export default function ExampleSitesPage() {
  const { t } = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [showFeatured, setShowFeatured] = useState(false);

  // Use React Query hook with filters
  const filters = useMemo(
    () => ({
      category: selectedCategory,
      industry: selectedIndustry,
      search: searchQuery,
      featured: showFeatured,
    }),
    [selectedCategory, selectedIndustry, searchQuery, showFeatured]
  );

  const { data, isLoading, error } = useExampleSites(filters);

  const sites = data?.sites ?? [];
  const categories = data?.categories ?? [];
  const industries = data?.industries ?? [];

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
        {isLoading ? (
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
                {error instanceof Error ? error.message : 'Failed to load example sites'}.{' '}
                {t('examples.pleaseTryAgain')}
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
