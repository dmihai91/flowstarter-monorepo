'use client';

import { ErrorPageLayout } from '@/components/ErrorPageLayout';
import { UnifiedButton } from '@/components/ui/unified-button';
import { setIsErrorPageFlag, useErrorPage } from '@/contexts/ErrorPageContext';
import Link from 'next/link';
import { useEffect } from 'react';
import { Home, ArrowLeft, ArrowRight } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/login', label: 'Login' },
  { href: '/help', label: 'Help' },
  { href: '/pricing', label: 'Pricing' },
];

export default function NotFound() {
  const { setIsErrorPage } = useErrorPage();
  setIsErrorPageFlag(true);

  useEffect(() => {
    return () => {
      setIsErrorPage(false);
    };
  }, [setIsErrorPage]);

  return (
    <ErrorPageLayout>
      <div className="text-center">
        {/* Large gradient 404 */}
        <div className="mb-6 select-none" aria-hidden="true">
          <span
            className="text-7xl sm:text-8xl font-bold leading-none tracking-tight"
            style={{
              background:
                'linear-gradient(135deg, var(--fs-accent) 0%, hsl(233,70%,72%) 55%, hsl(270,60%,68%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            404
          </span>
        </div>

        {/* Headline + subtext */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--fs-ink)] mb-3 tracking-tight">
          This page moved on.
        </h1>
        <p className="text-[var(--fs-ink-dim)] mb-8 leading-relaxed max-w-xs mx-auto text-sm">
          Whatever you were looking for isn&apos;t here anymore — but we&apos;ve
          got you covered.
        </p>

        {/* Glass quick-nav card */}
        <div
          className="rounded-[var(--fs-radius-2xl)] border mb-8 overflow-hidden"
          style={{
            background: 'var(--fs-glass-bg)',
            borderColor: 'var(--fs-glass-edge)',
            boxShadow: 'var(--fs-card-shadow)',
          }}
        >
          <div className="px-5 py-3 border-b border-[var(--fs-rule)]/40">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fs-ink-faint)]">
              Quick navigation
            </p>
          </div>
          <ul className="divide-y divide-[var(--fs-rule)]/30">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center justify-between px-5 py-3.5 text-sm font-medium text-[var(--fs-ink)] hover:bg-[var(--fs-bg-elevated)]/60 transition-colors duration-100 group"
                >
                  <span>{label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--fs-ink-faint)] group-hover:text-[var(--fs-accent)] transition-colors duration-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <UnifiedButton asChild className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </UnifiedButton>
          <UnifiedButton
            tone="secondary"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </UnifiedButton>
        </div>
      </div>
    </ErrorPageLayout>
  );
}
