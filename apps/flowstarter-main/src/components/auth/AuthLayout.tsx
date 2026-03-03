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
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  showTeamBadge = false,
}: AuthLayoutProps) {
  useTheme();
  const { t } = useTranslations();
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display {
          font-family: 'Outfit', system-ui, sans-serif;
        }
      `}</style>

      <div className="min-h-screen w-full font-display relative overflow-hidden flex flex-col bg-[radial-gradient(circle_at_0%_0%,#ede6ff_0%,transparent_80%),radial-gradient(circle_at_100%_100%,#fde9f0_0%,transparent_80%),linear-gradient(to_bottom,#fbf9ff,#fdfcff)] dark:bg-[radial-gradient(circle_at_0%_0%,#1a0d2e_0%,transparent_80%),radial-gradient(circle_at_100%_100%,#200a1a_0%,transparent_80%),linear-gradient(to_bottom,#0a0810,#0a0a0c)]">
        {/* Gradient background with flow lines */}
        <FlowBackground variant="dashboard" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />

        {/* Header */}
        <ScrollAwareHeader className="z-50" scrolledClass="bg-white/80 dark:bg-[#14141a]/85 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10">
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

            {/* Stats */}
            <div className="mt-10 pt-6 border-t border-gray-200 dark:border-white/10">
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
                      <div className="text-[9px] text-gray-400 dark:text-white/30 uppercase tracking-wide font-medium">
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
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
