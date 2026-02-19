'use client';

import { ErrorPageLayout } from '@/components/ErrorPageLayout';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { setIsErrorPageFlag, useErrorPage } from '@/contexts/ErrorPageContext';
import { useTranslations } from '@/lib/i18n';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';

// Now can use translations because ErrorBoundary wraps this with providers
export function ErrorFallback() {
  const { t } = useTranslations();
  const { setIsErrorPage } = useErrorPage();

  // Set error page flag synchronously to hide navbar immediately
  // This ensures NavigationWrapper sees it on first render
  setIsErrorPageFlag(true);

  useEffect(() => {
    // Cleanup when component unmounts
    return () => {
      setIsErrorPage(false);
    };
  }, [setIsErrorPage]);

  return (
    <ErrorPageLayout>
      <GlassCard className="p-10!">
        <div className="text-center">
          {/* Error Icon */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-[24px] bg-gradient-to-br from-black/10 to-black/10 dark:from-white/10 dark:to-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-black/20 dark:ring-white/30">
            <AlertTriangle className="h-12 w-12 text-black dark:text-white" />
          </div>

          {/* Error Title */}
          <div className="mb-4">
            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
              style={{ color: 'var(--copy-headlines)' }}
            >
              {t('error.title')}
            </h1>
          </div>

          {/* Description */}
          <p
            className="text-lg mb-8 leading-relaxed max-w-xl mx-auto"
            style={{ color: 'var(--copy-body)' }}
          >
            {t('error.subtitle')}
          </p>

          {/* Status Alert */}
          <div className="mb-8 p-4 bg-black/5 dark:bg-white/10 border-2 border-black/20 dark:border-white/30 rounded-lg text-left backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-black dark:text-white mt-0.5 shrink-0" />
              <p className="text-sm" style={{ color: 'var(--copy-body)' }}>
                <strong className="font-semibold">
                  {t('error.whatHappened')}
                </strong>{' '}
                {t('error.explanation')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
            <Button
              onClick={() => window.location.reload()}
              size="lg"
              className="w-full sm:w-auto h-12 text-white shadow-md rounded-lg transition-all duration-200 font-semibold"
            >
              <RefreshCw className="h-4 w-4" />
              {t('error.reload')}
            </Button>
            <Button
              onClick={() => (window.location.href = '/')}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 border-2 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-all duration-200 font-semibold"
            >
              <Home className="h-4 w-4" />
              {t('error.goHome')}
            </Button>
          </div>

          {/* What might have caused this */}
          <div className="mt-8 pt-8 border-t border-white dark:border-gray-600/30 text-left">
            <h3
              className="text-lg font-semibold mb-5"
              style={{ color: 'var(--copy-headlines)' }}
            >
              {t('error.whatHappened')}
            </h3>
            <ul className="space-y-3 text-sm mb-4">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-black dark:bg-white" />
                <span
                  className="leading-relaxed"
                  style={{ color: 'var(--copy-body)' }}
                >
                  {t('error.reason1')}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-black dark:bg-white" />
                <span
                  className="leading-relaxed"
                  style={{ color: 'var(--copy-body)' }}
                >
                  {t('error.reason2')}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                  style={{ backgroundColor: 'hsl(211, 93%, 61%)' }}
                />
                <span
                  className="leading-relaxed"
                  style={{ color: 'var(--copy-body)' }}
                >
                  {t('error.reason3')}
                </span>
              </li>
            </ul>
            <p
              className="text-sm pt-4 mt-4 border-t border-white dark:border-gray-600/30 leading-relaxed"
              style={{ color: 'var(--copy-body)' }}
            >
              {t('error.contactSupport')}
            </p>
          </div>
        </div>
      </GlassCard>
    </ErrorPageLayout>
  );
}
