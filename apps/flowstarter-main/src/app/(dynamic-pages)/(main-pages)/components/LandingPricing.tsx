'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { EXTERNAL_URLS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { LANDING_COPY } from '../landing-copy';

/**
 * Landing page pricing section with plans and comparison.
 */
export function LandingPricing() {
  const { ref: sectionRef, isVisible } = useScrollAnimation();
  const pricing = LANDING_COPY.pricing;

  return (
    <div ref={sectionRef}>
        {/* Pricing Section */}
        <section data-section="pricing" id="pricing" className="py-8 lg:py-18 pb-4 lg:pb-8 relative">
          {/* Gradient accent - lavender tint */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--landing-bg-tint)] to-transparent dark:via-[var(--landing-dark-surface-tint)] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-3xl lg:text-5xl font-bold leading-tight text-gray-900 dark:text-white">
                {pricing.title}
              </h2>
              <p className="mt-3 text-base text-gray-500 dark:text-white/50">
                {pricing.subtitle}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 items-stretch">
              {pricing.plans.map((plan, index) => {
                const isHighlighted = plan.name === 'GROWTH';
                const isComingSoon = plan.status === 'coming-soon';

                return (
                  <div
                    key={plan.name}
                    className={`relative flex h-full flex-col rounded-[28px] border p-7 sm:p-8 transition-all duration-700 ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    } ${
                      isHighlighted
                        ? 'border-[var(--purple-primary)] bg-[linear-gradient(180deg,rgba(124,58,237,0.12),rgba(255,255,255,0.75)) shadow-[0_20px_80px_rgba(124,58,237,0.18)] dark:bg-[linear-gradient(180deg,rgba(124,58,237,0.2),rgba(255,255,255,0.03))]'
                        : 'border-[var(--landing-card-border)] bg-[var(--landing-card-bg)] shadow-[0_12px_48px_rgba(15,23,42,0.05)]'
                    } ${
                      isComingSoon ? 'opacity-[0.65] saturate-75' : ''
                    }`}
                    style={{ transitionDelay: `${index * 120}ms` }}
                  >
                    {isHighlighted && (
                      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--purple-primary)] to-transparent" />
                    )}

                    <div className="mb-8 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold tracking-[0.24em] text-[var(--landing-text-accent)]">
                          {plan.name}
                        </p>
                        <h3 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white">
                          {plan.label}
                        </h3>
                      </div>
                      {plan.badge && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isHighlighted
                              ? 'bg-[var(--purple-primary)] text-white shadow-[0_8px_24px_rgba(124,58,237,0.3)]'
                              : 'bg-gray-900/8 text-gray-700 dark:bg-white/10 dark:text-white/70'
                          }`}
                        >
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    <div className="mb-8 border-b border-[var(--landing-card-border)] pb-8">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                          {plan.setupPrice}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-white/45">setup</span>
                      </div>
                      <p className="mt-3 text-base text-gray-600 dark:text-white/55">
                        {plan.monthlyPrice}
                      </p>
                    </div>

                    <ul className="mb-8 flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm text-gray-700 dark:text-white/60">
                          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {isComingSoon ? (
                      <button
                        type="button"
                        disabled
                        className="mt-auto inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/10 bg-gray-200 text-sm font-semibold text-gray-500 dark:bg-white/10 dark:text-white/35"
                      >
                        {plan.cta}
                      </button>
                    ) : (
                      <a
                        href={EXTERNAL_URLS.calendly.discovery}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto block"
                      >
                        <Button
                          variant={isHighlighted ? 'brand-gradient' : 'secondary'}
                          size="lg"
                          className={`w-full rounded-xl ${isHighlighted ? 'shadow-[0_14px_40px_rgba(124,58,237,0.28)]' : ''}`}
                        >
                          {plan.cta}
                        </Button>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-8 text-center text-base text-gray-500 dark:text-white/40">
              {pricing.note}
            </p>
          </div>
        </section>


    </div>
  );
}
