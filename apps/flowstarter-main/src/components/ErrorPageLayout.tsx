'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import Footer from './Footer';
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
      {/* Unified gradient background */}
      <FlowBackground
        variant="auth"
        animated={false}
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      />

      {/* Header — same as all other pages */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--fs-rule)]/50 backdrop-blur-xl backdrop-saturate-150"
        style={{ background: 'color-mix(in srgb, var(--fs-bg-base) 85%, transparent)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size="md" />
          </Link>
          <Link
            href="/"
            className="text-sm text-[var(--fs-ink-faint)] hover:text-[var(--fs-ink)] transition-colors"
          >
            {t('error.backToHome')}
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-12 relative z-10">
        <div className="w-full max-w-lg">{children}</div>
      </div>

      <Footer />
    </div>
  );
}
