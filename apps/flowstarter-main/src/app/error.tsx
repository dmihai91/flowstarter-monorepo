'use client';

import { ErrorPageLayout } from '@/components/ErrorPageLayout';
import { UnifiedButton } from '@/components/ui/unified-button';
import { setIsErrorPageFlag, useErrorPage } from '@/contexts/ErrorPageContext';
import { Logo } from '@/components/ui/logo';
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
  const { setIsErrorPage } = useErrorPage();
  setIsErrorPageFlag(true);

  useEffect(() => {
    console.error('Application error:', error);
    return () => {
      setIsErrorPage(false);
    };
  }, [error, setIsErrorPage]);

  return (
    <ErrorPageLayout>
      <div className="text-center">
        {/* F logo mark as hero — with a soft error glow */}
        <div className="mb-8 flex justify-center">
          <div
            className="relative flex items-center justify-center w-24 h-24 rounded-3xl"
            style={{
              background: 'var(--fs-glass-bg)',
              border: '1px solid var(--fs-glass-edge)',
              boxShadow:
                '0 0 0 1px var(--fs-glass-edge), 0 8px 40px rgba(78,94,218,0.18), var(--fs-card-shadow)',
            }}
          >
            {/* Subtle pulse ring */}
            <span
              className="absolute inset-0 rounded-3xl animate-ping"
              style={{
                background: 'hsl(233,65%,50%)',
                opacity: 0.06,
                animationDuration: '2.4s',
              }}
              aria-hidden="true"
            />
            <Logo size="lg" showText={false} />
          </div>
        </div>

        {/* Headline + subtext */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--fs-ink)] mb-3 tracking-tight">
          We hit a snag.
        </h1>
        <p className="text-[var(--fs-ink-dim)] mb-8 leading-relaxed max-w-xs mx-auto text-sm">
          Our team has been notified. Try reloading — it usually fixes it.
        </p>

        {/* Premium glass card */}
        <div
          className="rounded-[var(--fs-radius-2xl)] border px-6 py-5 mb-8"
          style={{
            background: 'var(--fs-glass-bg)',
            borderColor: 'var(--fs-glass-edge)',
            boxShadow: 'var(--fs-card-shadow)',
          }}
        >
          <p className="text-sm text-[var(--fs-ink-dim)] leading-relaxed">
            This is usually a temporary blip. Give it a moment and reload — or
            head home and come back.
          </p>

          {/* Error digest chip */}
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

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
