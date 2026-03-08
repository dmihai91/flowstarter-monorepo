'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/lib/i18n';
import { Layers, Search } from 'lucide-react';
import Link from 'next/link';

interface ExamplesEmptyStateProps {
  isFiltered: boolean;
  onClearFilters: () => void;
}

export function ExamplesEmptyState({
  isFiltered,
  onClearFilters,
}: ExamplesEmptyStateProps) {
  const { t } = useTranslations();

  return (
    <Card>
      <CardContent className="py-16 px-6 sm:px-10 text-center relative">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: 'url(/images/grid.svg)' }}
        />
        <div className="relative max-w-xl mx-auto">
          <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Search className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {isFiltered
              ? t('examples.noSitesFound')
              : t('examples.noSitesAvailable')}
          </h3>
          <p className="text-muted-foreground mb-6">
            {isFiltered
              ? 'Try adjusting your filters to find more examples.'
              : 'Check back soon for inspiring examples.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isFiltered ? (
              <Button variant="outline" size="lg" onClick={onClearFilters}>
                {t('examples.clearFilters')}
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link href="/dashboard">
                  <Layers className="h-4 w-4 mr-2" />
                  {t('examples.cta.browseTemplates')}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
