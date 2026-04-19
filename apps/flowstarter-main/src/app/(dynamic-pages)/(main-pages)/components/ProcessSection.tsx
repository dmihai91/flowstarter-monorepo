'use client';

import { useI18n } from '@/lib/i18n';
import { LANDING_COPY } from '../landing-copy';

export function ProcessSection() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const process = LANDING_COPY.process;

  return (
    <section
      id="process"
      data-section="process"
      className="ls-scope ls-section ls-section--pad"
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
            <span className="num">{t('landing.process.eyebrow')}</span>
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
            <span className="line">{t('landing.process.headlinePrefix')}</span>
            <span className="line flourish mt-2">
              {t('landing.process.headlineFlourish')}
            </span>
          </h2>

          <p className="ls-body ls-body--lead mt-7 mx-auto">
            {t('landing.process.sub')}
          </p>
        </div>

        <div className="ls-process-grid mt-14 grid gap-5 md:grid-cols-3 md:gap-6 lg:gap-8">
          {process.steps.map((step, i) => (
            <div
              key={step.title}
              className="ls-card ls-process-card"
              style={{
                animation: `ls-reveal 900ms cubic-bezier(0.19,1,0.22,1) ${
                  i * 120
                }ms both`,
              }}
            >
              <div className="ls-process-num">{step.number}</div>
              <h3 className="ls-process-title">{step.title}</h3>
              <p className="ls-process-body">{step.description}</p>
              <div className="ls-process-rule" />
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .ls-process-card {
          padding: 1.75rem 1.75rem 2rem;
          position: relative;
          transition: transform 320ms cubic-bezier(0.19, 1, 0.22, 1),
            box-shadow 320ms ease;
        }
        .ls-process-card:hover {
          transform: translateY(-3px);
        }
        .ls-process-num {
          font-family: var(--ls-mono);
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.22em;
          color: var(--ls-accent);
          margin-bottom: 1rem;
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
        }
        .ls-process-num::before {
          content: '';
          display: inline-block;
          width: 24px;
          height: 1px;
          background: var(--ls-accent);
          opacity: 0.6;
        }
        .ls-process-title {
          font-family: var(--ls-sans);
          font-size: 1.35rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.15;
          color: var(--ls-ink);
          margin-bottom: 0.7rem;
        }
        .ls-process-body {
          font-family: var(--ls-sans);
          font-size: 0.95rem;
          line-height: 1.55;
          color: var(--ls-ink-dim);
          max-width: 40ch;
        }
        .ls-process-rule {
          position: absolute;
          left: 1.75rem;
          right: 1.75rem;
          bottom: 1.1rem;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--ls-rule) 40%,
            var(--ls-rule) 60%,
            transparent 100%
          );
        }
      `}</style>
    </section>
  );
}