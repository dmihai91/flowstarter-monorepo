import { tServer } from '@/lib/i18n-server';

export function SolutionSection() {
  const t = tServer as (key: string) => string;

  return (
    <section id="solution" className="ls-scope ls-section ls-section--pad">
      <div className="ls-mesh" aria-hidden />
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
            <span className="num">{t('landing.solution.eyebrow')}</span>
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
            <span className="line">{t('landing.solution.headlinePrefix')}</span>
            <span className="line flourish mt-2">
              {t('landing.solution.headlineFlourish')}
            </span>
          </h2>

          <p className="ls-body ls-body--lead mt-7 mx-auto">
            {t('landing.solution.paragraph1')}
          </p>

          <p className="ls-body ls-body--lead mt-5 mx-auto">
            {t('landing.solution.paragraph2')}
          </p>
        </div>
      </div>
    </section>
  );
}
