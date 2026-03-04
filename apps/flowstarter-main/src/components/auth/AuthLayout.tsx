'use client';

import { useTheme } from '@/contexts/ThemeContext';
import type { TranslationKeys } from '@/lib/i18n';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { Logo } from '@/components/ui/logo';

interface AuthLayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  marketingKeys?: Array<TranslationKeys>;
  showTeamBadge?: boolean;
  showStats?: boolean;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  showTeamBadge = false,
}: AuthLayoutProps) {
  useTheme();
  return (
    <div className="min-h-screen w-full relative flex flex-col bg-[#fbf9ff] dark:bg-[#0a0810]">
      <FlowBackground variant="dashboard" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />

      {/* Header */}
      <header className="relative z-50 shrink-0 border-b border-gray-200/30 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size="md" />
            {showTeamBadge && (
              <span className="px-2 py-0.5 text-[0.625rem] font-medium bg-[var(--purple)]/10 text-[var(--purple)] rounded-full">
                Team
              </span>
            )}
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Content — fills remaining space, scrolls if needed */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 overflow-y-auto">
        <div className="w-full max-w-md">
          {title && (
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-gray-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-gray-500 dark:text-white/50 text-sm">{subtitle}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 shrink-0">
        <Footer />
      </footer>
    </div>
  );
}
