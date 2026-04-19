'use client';

import { useI18n } from '@/lib/i18n';
import { useFAQAccordion } from './hooks/useFAQAccordion';
import { LANDING_COPY } from '../landing-copy';

export function FAQSection() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const { openIndex, toggle } = useFAQAccordion(0);
  const faq = LANDING_COPY.faq;

  return (
    <section id="faq" className="ls-scope ls-section ls-section--pad">
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
            <span className="num">{t('landing.faq.eyebrow')}</span>
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
            <span className="line">{t('landing.faq.headlinePrefix')}</span>
            <span className="line flourish mt-2">
              {t('landing.faq.headlineFlourish')}
            </span>
          </h2>
        </div>

        <div className="ls-faq-list mx-auto mt-14 max-w-3xl">
          {faq.items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={item.question}
                className={`ls-faq-item ${isOpen ? 'open' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="ls-faq-trigger"
                  aria-expanded={isOpen}
                >
                  <span className="ls-faq-idx">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="ls-faq-q">{item.question}</span>
                  <span className="ls-faq-chev" aria-hidden>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
                <div className="ls-faq-body">
                  <p>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .ls-faq-item {
          border-top: 1px solid var(--ls-rule);
        }
        .ls-faq-item:last-child {
          border-bottom: 1px solid var(--ls-rule);
        }
        .ls-faq-trigger {
          display: flex;
          align-items: center;
          gap: 1rem;
          width: 100%;
          padding: 1.3rem 0;
          background: transparent;
          border: 0;
          text-align: left;
          cursor: pointer;
          color: var(--ls-ink);
          transition: padding 320ms ease;
        }
        .ls-faq-trigger:hover .ls-faq-q {
          color: var(--ls-accent);
        }
        .ls-faq-idx {
          font-family: var(--ls-mono);
          font-size: 10.5px;
          letter-spacing: 0.2em;
          color: var(--ls-ink-faint);
          flex-shrink: 0;
          min-width: 28px;
        }
        .ls-faq-q {
          flex: 1;
          font-family: var(--ls-sans);
          font-size: 1rem;
          font-weight: 500;
          letter-spacing: -0.01em;
          color: var(--ls-ink);
          transition: color 280ms ease;
        }
        .ls-faq-chev {
          display: inline-flex;
          width: 18px;
          height: 18px;
          color: var(--ls-ink-faint);
          transition: transform 320ms cubic-bezier(0.19, 1, 0.22, 1),
            color 280ms ease;
          flex-shrink: 0;
        }
        .ls-faq-item.open .ls-faq-chev {
          transform: rotate(180deg);
          color: var(--ls-accent);
        }
        .ls-faq-body {
          max-height: 0;
          overflow: hidden;
          padding-left: calc(28px + 1rem);
          transition: max-height 420ms cubic-bezier(0.19, 1, 0.22, 1);
        }
        .ls-faq-item.open .ls-faq-body {
          max-height: 520px;
          padding-bottom: 1.3rem;
        }
        .ls-faq-body p {
          font-family: var(--ls-sans);
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--ls-ink-dim);
          margin: 0;
          padding-right: 2rem;
        }
      `}</style>
    </section>
  );
}