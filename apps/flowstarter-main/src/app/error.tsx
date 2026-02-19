'use client';

import { ErrorPageLayout } from '@/components/ErrorPageLayout';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { setIsErrorPageFlag, useErrorPage } from '@/contexts/ErrorPageContext';
import { useTranslations } from '@/lib/i18n';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslations();
  const { setIsErrorPage } = useErrorPage();

  // Set error page flag synchronously to hide navbar immediately
  // This ensures NavigationWrapper sees it on first render
  setIsErrorPageFlag(true);

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);

    // Cleanup when component unmounts
    return () => {
      setIsErrorPage(false);
    };
  }, [error, setIsErrorPage]);

  return (
    <ErrorPageLayout>
      <GlassCard className="p-12 sm:p-16">
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

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              onClick={reset}
              size="lg"
              className="w-full sm:w-auto h-12 text-white shadow-md rounded-lg transition-all duration-200 font-semibold"
            >
              <RefreshCw className="h-4 w-4" />
              {t('error.generation.tryAgain')}
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 border-2 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-all duration-200 font-semibold"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                {t('error.goHome')}
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-8 border-t border-white dark:border-gray-600/30">
            <p className="text-sm mb-3" style={{ color: 'var(--copy-labels)' }}>
              {t('error.contactSupport')}
            </p>
            <Link
              href="/help"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/30 dark:bg-[rgba(58,58,74,0.25)] backdrop-blur-xl border border-white/60 dark:border-white/15 text-black dark:text-white font-medium hover:bg-white/40 dark:hover:bg-[rgba(58,58,74,0.35)] transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.15),0_1px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
              {t('footer.links.helpCenter')}
            </Link>
          </div>
        </div>
      </GlassCard>
    </ErrorPageLayout>
  );
}
