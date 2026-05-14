'use client';

import { ErrorPageLayout } from '@/components/ErrorPageLayout';
import { Button } from '@/components/ui/unified-button';
import { Logo } from '@/components/ui/logo';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';
import { useEffect } from 'react';
import { RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <ErrorPageLayout>
      <div className="text-center max-w-sm mx-auto">
        {/* Logo with subtle glow */}
        <div className="mb-7 flex justify-center">
          <div
            className="relative flex items-center justify-center w-16 h-16 rounded-2xl"
            style={{
              background: 'var(--fs-glass-bg)',
              border: '1px solid var(--fs-glass-edge)',
              boxShadow: '0 6px 24px rgba(78,94,218,0.14)',
            }}
          >
            <Logo size="md" showText={false} />
          </div>
        </div>

        {/* Headline + body */}
        <h1 className="text-2xl sm:text-[1.65rem] font-semibold text-[var(--fs-ink)] mb-3 tracking-tight">
          {t('errors.500.headline')}
        </h1>
        <p className="text-[var(--fs-ink-dim)] mb-7 leading-relaxed text-sm">
          {t('errors.500.body')}
        </p>

        {/* Optional error ID chip */}
        {error?.digest && (
          <div className="mb-7 flex justify-center">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-wide"
              style={{
                background: 'var(--fs-bg-elevated)',
                color: 'var(--fs-ink-faint)',
                border: '1px solid var(--fs-rule)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--fs-accent)] opacity-70" />
              {t('errors.500.errorIdLabel')}: {error.digest}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {t('errors.500.reload')}
          </Button>
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              {t('errors.500.goHome')}
            </Link>
          </Button>
        </div>
      </div>
    </ErrorPageLayout>
  );
}
