'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { Logo } from '@/components/ui/logo';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { useTranslations } from '@/lib/i18n';

interface ErrorPageLayoutProps {
  children: ReactNode;
}

export function ErrorPageLayout({ children }: ErrorPageLayoutProps) {
  const { t } = useTranslations();
  return (
    <div className="flex flex-col min-h-screen font-display text-[var(--fs-ink)]">
      {/* Full-page background — same as auth */}
      <FlowBackground
        variant="auth"
        animated={false}
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      />

      {/* Header — mirrors auth page treatment */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--fs-rule)]/50 backdrop-blur-xl backdrop-saturate-150 bg-white/85 dark:bg-[var(--fs-bg-base)]/80"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size="md" />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-[var(--fs-ink-faint)] hover:text-[var(--fs-ink)] transition-colors duration-150"
          >
            {t('error.backToHome')}
          </Link>
        </div>
      </header>

      {/* Centered content — generous breathing room */}
      <main className="flex-1 flex items-center justify-center px-6 pt-28 pb-16 relative z-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Minimal footer — just copyright */}
      <footer className="relative z-10 py-6 text-center">
        <p className="text-xs text-[var(--fs-ink-faint)]">
          © {new Date().getFullYear()} Flowstarter. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
