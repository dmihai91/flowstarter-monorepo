'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations, type TranslationKeys } from '@/lib/i18n';
import Footer from '@/components/Footer';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { SiteHeader } from '@/components/SiteHeader';

interface AuthLayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  marketingKeys?: Array<TranslationKeys>;
  showStats?: boolean;
  /** Matches marketing landing atmosphere (FlowBackground + editorial type). */
  teamLandingVisual?: boolean;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  showStats = false,
  teamLandingVisual = false,
}: AuthLayoutProps) {
  useTheme();
  const { t } = useTranslations();
  return (
    <div
      className="min-h-screen w-full relative flex flex-col"
      data-density="comfortable"
    >
      <FlowBackground
        variant={teamLandingVisual ? 'landing' : 'auth'}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
      />

      <SiteHeader mode="auth" />

      {/* Content — fills remaining space, scrolls if needed */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-8 sm:py-10">
        <div className="w-full max-w-lg mt-4 sm:mt-6 mb-auto">
          {title && (
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                <span
                  style={{
                    backgroundImage:
                      'linear-gradient(110deg, var(--fs-accent-hot), var(--fs-accent))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {title.split(' ')[0]}
                </span>
                {title.split(' ').length > 1 && (
                  <span className="text-[var(--fs-ink)]">
                    {' '}
                    {title.split(' ').slice(1).join(' ')}
                  </span>
                )}
              </h1>
              {subtitle && (
                <p className="text-[var(--fs-ink-faint)] text-sm max-w-[40ch] mx-auto">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
          {showStats && (
            <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-white/10">
              <div className="flex items-center justify-center">
                {[
                  {
                    value: t('landing.stats.weeks'),
                    label: t('landing.stats.weeksLabel'),
                  },
                  {
                    value: t('landing.stats.calls'),
                    label: t('landing.stats.callsLabel'),
                  },
                  {
                    value: t('landing.stats.techSkills'),
                    label: t('landing.stats.techSkillsLabel'),
                  },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center">
                    <div className="text-center px-4">
                      <div
                        className="text-lg font-bold"
                        style={{
                          backgroundImage:
                            'linear-gradient(to right, #4338CA, #8B5CF6)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {stat.value}
                      </div>
                      <div className="text-[0.5625rem] text-gray-400 dark:text-white/30 uppercase tracking-wide font-medium">
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
      </main>

      {/* Footer */}
      <footer
        className={
          teamLandingVisual
            ? 'relative z-10 shrink-0 admin-team-login-footer-chrome'
            : 'relative z-10 shrink-0'
        }
      >
        <Footer />
      </footer>
    </div>
  );
}
