'use client';

import { useI18n } from '@/lib/i18n';
import { LANDING_COPY } from '../landing-copy';

export function DifferentiationSection() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const diff = LANDING_COPY.differentiation;

  return (
    <section
      id="differentiation"
      className="ls-scope ls-section ls-section--pad"
    >
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
            <span className="num">{t('landing.differentiation.eyebrow')}</span>
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
            <span className="line">
              {t('landing.differentiation.headlinePrefix')}
            </span>
            <span className="line flourish mt-2">
              {t('landing.differentiation.headlineFlourish')}
            </span>
          </h2>

          <p className="ls-body ls-body--lead mt-7 mx-auto">
            {t('landing.differentiation.sub')}
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3 md:gap-6">
          {diff.cards.map((c, i) => {
            const highlighted =
              'highlighted' in c &&
              (c as { highlighted?: boolean }).highlighted;
            const bullets =
              'bullets' in c
                ? (c as { bullets?: string[] }).bullets
                : undefined;
            return (
              <div
                key={c.label}
                className={`ls-card ls-diff-card ${
                  highlighted ? 'ls-diff-card--hi' : ''
                }`}
                style={{
                  animation: `ls-reveal 900ms cubic-bezier(0.19,1,0.22,1) ${
                    i * 130
                  }ms both`,
                }}
              >
                <div className="ls-diff-label">{c.label}</div>
                <p className="ls-diff-body">{c.description}</p>
                {bullets && bullets.length > 0 && (
                  <ul className="ls-diff-bullets">
                    {bullets.map((b) => (
                      <li key={b}>
                        <span className="ls-diff-check" aria-hidden>
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
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .ls-diff-card {
          padding: 1.75rem 1.6rem 1.9rem;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          transition: transform 320ms cubic-bezier(0.19, 1, 0.22, 1),
            border-color 320ms ease;
        }
        .ls-diff-card:hover {
          transform: translateY(-3px);
        }
        .ls-diff-card--hi {
          border-color: color-mix(in oklab, var(--ls-accent) 55%, transparent);
          background: linear-gradient(
            135deg,
            color-mix(in oklab, var(--ls-accent) 14%, var(--ls-glass-bg)),
            var(--ls-glass-bg) 60%
          );
        }
        .ls-diff-label {
          font-family: var(--ls-mono);
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ls-ink-faint);
        }
        .ls-diff-card--hi .ls-diff-label {
          color: var(--ls-accent);
        }
        .ls-diff-body {
          font-family: var(--ls-sans);
          font-size: 1rem;
          line-height: 1.5;
          color: var(--ls-ink);
          letter-spacing: -0.01em;
        }
        .ls-diff-bullets {
          list-style: none;
          margin: 0.6rem 0 0;
          padding: 0;
          border-top: 1px solid var(--ls-rule);
          padding-top: 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }
        .ls-diff-bullets li {
          font-family: var(--ls-sans);
          font-size: 0.88rem;
          line-height: 1.4;
          color: var(--ls-ink-dim);
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
        }
        .ls-diff-check {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--ls-accent);
          background: color-mix(in oklab, var(--ls-accent) 18%, transparent);
        }
      `}</style>
    </section>
  );
}
