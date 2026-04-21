'use client';

import { useI18n } from '@/lib/i18n';
import { LANDING_COPY } from '../landing-copy';

export function TestimonialsSection() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const data = LANDING_COPY.testimonials;

  return (
    <section id="testimonials" className="ls-scope ls-section ls-section--pad">
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
    </section>
  );
}
