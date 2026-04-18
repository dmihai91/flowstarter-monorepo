'use client';

import { useI18n } from '@/lib/i18n';
import { LandingIcon, type IconName } from './LandingIcons';
import { LANDING_COPY } from '../landing-copy';

export function AudienceSection() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const audience = LANDING_COPY.audience;

  return (
    <section
      id="audience"
      className="ls-scope ls-section ls-section--pad ls-fade-top"
    >
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
            <span className="num">{t('landing.audience.eyebrow')}</span>
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
            <span className="line">{t('landing.audience.headlinePrefix')}</span>
            <span className="line flourish mt-2">
              {t('landing.audience.headlineFlourish')}
            </span>
          </h2>

          <p className="ls-body ls-body--lead mt-7 mx-auto">
            {t('landing.audience.sub')}
          </p>
        </div>

        <div className="ls-audience-grid mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {audience.items.map((item, i) => (
            <div
              key={item.label}
              className="ls-card ls-audience-card"
              style={{
                padding: '1.25rem 1.25rem 1.4rem',
                animation: `ls-reveal 800ms cubic-bezier(0.19,1,0.22,1) ${
                  i * 60
                }ms both`,
              }}
            >
              <div className="ls-audience-icon">
                <LandingIcon name={item.icon as IconName} className="h-4 w-4" />
              </div>
              <p className="ls-audience-label">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes ls-reveal {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .ls-audience-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.9rem;
          transition: transform 320ms cubic-bezier(0.19, 1, 0.22, 1),
            border-color 320ms ease, box-shadow 320ms ease;
        }
        .ls-audience-card:hover {
          transform: translateY(-2px);
          border-color: color-mix(in oklab, var(--ls-accent) 45%, transparent);
        }
        .ls-audience-icon {
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
        .ls-audience-label {
          font-family: var(--ls-sans);
          font-size: 0.92rem;
          font-weight: 500;
          line-height: 1.45;
          color: var(--ls-ink);
          letter-spacing: -0.005em;
        }
      `}</style>
    </section>
  );
}
