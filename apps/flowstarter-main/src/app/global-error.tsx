'use client';

import { ErrorPageLayout } from '@/components/ErrorPageLayout';
import { GlassCard } from '@/components/ui/glass-card';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { I18nProvider, useTranslations } from '@/lib/i18n';
import en from '@/locales/en';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

function GlobalErrorContent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslations();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error);
  }, [error]);

  return (
    <ErrorPageLayout>
      <GlassCard className="p-12 sm:p-16 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <svg
            className="w-12 h-12"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="36" height="36" rx="8" fill="url(#gradient)" />
            <path
              d="M18 10L26 16L18 22L10 16L18 10Z"
              fill="white"
              fillOpacity="0.9"
            />
            <defs>
              <linearGradient
                id="gradient"
                x1="0"
                y1="0"
                x2="36"
                y2="36"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4d5dd9" />
                <stop offset="1" stopColor="#6d75eb" />
              </linearGradient>
            </defs>
          </svg>
          <span
            className="text-2xl font-bold"
            style={{ color: 'var(--copy-headlines)' }}
          >
            Flowstarter
          </span>
        </div>

        {/* Error Icon */}
        <div className="w-24 h-24 mx-auto mb-8 rounded-[24px] bg-gradient-to-br from-black/10 to-black/10 dark:from-white/10 dark:to-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-black/20 dark:ring-white/30">
          <AlertTriangle className="h-12 w-12 text-black dark:text-white" />
        </div>

        {/* Error Title */}
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
          style={{ color: 'var(--copy-headlines)' }}
        >
          {t('error.critical.title')}
        </h1>

        {/* Description */}
        <p
          className="text-lg mb-2 leading-relaxed max-w-xl mx-auto"
          style={{ color: 'var(--copy-body)' }}
        >
          {t('error.critical.description')}
        </p>
        <p className="text-sm mb-8" style={{ color: 'var(--copy-labels)' }}>
          {t('error.critical.notified')}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 h-12 text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl transition-all duration-200 font-semibold shadow-md"
          >
            <RefreshCw className="h-4 w-4" />
            {t('error.critical.restart')}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 h-12 border-2 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl transition-all duration-200 font-semibold text-gray-900 dark:text-white"
          >
            <Home className="h-4 w-4" />
            {t('error.goHome')}
          </Link>
        </div>

        {/* Help Text */}
        <div className="pt-8 border-t border-white dark:border-gray-600/30">
          <p className="text-sm mb-3" style={{ color: 'var(--copy-labels)' }}>
            {t('error.critical.needHelp')}
          </p>
          <Link
            href="/help"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/30 dark:bg-[rgba(58,58,74,0.25)] backdrop-blur-xl border border-white/60 dark:border-white/15 text-black dark:text-white font-medium hover:bg-white/40 dark:hover:bg-[rgba(58,58,74,0.35)] transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.15),0_1px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            {t('error.contactSupport')}
          </Link>
        </div>
      </GlassCard>
    </ErrorPageLayout>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Critical Error - Flowstarter</title>
      </head>
      <body
        style={{
          fontFamily: 'var(--font-inter)',
        }}
      >
        <ThemeProvider>
          <I18nProvider initialLocale="en" initialMessages={{ en }}>
            <GlobalErrorContent error={error} reset={reset} />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
