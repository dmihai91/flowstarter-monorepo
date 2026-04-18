'use client';

import { useI18n } from '@/lib/i18n';

export function ManifestoSection() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;

  const paragraphs = ['p1', 'p2', 'p3', 'p4']
    .map((k) => t(`landing.manifesto.${k}`))
    .filter((v) => v && !v.startsWith('landing.manifesto'));

  return (
    <section
      data-section="manifesto"
      className="ls-scope ls-section ls-section--pad"
    >
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
            <span className="num">{t('landing.manifesto.eyebrow')}</span>
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
              {t('landing.manifesto.headlinePrefix')}
            </span>
            <span className="line flourish mt-2">
              {t('landing.manifesto.headlineFlourish')}
            </span>
          </h2>
        </div>

        {paragraphs.length > 0 && (
          <div className="ls-manifesto-body mx-auto mt-14 max-w-[60ch]">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        <div className="ls-manifesto-pull mx-auto mt-10 max-w-[60ch]">
          <div className="ls-manifesto-rule" aria-hidden />
          <p>{t('landing.manifesto.closing')}</p>
        </div>
      </div>

      <style jsx global>{`
        .ls-manifesto-body {
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
          text-align: center;
        }
        .ls-manifesto-body p {
          font-family: var(--ls-sans);
          font-size: clamp(1rem, 1.2vw, 1.15rem);
          line-height: 1.7;
          color: var(--ls-ink-dim);
          margin: 0;
        }
        .ls-manifesto-pull {
          text-align: center;
          padding: 2rem 1.5rem 0;
          border-top: 1px solid var(--ls-rule);
          margin-top: 3rem;
          position: relative;
        }
        .ls-manifesto-pull p {
          font-family: var(--ls-sans);
          font-size: clamp(1.35rem, 2.3vw, 1.85rem);
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.3;
          color: var(--ls-ink);
          margin: 0;
        }
      `}</style>
    </section>
  );
}
