'use client';

import { useI18n } from '@/lib/i18n';
import { LANDING_COPY } from '../landing-copy';

export function TestimonialsSection() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const data = LANDING_COPY.testimonials;

  return (
    <section id="testimonials" className="ls-scope ls-section ls-section--pad">
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
            <span className="num">{t('landing.testimonials.eyebrow')}</span>
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
              {t('landing.testimonials.headlinePrefix')}
            </span>
            <span className="line flourish mt-2">
              {t('landing.testimonials.headlineFlourish')}
            </span>
          </h2>
          <p
            className="ls-body mt-5"
            style={{
              color: 'var(--ls-ink-faint)',
              fontFamily: 'var(--ls-mono)',
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            {data.subtitle}
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3 md:gap-6">
          {data.items.map((item, i) => (
            <figure
              key={item.name}
              className="ls-card ls-testimonial-card"
              style={{
                animation: `ls-reveal 900ms cubic-bezier(0.19,1,0.22,1) ${
                  i * 110
                }ms both`,
              }}
            >
              <div className="ls-testimonial-mark" aria-hidden>
                &ldquo;
              </div>
              <blockquote className="ls-testimonial-quote">
                {item.quote}
              </blockquote>
              <figcaption className="ls-testimonial-cap">
                <span className="ls-testimonial-initials">{item.initials}</span>
                <span className="ls-testimonial-meta">
                  <span className="name">{item.name}</span>
                  <span className="role">{item.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .ls-testimonial-card {
          padding: 2rem 1.75rem 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          position: relative;
        }
        .ls-testimonial-mark {
          font-family: var(--ls-sans);
          font-size: 4rem;
          font-weight: 700;
          line-height: 0.7;
          color: var(--ls-accent);
          opacity: 0.4;
          margin-bottom: -0.5rem;
        }
        .ls-testimonial-quote {
          font-family: var(--ls-sans);
          font-size: 1rem;
          line-height: 1.55;
          color: var(--ls-ink);
          margin: 0;
          font-weight: 400;
        }
        .ls-testimonial-cap {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding-top: 1rem;
          border-top: 1px solid var(--ls-rule);
          margin-top: auto;
        }
        .ls-testimonial-initials {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 999px;
          background: color-mix(in oklab, var(--ls-accent) 14%, transparent);
          color: var(--ls-accent);
          font-family: var(--ls-mono);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.05em;
          border: 1px solid
            color-mix(in oklab, var(--ls-accent) 24%, transparent);
        }
        .ls-testimonial-meta {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .ls-testimonial-meta .name {
          font-family: var(--ls-sans);
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--ls-ink);
        }
        .ls-testimonial-meta .role {
          font-family: var(--ls-mono);
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--ls-ink-faint);
        }
      `}</style>
    </section>
  );
}