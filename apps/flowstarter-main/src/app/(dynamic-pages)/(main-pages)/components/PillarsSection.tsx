'use client';

import { useI18n } from '@/lib/i18n';
import { LandingIcon, type IconName } from './LandingIcons';
import { LANDING_COPY } from '../landing-copy';

export function PillarsSection() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const pillars = LANDING_COPY.pillars;

  return (
    <section id="pillars" className="ls-scope ls-section ls-section--pad">
      <div className="ls-mesh" aria-hidden />
      <div className="ls-orb ls-orb--warm ls-orb--br" aria-hidden />
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
            <span className="num">{t('landing.pillars.eyebrow')}</span>
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
            <span className="line">{t('landing.pillars.headlinePrefix')}</span>
            <span className="line flourish mt-2">
              {t('landing.pillars.headlineFlourish')}
            </span>
          </h2>

          <p className="ls-body ls-body--lead mt-7 mx-auto">
            {t('landing.pillars.sub')}
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3 md:gap-6">
          {pillars.items.map((p, i) => (
            <div
              key={p.title}
              className="ls-card ls-pillar-card"
              style={{
                animation: `ls-reveal 900ms cubic-bezier(0.19,1,0.22,1) ${
                  i * 120
                }ms both`,
              }}
            >
              <div className="ls-pillar-icon">
                <LandingIcon name={p.icon as IconName} className="h-5 w-5" />
              </div>
              <div className="ls-pillar-sub">{p.subtitle}</div>
              <h3 className="ls-pillar-title">{p.title}</h3>
              <p className="ls-pillar-body">{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .ls-pillar-card {
          padding: 2rem 1.75rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          transition: transform 320ms cubic-bezier(0.19, 1, 0.22, 1),
            border-color 320ms ease;
        }
        .ls-pillar-card:hover {
          transform: translateY(-3px);
          border-color: color-mix(in oklab, var(--ls-accent) 45%, transparent);
        }
        .ls-pillar-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: color-mix(in oklab, var(--ls-accent) 14%, transparent);
          color: var(--ls-accent);
          border: 1px solid
            color-mix(in oklab, var(--ls-accent) 28%, transparent);
          margin-bottom: 0.4rem;
        }
        .ls-pillar-sub {
          font-family: var(--ls-mono);
          font-size: 10.5px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ls-ink-faint);
        }
        .ls-pillar-title {
          font-family: var(--ls-sans);
          font-size: 1.3rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.2;
          color: var(--ls-ink);
        }
        .ls-pillar-body {
          font-family: var(--ls-sans);
          font-size: 0.93rem;
          line-height: 1.6;
          color: var(--ls-ink-dim);
        }
      `}</style>
    </section>
  );
}
