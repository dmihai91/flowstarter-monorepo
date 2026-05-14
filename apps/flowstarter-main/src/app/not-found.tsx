'use client';

import { ErrorPageLayout } from '@/components/ErrorPageLayout';
import { Button } from '@/components/ui/unified-button';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';
import { Home, ArrowLeft, ArrowRight } from 'lucide-react';

export default function NotFound() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;

  const navLinks = [
    { href: '/', label: t('errors.404.linkHome') },
    { href: '/#pricing', label: t('errors.404.linkPricing') },
    { href: '/faq', label: t('errors.404.linkFaq') },
    { href: '/contact', label: t('errors.404.linkContact') },
  ];

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
          {t('errors.404.headline')}
        </h1>
        <p className="text-[var(--fs-ink-dim)] mb-8 leading-relaxed max-w-xs mx-auto text-sm">
          {t('errors.404.body')}
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
              {t('errors.404.quickNav')}
            </p>
          </div>
          <ul className="divide-y divide-[var(--fs-rule)]/30">
            {navLinks.map(({ href, label }) => (
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
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              {t('errors.404.goHome')}
            </Link>
          </Button>
          <Button onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('errors.404.goBack')}
          </Button>
        </div>
      </div>
    </ErrorPageLayout>
  );
}
