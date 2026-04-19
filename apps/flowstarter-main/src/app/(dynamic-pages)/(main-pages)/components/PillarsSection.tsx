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
      <div className="ls-mesh" aria-hidden />      <div className="ls-grain" aria-hidden />

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
              <div className="ls-pillar-icon" aria-hidden="true">
                <LandingIcon name={p.icon as IconName} className="h-5 w-5" />
              </div>
              <div className="ls-pillar-sub">{p.subtitle}</div>
              <h3 className="ls-pillar-title">{p.title}</h3>
              <p className="ls-pillar-body">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}