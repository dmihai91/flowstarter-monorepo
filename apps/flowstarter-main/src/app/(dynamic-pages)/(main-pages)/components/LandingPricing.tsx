'use client';

import { useI18n } from '@/lib/i18n';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { EXTERNAL_URLS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@flowstarter/flow-design-system';

/**
 * Landing page pricing section with plans and comparison.
 */
export function LandingPricing() {
  const { t } = useI18n();
  const { ref: sectionRef, isVisible } = useScrollAnimation();

  return (
    <div ref={sectionRef}>
        {/* Pricing Section */}
        <section data-section="pricing" id="pricing" className="py-8 lg:py-28 relative">
          {/* Gradient accent - lavender tint */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--landing-bg-tint)] to-transparent dark:via-[var(--landing-dark-surface-tint)] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                Clear{' '}
                <span className="bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                  pricing
                </span>
              </h2>
            </div>

            <div className="max-w-lg lg:max-w-2xl mx-auto">
              {/* Starter Plan Card - Premium Treatment */}
              <GlassCard variant="subtle" className="group p-6 sm:p-8 lg:p-10 relative overflow-hidden border-[var(--purple)]/15 dark:border-[var(--purple)]/10">
                {/* Badge - inline on mobile, absolute on desktop */}
                <div className="sm:absolute sm:top-4 sm:right-4 mb-4 sm:mb-0 flex items-center gap-2">
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-[var(--purple)] text-white rounded-full">
                    {t('landing.pricing.badge')}
                  </span>
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-amber-500/90 text-white rounded-full animate-pulse">
                    {t('landing.pricing.limitedBadge')}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold mb-1">{t('landing.pricing.title')}</h3>
                <p className="text-base text-gray-400 dark:text-white/40 mb-6">
                  {t('landing.pricing.subtitle')}
                </p>

                {/* Pricing */}
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-white/10">
                  <div className="mb-2">
                    <span className="text-base text-gray-400 dark:text-white/40">
                      {t('landing.pricing.buildLabel')}{' '}
                    </span>
                    <span className="text-lg line-through text-gray-400 dark:text-white/30 font-medium mr-1">€699</span>
                    <span className="text-3xl font-bold">{t('landing.pricing.buildPrice')}</span>
                    <span className="text-base text-gray-400 dark:text-white/40 ml-1">
                      {t('landing.pricing.buildPeriod')}
                    </span>
                  </div>
                  <div>
                    <span className="text-base text-gray-400 dark:text-white/40">
                      {t('landing.pricing.careLabel')}{' '}
                    </span>
                    <span className="text-lg line-through text-gray-400 dark:text-white/30 font-medium mr-1">€49</span>
                    <span className="text-3xl font-bold">{t('landing.pricing.carePrice')}</span>
                    <span className="text-base text-gray-400 dark:text-white/40 ml-1">
                      {t('landing.pricing.carePeriod')}
                    </span>
                    <span className="inline-flex items-center ml-3 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">First month free</span>
                  </div>
                  <p className="text-sm text-gray-400 dark:text-white/30 mt-2">
                    {t('landing.pricing.note')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 text-sm text-gray-500 dark:text-white/40">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('landing.pricing.refund')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {t('landing.pricing.assets')}
                    </span>
                  </div>
                </div>

                {/* Limited time notice */}
                <div className="mb-6 p-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/15 dark:border-amber-500/10">
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium text-center">
                    ⏳ {t('landing.pricing.limitedNote')}
                  </p>
                </div>

                {/* Features - Two Categories */}
                <div className="space-y-5 mb-12 lg:mb-16">
                  {/* Your Website */}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-white/30 font-medium mb-1">
                      {t('landing.pricing.websiteTitle')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-white/40 mb-3">
                      {t('landing.pricing.websiteDesc')}
                    </p>
                    <ul className="space-y-1.5">
                      {[
                        t('landing.pricing.websiteFeature1'),
                        t('landing.pricing.websiteFeature2'),
                        t('landing.pricing.websiteFeature3'),
                      ].map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-base text-gray-600 dark:text-white/60"
                        >
                          <svg
                            className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Ongoing Care */}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-white/30 font-medium mb-1">
                      {t('landing.pricing.careTitle')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-white/40 mb-3">
                      {t('landing.pricing.careDesc')}
                    </p>
                    <ul className="space-y-1.5">
                      {[
                        t('landing.pricing.careFeature1'),
                        t('landing.pricing.careFeature2'),
                        t('landing.pricing.careFeature3'),
                      ].map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-base text-gray-600 dark:text-white/60"
                        >
                          <svg
                            className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Guarantee callout */}
                <div className="mb-6 p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/[0.04] border border-emerald-200/40 dark:border-emerald-500/10">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/80 mb-1">
                        Pay only when you&apos;re happy
                      </p>
                      <p className="text-xs text-gray-500 dark:text-white/45 leading-relaxed">
                        We collect 50% upfront to start your project. You only pay the remaining 50% when you&apos;re happy with the result.
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-white/25 mt-1.5">
                        The initial 50% deposit is non-refundable and covers design, setup, and infrastructure costs.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <a
                  href={EXTERNAL_URLS.calendly.discovery}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-gradient-to-r from-[var(--landing-btn-from)] via-[var(--landing-btn-via)] to-[var(--landing-btn-from)] text-white hover:from-[var(--landing-btn-hover-from)] hover:via-[var(--landing-btn-hover-via)] hover:to-[var(--landing-btn-hover-from)] rounded-lg h-14 text-base font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300 hover:scale-[1.02]">
                    {t('landing.pricing.cta')}
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Button>
                </a>

                {/* Footer note */}
                <p className="text-xs text-gray-400 dark:text-white/30 text-center mt-4">
                  No lock-in. Cancel anytime. No hidden fees.
                </p>
              </GlassCard>

              {/* Fine print */}
              <p className="text-center text-base text-gray-400 dark:text-white/30 mt-6">
                No contracts. Cancel anytime. First month free.
              </p>
            </div>
          </div>
        </section>


    </div>
  );
}
