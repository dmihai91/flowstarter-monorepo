import { tServer } from '@/lib/i18n-server';
import { LANDING_COPY } from '../landing-copy';

export function DifferentiationSection() {
  const t = tServer as (key: string) => string;
  const diff = LANDING_COPY.differentiation;

  return (
    <section
      id="differentiation"
      className="ls-scope ls-section ls-section--pad"
    >
      <div className="ls-mesh" aria-hidden />{' '}
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
    </section>
  );
}
