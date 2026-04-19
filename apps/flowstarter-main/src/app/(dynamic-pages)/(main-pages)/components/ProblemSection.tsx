'use client';

import { useI18n } from '@/lib/i18n';
import { LandingIcon, type IconName } from './LandingIcons';
import { LANDING_COPY } from '../landing-copy';

export function ProblemSection() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const problem = LANDING_COPY.problem;

  return (
    <section
      id="problem"
      className="ls-scope ls-section ls-section--pad ls-fade-top"
    >
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
            <span className="num">{t('landing.problem.eyebrow')}</span>
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
            <span className="line">{t('landing.problem.headlinePrefix')}</span>
            <span className="line flourish mt-2">
              {t('landing.problem.headlineFlourish')}
            </span>
          </h2>

          <p className="ls-body ls-body--lead mt-7 mx-auto">
            {t('landing.problem.sub')}
          </p>
        </div>

        <div className="ls-problem-grid mt-14 grid gap-5 md:grid-cols-3 md:gap-6">
          {problem.pains.map((pain, i) => (
            <div
              key={pain.title}
              className="ls-card ls-problem-card"
              style={{
                animation: `ls-reveal 900ms cubic-bezier(0.19,1,0.22,1) ${
                  i * 100
                }ms both`,
              }}
            >
              <div className="ls-problem-icon">
                <LandingIcon name={pain.icon as IconName} className="h-4 w-4" />
              </div>
              <h3 className="ls-problem-title">{pain.title}</h3>
              <p className="ls-problem-body">{pain.body}</p>
            </div>
          ))}
        </div>

        <p className="ls-problem-closing mx-auto mt-14 max-w-2xl text-center">
          {problem.closing}
        </p>
      </div>

      <style jsx global>{`
        .ls-problem-card {
          padding: 1.75rem 1.6rem 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .ls-problem-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: color-mix(
            in oklab,
            var(--ls-accent-warm) 14%,
            transparent
          );
          color: var(--ls-accent-warm);
          border: 1px solid
            color-mix(in oklab, var(--ls-accent-warm) 28%, transparent);
        }
        .ls-problem-title {
          font-family: var(--ls-sans);
          font-size: 1.12rem;
          font-weight: 600;
          letter-spacing: -0.015em;
          line-height: 1.25;
          color: var(--ls-ink);
        }
        .ls-problem-body {
          font-family: var(--ls-sans);
          font-size: 0.92rem;
          line-height: 1.55;
          color: var(--ls-ink-dim);
        }
        .ls-problem-closing {
          font-family: var(--ls-sans);
          font-size: clamp(1.05rem, 1.3vw, 1.25rem);
          line-height: 1.5;
          color: var(--ls-ink-dim);
          padding-top: 2rem;
          border-top: 1px solid var(--ls-rule);
        }
      `}</style>
    </section>
  );
}