'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/unified-button';
import { useI18n } from '@/lib/i18n';
import { LANDING_COPY } from '../landing-copy';
import { PreQualModal } from './PreQualModal';

// Storage tiers are not advertised on the concierge offer.
const STORAGE_BY_PLAN: Record<string, string> = {};

export function LandingPricing() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const pricing = LANDING_COPY.pricing;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handlePlanClick = (planName: string) => {
    setSelectedPlan(planName);
    setModalOpen(true);
  };

  return (
    <section id="pricing" className="ls-scope ls-section ls-section--pad">
      <div className="ls-mesh" aria-hidden />
      <div className="ls-orb ls-orb--violet ls-orb--c" aria-hidden />
      <div className="ls-grain" aria-hidden />

      <div className="ls-container">
        <div className="text-center max-w-3xl mx-auto">
          <div
            className="ls-eyebrow inline-flex items-center justify-center gap-3"
            style={{ justifyContent: 'center' }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: '28px',
                height: '1px',
                background: 'var(--ls-ink-faint)',
              }}
            />
            <span className="num">{t('landing.pricing.eyebrow')}</span>
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: '28px',
                height: '1px',
                background: 'var(--ls-ink-faint)',
              }}
            />
          </div>

          <h2 className="ls-display mt-7" style={{ textWrap: 'balance' }}>
            <span className="line">{t('landing.pricing.headlinePrefix')}</span>
            <span className="line flourish mt-2">
              {t('landing.pricing.headlineFlourish')}
            </span>
          </h2>

          <p className="ls-body ls-body--lead mt-7 mx-auto">
            {pricing.subtitle}
          </p>
        </div>

        <div className="ls-pricing-grid mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          {pricing.plans.map((plan, i) => {
            const isHighlighted = plan.recommended === true;
            const isCustomInquiry = plan.kind === 'custom-inquiry';
            const storage = STORAGE_BY_PLAN[plan.name];
            return (
              <div
                key={plan.name}
                className={`ls-card ls-price-card ${
                  isHighlighted ? 'ls-price-card--hi' : ''
                } ${isCustomInquiry ? 'ls-price-card--custom' : ''}`}
                style={{
                  animation: `ls-reveal 900ms cubic-bezier(0.19,1,0.22,1) ${
                    i * 110
                  }ms both`,
                }}
              >
                {plan.badge && (
                  <div
                    className={`ls-price-badge ${
                      isHighlighted ? 'ls-price-badge--hi' : ''
                    }`}
                  >
                    {isHighlighted && <span className="dot" />}
                    {plan.badge}
                  </div>
                )}

                <div className="ls-price-name">{plan.name}</div>
                <h3 className="ls-price-label">{plan.label}</h3>

                <div className="ls-price-cost">
                  <span className="setup">{plan.setupPrice}</span>
                </div>
                {plan.monthlyPrice && (
                  <p className="ls-price-monthly">{plan.monthlyPrice}</p>
                )}

                {storage && (
                  <div className="ls-price-storage">
                    <span className="lbl">Storage</span>
                    <span className="val">{storage}</span>
                  </div>
                )}

                <ul className="ls-price-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <span className="check" aria-hidden>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M2 7.5l3 3 7-7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.note && <p className="ls-price-plan-note">{plan.note}</p>}

                {isCustomInquiry ? (
                  <Link
                    href="/custom-inquiry"
                    className="ls-price-cta-link mt-auto inline-flex h-[46px] w-full items-center justify-center rounded-[12px] border border-[var(--ls-rule)] bg-transparent text-[0.9rem] font-semibold text-[var(--ls-ink)] transition-colors hover:border-[var(--ls-accent)] hover:text-[var(--ls-accent)]"
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <Button
                    onClick={() => handlePlanClick(plan.name.toLowerCase())}
                    className="mt-auto h-[46px] w-full text-[0.9rem]"
                  >
                    {plan.cta}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {pricing.secondaryCta && (
          <p className="ls-price-secondary-cta mt-10 mx-auto max-w-2xl text-center text-[14px] text-[var(--ls-ink-dim)]">
            {pricing.secondaryCta.lead}{' '}
            <Link
              href={pricing.secondaryCta.href}
              className="font-semibold text-[var(--ls-accent)] underline-offset-4 hover:underline"
            >
              {pricing.secondaryCta.label}
            </Link>
          </p>
        )}

        {pricing.socialProof && (
          <p className="mt-12 mx-auto max-w-2xl text-center text-[var(--ls-ink-dim)] text-[15px] leading-relaxed">
            {pricing.socialProof}
          </p>
        )}
        <p className="ls-price-note mt-4 mx-auto max-w-2xl text-center text-[13px]">
          {pricing.note}
        </p>
      </div>

      <PreQualModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        source="pricing-section"
        initialPlan={selectedPlan}
      />
    </section>
  );
}
