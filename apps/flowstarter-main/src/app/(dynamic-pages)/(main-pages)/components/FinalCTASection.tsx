'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

export function FinalCTASection({ onOpenModal }: { onOpenModal?: () => void }) {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    if (mq.matches) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--ls-mx', `${x}%`);
      el.style.setProperty('--ls-my', `${y}%`);
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section ref={rootRef} className="ls-scope ls-section ls-cta-section">
      <div className="ls-cta-bg" aria-hidden />
      <div className="ls-cta-glow" aria-hidden />
      <div className="ls-streak" aria-hidden />
      <div className="ls-grain" aria-hidden />

      <div className="ls-container text-center">
        <div
          className="ls-eyebrow mx-auto inline-flex items-center justify-center gap-3"
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
          <span className="num">{t('landing.finalCta.eyebrow')}</span>
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
          <span className="line">{t('landing.finalCta.headlinePrefix')}</span>
          <span className="line flourish mt-2">
            {t('landing.finalCta.headlineFlourish')}
          </span>
        </h2>

        <p
          className="ls-body ls-body--lead mt-7 mx-auto"
          style={{ marginLeft: 'auto', marginRight: 'auto' }}
        >
          {t('landing.finalCta.subhead')}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-5">
          <Button onClick={() => onOpenModal?.()} className="ls-cta">
            {t('landing.finalCta.primaryCta')}
            <svg
              className="arrow ml-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.4}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14m-5-6l6 6-6 6"
              />
            </svg>
          </Button>
        </div>

        <p
          className="mt-6 text-[10.5px] uppercase tracking-[0.18em]"
          style={{
            color: 'var(--ls-ink-faint)',
            fontFamily: 'var(--ls-mono)',
          }}
        >
          {t('landing.finalCta.microNote')}
        </p>
      </div>
    </section>
  );
}
