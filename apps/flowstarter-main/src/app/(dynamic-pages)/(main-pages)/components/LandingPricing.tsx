'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
                  <button
                    type="button"
                    disabled
                    className="ls-price-cta ls-price-cta--disabled"
                  >
                    {plan.cta}
                  </button>
                ) : isHighlighted ? (
                  <Button
                    onClick={() => handlePlanClick(plan.name.toLowerCase())}
                    className="ls-cta ls-price-cta-primary"
                  >
                    {plan.cta}
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePlanClick(plan.name.toLowerCase())}
                    className="ls-price-cta ls-price-cta--ghost"
                  >
                    {plan.cta}
                  </button>
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

      <style jsx global>{`
        .ls-price-card {
          padding: 1.75rem 1.6rem 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          transition: transform 320ms cubic-bezier(0.19, 1, 0.22, 1),
            border-color 320ms ease;
          position: relative;
        }
        .ls-price-card:hover {
          transform: translateY(-3px);
        }
        .ls-price-card--hi {
          border-color: color-mix(in oklab, var(--ls-accent) 60%, transparent);
          background: linear-gradient(
            135deg,
            color-mix(in oklab, var(--ls-accent) 12%, var(--ls-glass-bg)),
            var(--ls-glass-bg) 60%
          );
        }
        .ls-price-card--soon {
          opacity: 0.55;
          filter: saturate(60%);
          pointer-events: none;
        }
        .ls-price-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          align-self: flex-start;
          font-family: var(--ls-mono);
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 0.3rem 0.7rem;
          border-radius: 999px;
          background: color-mix(in oklab, var(--ls-ink) 8%, transparent);
          color: var(--ls-ink-dim);
          border: 1px solid var(--ls-rule);
        }
        .ls-price-badge--hi {
          background: var(--ls-accent);
          color: #fff;
          border-color: var(--ls-accent);
          box-shadow: 0 4px 12px
            color-mix(in oklab, var(--ls-accent) 40%, transparent);
        }
        .ls-price-badge .dot {
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: #fff;
          animation: ls-pulse 2s ease-in-out infinite;
        }
        .ls-price-name {
          font-family: var(--ls-mono);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--ls-accent);
        }
        .ls-price-label {
          font-family: var(--ls-sans);
          font-size: 1.15rem;
          font-weight: 600;
          letter-spacing: -0.015em;
          color: var(--ls-ink);
          line-height: 1.25;
        }
        .ls-price-cost {
          display: flex;
          align-items: baseline;
          gap: 0.6rem;
          padding-top: 0.7rem;
          border-top: 1px solid var(--ls-rule);
          margin-top: 0.3rem;
        }
        .ls-price-cost .setup {
          font-family: var(--ls-sans);
          font-size: 2.1rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: var(--ls-ink);
        }
        .ls-price-cost .setup-label {
          font-family: var(--ls-sans);
          font-size: 0.88rem;
          color: var(--ls-ink-faint);
        }
        .ls-price-monthly {
          font-family: var(--ls-sans);
          font-size: 0.92rem;
          color: var(--ls-ink-dim);
          margin: 0;
        }
        .ls-price-storage {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          align-self: flex-start;
          padding: 0.45rem 0.8rem;
          border-radius: 10px;
          background: color-mix(in oklab, var(--ls-accent) 10%, transparent);
          border: 1px solid
            color-mix(in oklab, var(--ls-accent) 24%, transparent);
          font-family: var(--ls-mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 0.1rem;
        }
        .ls-price-storage .lbl {
          color: var(--ls-ink-faint);
        }
        .ls-price-storage .val {
          color: var(--ls-ink);
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .ls-price-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          flex: 1;
          padding-top: 0.4rem;
          border-top: 1px dashed var(--ls-rule);
        }
        .ls-price-features li {
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          font-family: var(--ls-sans);
          font-size: 0.88rem;
          line-height: 1.45;
          color: var(--ls-ink-dim);
        }
        .ls-price-features .check {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--ls-accent);
          margin-top: 1px;
        }
        .ls-price-cta {
          margin-top: auto;
          width: 100%;
          height: 46px;
          border-radius: 12px;
          border: 1px solid var(--ls-accent);
          background: transparent;
          color: var(--ls-accent);
          font-family: var(--ls-sans);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 260ms cubic-bezier(0.19, 1, 0.22, 1);
        }
        .ls-price-cta--ghost:hover {
          background: var(--ls-accent);
          color: #fff;
        }
        .ls-price-cta--disabled {
          border-color: var(--ls-rule);
          color: var(--ls-ink-faint);
          cursor: not-allowed;
        }
        .ls-price-cta-primary {
          margin-top: auto;
          width: 100%;
          justify-content: center;
        }
        .ls-price-note {
          font-family: var(--ls-sans);
          font-size: 0.95rem;
          color: var(--ls-ink-dim);
        }
        .ls-price-relaunch {
          font-family: var(--ls-sans);
          font-size: 0.85rem;
          color: var(--ls-ink-faint);
        }
      `}</style>
    </section>
  );
}
