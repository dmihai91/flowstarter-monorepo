'use client';

import { useI18n } from '@/lib/i18n';
import { LandingIcon, type IconName } from './LandingIcons';
import { LANDING_COPY } from '../landing-copy';

export function IncludedSection() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const included = LANDING_COPY.included;

  return (
    <section id="included" className="ls-scope ls-section ls-section--pad">
      <div className="ls-mesh" aria-hidden />
      <div className="ls-orb ls-orb--violet ls-orb--tl" aria-hidden />
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
            <span className="num">{t('landing.included.eyebrow')}</span>
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
            <span className="line">{t('landing.included.headlinePrefix')}</span>
            <span className="line flourish mt-2">
              {t('landing.included.headlineFlourish')}
            </span>
          </h2>

          <p className="ls-body ls-body--lead mt-7 mx-auto">
            {t('landing.included.sub')}
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {included.cards.map((c, i) => (
            <div
              key={c.title}
              className="ls-card ls-included-card"
              style={{
                animation: `ls-reveal 900ms cubic-bezier(0.19,1,0.22,1) ${
                  i * 70
                }ms both`,
              }}
            >
              <div className="ls-included-icon">
                <LandingIcon name={c.icon as IconName} className="h-4 w-4" />
              </div>
              <h3 className="ls-included-title">{c.title}</h3>
              <p className="ls-included-body">{c.description}</p>
            </div>
          ))}

          {/* Storage promise — featured line item */}
          <div
            className="ls-card ls-included-card ls-included-card--featured"
            style={{
              animation: `ls-reveal 900ms cubic-bezier(0.19,1,0.22,1) ${
                included.cards.length * 70
              }ms both`,
            }}
          >
            <div className="ls-included-icon ls-included-icon--accent">
              <LandingIcon name={'hardDrive' as IconName} className="h-4 w-4" />
            </div>
            <h3 className="ls-included-title">
              {t('landing.storage.tagline')}
            </h3>
            <p className="ls-included-body">
              {t('landing.storage.includedNote')}
            </p>
            <div className="ls-included-chips">
              <span className="ls-included-chip">
                {t('landing.storage.starter.tier')}{' '}
                <b>{t('landing.storage.starter.amount')}</b>
              </span>
              <span className="ls-included-chip">
                {t('landing.storage.growth.tier')}{' '}
                <b>{t('landing.storage.growth.amount')}</b>
              </span>
              <span className="ls-included-chip">
                {t('landing.storage.pro.tier')}{' '}
                <b>{t('landing.storage.pro.amount')}</b>
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .ls-included-card {
          padding: 1.5rem 1.5rem 1.55rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          transition: transform 320ms cubic-bezier(0.19, 1, 0.22, 1),
            border-color 320ms ease;
        }
        .ls-included-card:hover {
          transform: translateY(-2px);
          border-color: color-mix(in oklab, var(--ls-accent) 42%, transparent);
        }
        .ls-included-card--featured {
          border-color: color-mix(in oklab, var(--ls-accent) 45%, transparent);
          background: linear-gradient(
            135deg,
            color-mix(in oklab, var(--ls-accent) 10%, var(--ls-glass-bg)),
            var(--ls-glass-bg) 60%
          );
        }
        .ls-included-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: color-mix(in oklab, var(--ls-accent) 12%, transparent);
          color: var(--ls-accent);
          border: 1px solid
            color-mix(in oklab, var(--ls-accent) 24%, transparent);
        }
        .ls-included-icon--accent {
          background: color-mix(in oklab, var(--ls-accent) 22%, transparent);
        }
        .ls-included-title {
          font-family: var(--ls-sans);
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: -0.015em;
          line-height: 1.25;
          color: var(--ls-ink);
        }
        .ls-included-body {
          font-family: var(--ls-sans);
          font-size: 0.88rem;
          line-height: 1.55;
          color: var(--ls-ink-dim);
        }
        .ls-included-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 0.55rem;
        }
        .ls-included-chip {
          font-family: var(--ls-mono);
          font-size: 10.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.35rem 0.65rem;
          border-radius: 8px;
          background: color-mix(in oklab, var(--ls-accent) 8%, transparent);
          color: var(--ls-ink-dim);
          border: 1px solid var(--ls-rule);
        }
        .ls-included-chip b {
          color: var(--ls-ink);
          font-weight: 600;
          margin-left: 0.2rem;
        }
      `}</style>
    </section>
  );
}
