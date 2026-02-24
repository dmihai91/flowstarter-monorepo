'use client';

import { WaitlistForm } from '@/components/WaitlistForm';
import { useTranslations } from '@/lib/i18n';
import { SmoothScrollLink } from './SmoothScrollLink';

export function CTASection() {
  const { t } = useTranslations();

  return (
    <section className="full-width-section relative py-12 md:py-20 lg:py-28 overflow-hidden border-t border-white/40 dark:border-white/10">
      {/* Clean glassmorphism background */}
      <div
        className="absolute inset-0 backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(243, 243, 243, 0.30)',
        }}
      />
      <div
        className="absolute inset-0 hidden dark:block backdrop-blur-xl"
        style={{
          background:
            'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
        }}
      />

      {/* Subtle animated gradient orbs - more refined for dark mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 dark:from-blue-500/10 dark:to-purple-500/10 blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-purple-500/10 dark:to-pink-500/10 blur-3xl animate-pulse"
          style={{ animationDelay: '1.5s', animationDuration: '4s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-300/15 to-purple-300/15 dark:from-indigo-400/8 dark:to-purple-400/8 blur-3xl animate-pulse"
          style={{ animationDelay: '0.75s', animationDuration: '5s' }}
        />
      </div>

      <div className="full-width-content relative z-10">
        <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 text-center">
          <div className="space-y-3 sm:space-y-4 px-4 sm:px-0">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl md:text-4xl lg:text-5xl">
              {t('landing.cta.title')}
            </h2>
            <p className="mx-auto max-w-[700px] text-sm sm:text-base text-gray-600 dark:text-gray-400 md:text-lg lg:text-xl/relaxed">
              {t('landing.cta.subtitle')}
            </p>
          </div>
          {/* Waitlist Form */}
          <div className="w-full max-w-xl mx-auto">
            <WaitlistForm source="landing_cta" variant="hero" />
          </div>

          {/* Secondary link */}
          <div className="pt-4">
            <SmoothScrollLink
              href="#features"
              className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {t('landing.cta.learnMore')}
            </SmoothScrollLink>
          </div>
        </div>
      </div>
    </section>
  );
}
