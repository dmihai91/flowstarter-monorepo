'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { I18nProvider } from '@/lib/i18n';
import { ErrorPageLayout } from '@/components/ErrorPageLayout';
import { UnifiedButton } from '@/components/ui/unified-button';
import en from '@/locales/en';
import Link from 'next/link';
import { useEffect } from 'react';
import { RefreshCw, Home } from 'lucide-react';

function GlobalErrorContent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <ErrorPageLayout>
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--fs-ink)] mb-3 tracking-tight">
          We hit a snag.
        </h1>
        <p className="text-[var(--fs-ink-dim)] mb-8 leading-relaxed max-w-xs mx-auto text-sm">
          Our team has been notified. Try reloading - it usually fixes it.
        </p>

        <div
          className="rounded-[var(--fs-radius-2xl)] border px-6 py-5 mb-8"
          style={{
            background: 'var(--fs-glass-bg)',
            borderColor: 'var(--fs-glass-edge)',
            boxShadow: 'var(--fs-card-shadow)',
          }}
        >
          <p className="text-sm text-[var(--fs-ink-dim)] leading-relaxed">
            This is usually a temporary blip. Give it a moment and reload - or
            head home and come back.
          </p>

          {error?.digest && (
            <div className="mt-4 flex justify-center">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-wide"
                style={{
                  background: 'var(--fs-bg-elevated)',
                  color: 'var(--fs-ink-faint)',
                  border: '1px solid var(--fs-rule)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--fs-accent)] opacity-70" />
                {error.digest}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <UnifiedButton onClick={reset} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Reload
          </UnifiedButton>
          <UnifiedButton tone="secondary" asChild className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </UnifiedButton>
        </div>
      </div>
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
      <body>
        <I18nProvider initialMessages={{ en }}>
          <ThemeProvider>
            <GlobalErrorContent error={error} reset={reset} />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
