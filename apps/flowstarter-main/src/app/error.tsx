'use client';

import { ErrorPageLayout } from '@/components/ErrorPageLayout';
import { Button } from '@/components/ui/button';
import { setIsErrorPageFlag, useErrorPage } from '@/contexts/ErrorPageContext';
import Link from 'next/link';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

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
    return () => { setIsErrorPage(false); };
  }, [error, setIsErrorPage]);

  return (
    <ErrorPageLayout>
      <div className="text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--fs-glass-bg)', border: '1px solid var(--fs-glass-edge)', boxShadow: 'var(--fs-card-shadow)' }}
        >
          <AlertTriangle className="w-9 h-9 text-[var(--fs-accent)]" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--fs-ink)] mb-3">
          Something went wrong
        </h1>
        <p className="text-[var(--fs-ink-dim)] mb-8 leading-relaxed max-w-sm mx-auto">
          We encountered an unexpected error. Don&apos;t worry — we&apos;ve been notified and are working to fix it.
        </p>

        {/* Info card */}
        <div className="rounded-[var(--fs-radius-2xl)] border p-5 mb-8 text-left backdrop-blur-xl"
          style={{ background: 'var(--fs-glass-bg)', borderColor: 'var(--fs-glass-edge)', boxShadow: 'var(--fs-card-shadow)' }}
        >
          <div className="flex gap-3">
            <AlertTriangle className="w-4 h-4 text-[var(--fs-ink-faint)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--fs-ink)] mb-1">What happened?</p>
              <p className="text-xs text-[var(--fs-ink-faint)] leading-relaxed">
                A technical error occurred while loading this page. This could be a temporary issue — try reloading.
              </p>
              {error?.digest && (
                <p className="text-xs text-[var(--fs-ink-faint)] mt-2 font-mono">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              Go to Homepage
            </Link>
          </Button>
        </div>
      </div>
    </ErrorPageLayout>
  );
}
