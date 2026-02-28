'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { TranslationKeys, useTranslations } from '@/lib/i18n';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { FlowBackground, ScrollAwareHeader } from '@flowstarter/flow-design-system';

import { Logo } from '@/components/ui/logo';

interface AuthLayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  marketingKeys?: Array<TranslationKeys>;
  showTeamBadge?: boolean;
  hideFooterStats?: boolean;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  showTeamBadge = false,
  hideFooterStats = false,
}: AuthLayoutProps) {
  useTheme();
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display {
          font-family: 'Outfit', system-ui, sans-serif;
        }
      `}</style>

      <div className="min-h-screen w-full font-display relative overflow-hidden flex flex-col">
        {/* Gradient background with flow lines */}
        <FlowBackground variant="dashboard" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />

        {/* Header */}
        <ScrollAwareHeader className="z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <Logo size="md" />
              {showTeamBadge && (
                <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--purple)]/10 text-[var(--purple)] rounded-full">
                  Team
                </span>
              )}
            </Link>
            <ThemeToggle />
          </div>
        </ScrollAwareHeader>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 mt-14">
          <div className="w-full max-w-md">
            {/* Title */}
            <div className="text-center mb-8">
              {title && (
                <h1 className="text-3xl font-bold tracking-tight mb-3">
                  <span className="text-gray-900 dark:text-white">
                    {title.split(' ').slice(0, -1).join(' ')}{' '}
                  </span>
                  <span className="bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                    {title.split(' ').slice(-1)}
                  </span>
                </h1>
              )}
              {subtitle && (
                <p className="text-gray-500 dark:text-white/50 text-sm">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Auth content */}
            <div className="relative">{children}</div>

            {/* Stats - for client login only */}
            {!hideFooterStats && (
              <div className="mt-10 pt-6 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-center gap-6">
                  {[
                    { value: '1-2', label: 'Weeks to launch' },
                    { value: '1', label: 'Call needed' },
                    { value: '0', label: 'Tech skills required' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center">
                      <div className="text-center px-3">
                        <div className="text-lg font-bold bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                          {stat.value}
                        </div>
                        <div className="text-[9px] text-gray-400 dark:text-white/30 uppercase tracking-wider">
                          {stat.label}
                        </div>
                      </div>
                      {i < 2 && (
                        <div className="w-px h-6 bg-gray-200 dark:bg-white/10" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
