'use client';

import { useI18n } from '@/lib/i18n';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { EXTERNAL_URLS } from '@/lib/constants';
import { Button } from '@/components/ui/button';

/**
 * Landing page pricing section with plans and comparison.
 */
export function LandingPricing() {
  const { t } = useI18n();
  const { ref: sectionRef, isVisible } = useScrollAnimation();

  return (
    <div ref={sectionRef}>
        {/* Pricing Section */}
        <section data-section="pricing" id="pricing" className="py-8 lg:py-10 relative">
          {/* Gradient accent - lavender tint */}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--purple)]/[0.03] via-[var(--purple)]/50/[0.05] to-[var(--purple)]/[0.02] dark:from-[var(--purple)]/[0.02] dark:via-[var(--purple)]/50/[0.04] dark:to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="text-center mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                Clear{' '}
                <span className="bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                  pricing
                </span>
              </h2>
            </div>

            <div className="max-w-lg lg:max-w-2xl mx-auto">
              {/* Starter Plan Card - Premium Treatment */}
              <div className="group p-6 sm:p-8 lg:p-10 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-2xl border border-[var(--purple)]/20 dark:border-[var(--purple)]/15 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_-1px_0_rgba(0,0,0,0.04)_inset,0_8px_32px_rgba(77,93,217,0.1),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_8px_32px_rgba(77,93,217,0.15),0_2px_8px_rgba(0,0,0,0.15)] relative overflow-hidden transition-all duration-300 hover:border-[var(--purple)]/40 hover:shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_-1px_0_rgba(0,0,0,0.04)_inset,0_12px_40px_rgba(77,93,217,0.15),0_4px_12px_rgba(0,0,0,0.06)]">
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
                    <span className="text-lg line-through text-gray-400 dark:text-white/30 font-medium mr-1">€599</span>
                    <span className="text-3xl font-bold">{t('landing.pricing.buildPrice')}</span>
                    <span className="text-base text-gray-400 dark:text-white/40 ml-1">
                      {t('landing.pricing.buildPeriod')}
                    </span>
                  </div>
                  <div>
                    <span className="text-base text-gray-400 dark:text-white/40">
                      {t('landing.pricing.careLabel')}{' '}
                    </span>
                    <span className="text-lg line-through text-gray-400 dark:text-white/30 font-medium mr-1">€59</span>
                    <span className="text-3xl font-bold">{t('landing.pricing.carePrice')}</span>
                    <span className="text-base text-gray-400 dark:text-white/40 ml-1">
                      {t('landing.pricing.carePeriod')}
                    </span>
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
                <div className="mb-6 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 backdrop-blur-sm border border-amber-500/30 shadow-[0_4px_16px_rgba(245,158,11,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_16px_rgba(245,158,11,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium text-center">
                    ⏳ {t('landing.pricing.limitedNote')}
                  </p>
                </div>

                {/* Features - Two Categories */}
                <div className="space-y-5 mb-8">
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
                        t('landing.pricing.websiteFeature4'),
                        t('landing.pricing.websiteFeature5'),
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
                        t('landing.pricing.careFeature4'),
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

                {/* CTA */}
                <a
                  href={EXTERNAL_URLS.calendly.discovery}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 hover:from-[#232342] hover:via-[#1e2a4a] hover:to-[#232342] dark:hover:from-gray-100 dark:hover:via-white dark:hover:to-gray-100 rounded-lg h-14 text-base font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300 hover:scale-[1.02]">
                    Claim Your Spot
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
              </div>

              {/* Coming Soon Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                {/* Growth - Coming Soon */}
                <div className="group p-6 rounded-2xl bg-white/55 dark:bg-white/[0.03] backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.1)] relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--purple)]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-gray-700 dark:text-white/80">
                        {t('landing.tiers.pro.name')}
                      </h4>
                      <span className="px-3 py-1 text-[10px] font-medium bg-[var(--purple)]/10 text-[var(--purple)] dark:bg-[var(--purple)]/20 dark:text-[var(--purple)] rounded-full">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-base font-medium text-gray-600 dark:text-white/60 mb-4">
                      {t('landing.tiers.pro.price')}
                    </p>
                    <ul className="space-y-2.5 text-base text-gray-600 dark:text-white/50">
                      {[t('landing.tiers.pro.f1'), t('landing.tiers.pro.f2'), t('landing.tiers.pro.f3'), t('landing.tiers.pro.f4'), t('landing.tiers.pro.f5')].map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--purple)]/50 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Commerce - Coming Soon */}
                <div className="group p-6 rounded-2xl bg-white/55 dark:bg-white/[0.03] backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.1)] relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-gray-700 dark:text-white/80">
                        {t('landing.tiers.ecom.name')}
                      </h4>
                      <span className="px-3 py-1 text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-base font-medium text-gray-600 dark:text-white/60 mb-4">
                      {t('landing.tiers.ecom.price')}
                    </p>
                    <ul className="space-y-2.5 text-base text-gray-600 dark:text-white/50">
                      {[t('landing.tiers.ecom.f1'), t('landing.tiers.ecom.f2'), t('landing.tiers.ecom.f3'), t('landing.tiers.ecom.f4')].map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Fine print */}
              <p className="text-center text-base text-gray-400 dark:text-white/30 mt-6">
                No contracts. Cancel anytime. First month free.
              </p>

              {/* Perfect for you if */}
              <div className="mt-12 p-6 rounded-2xl bg-[var(--purple)]/10 dark:bg-[var(--purple)]/10 backdrop-blur-xl border border-[var(--purple)]/30 shadow-[0_8px_32px_rgba(124,58,237,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(124,58,237,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                  {t('landing.forYou.title')}
                </h4>
                <ul className="space-y-2 text-base text-gray-600 dark:text-white/60">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--purple)]">→</span>
                    {t('landing.forYou.item1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--purple)]">→</span>
                    {t('landing.forYou.item2')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--purple)]">→</span>
                    {t('landing.forYou.item3')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--purple)]">→</span>
                    {t('landing.forYou.item4')}
                  </li>
                </ul>
              </div>

              {/* Not the right fit */}
              <div className="mt-4 p-6 rounded-2xl bg-white/55 dark:bg-white/[0.03] backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]">
                <h4 className="text-base font-semibold text-gray-700 dark:text-white/70 mb-4">
                  {t('landing.notForYou.title')}
                </h4>
                <ul className="space-y-2 text-base text-gray-500 dark:text-white/50">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 dark:text-white/30">→</span>
                    {t('landing.notForYou.item1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 dark:text-white/30">→</span>
                    {t('landing.notForYou.item2')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 dark:text-white/30">→</span>
                    {t('landing.notForYou.item3')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 dark:text-white/30">→</span>
                    {t('landing.notForYou.item4')}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>


    </div>
  );
}
