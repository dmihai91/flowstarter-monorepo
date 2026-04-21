'use client';

import { useState } from 'react';
import { UnifiedButton } from '@/components/ui/unified-button';
import { useI18n } from '@/lib/i18n';
import { LANDING_COPY } from '../landing-copy';
import { PreQualModal } from './PreQualModal';

const STORAGE_BY_PLAN: Record<string, string> = {
  STARTER: '10 GB',
  RELAUNCH: '10 GB',
  GROWTH: '50 GB',
  PRO: '150 GB',
};

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

          {pricing.socialProof && (
            <p
              className="mt-5"
              style={{
                fontFamily: 'var(--ls-mono)',
                fontSize: '10.5px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--ls-accent)',
              }}
            >
              ● {pricing.socialProof}
            </p>
          )}
        </div>

        <div className="ls-pricing-grid mt-14 grid gap-5 sm:grid-cols-2 md:gap-6">
          {pricing.plans.map((plan, i) => {
            const isHighlighted = plan.recommended === true;
            const isComingSoon = plan.status === 'coming-soon';
            const storage = STORAGE_BY_PLAN[plan.name];
            return (
              <div
                key={plan.name}
                className={`ls-card ls-price-card ${
                  isHighlighted ? 'ls-price-card--hi' : ''
                } ${isComingSoon ? 'ls-price-card--soon' : ''}`}
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
                  <span className="setup-label">setup</span>
                </div>
                <p className="ls-price-monthly">{plan.monthlyPrice}</p>

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

                {isComingSoon ? (
                  <UnifiedButton
                    disabled
                    tone="secondary"
                    className="mt-auto h-[46px] w-full text-[0.9rem] opacity-55"
                  >
                    {plan.cta}
                  </UnifiedButton>
                ) : isHighlighted ? (
                  <UnifiedButton
                    onClick={() => handlePlanClick(plan.name.toLowerCase())}
                    className="mt-auto h-[46px] w-full text-[0.9rem]"
                  >
                    {plan.cta}
                  </UnifiedButton>
                ) : (
                  <UnifiedButton
                    tone="secondary"
                    onClick={() => handlePlanClick(plan.name.toLowerCase())}
                    className="mt-auto h-[46px] w-full text-[0.9rem]"
                  >
                    {plan.cta}
                  </UnifiedButton>
                )}
              </div>
            );
          })}
        </div>

        <p className="ls-price-note mt-10 mx-auto max-w-2xl text-center">
          {pricing.note}
        </p>
        {pricing.relaunchNote && (
          <p className="ls-price-relaunch mt-3 mx-auto max-w-2xl text-center">
            {pricing.relaunchNote}
          </p>
        )}
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
