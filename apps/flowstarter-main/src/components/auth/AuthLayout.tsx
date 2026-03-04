'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations, type TranslationKeys } from '@/lib/i18n';
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
  showStats = false,
}: AuthLayoutProps) {
  useTheme();
  const { t } = useTranslations();
  return (
    <div className="min-h-screen w-full relative flex flex-col bg-[#fbf9ff] dark:bg-[#0a0810]">
      <FlowBackground variant="dashboard" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />

      {/* Header */}
      <header className="sticky top-0 z-50 shrink-0 border-b border-gray-200/30 dark:border-white/5 bg-white/80 dark:bg-[#0a0810]/80 backdrop-blur-xl">
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
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-8 sm:pt-16 lg:pt-24 pb-8">
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
          {showStats && (
            <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-white/10">
              <div className="flex items-center justify-center">
                {[
                  { value: t('landing.stats.weeks'), label: t('landing.stats.weeksLabel') },
                  { value: t('landing.stats.calls'), label: t('landing.stats.callsLabel') },
                  { value: t('landing.stats.techSkills'), label: t('landing.stats.techSkillsLabel') },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center">
                    <div className="text-center px-4">
                      <div className="text-lg font-bold bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                        {stat.value}
                      </div>
                      <div className="text-[0.5625rem] text-gray-400 dark:text-white/30 uppercase tracking-wide font-medium">
                        {stat.label}
                      </div>
                    </div>
                    {i < 2 && <div className="w-px h-6 bg-gray-200 dark:bg-white/10" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 shrink-0">
        <Footer />
      </footer>
    </div>
  );
}
