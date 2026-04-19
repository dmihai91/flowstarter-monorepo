'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

const PROGRESS_STEPS = 4;

function useBriefTypewriter(
  sequence: { label: string; value: string }[],
  startDelay: number
) {
  const [values, setValues] = useState<string[]>(() => sequence.map(() => ''));
  const [activeIndex, setActiveIndex] = useState(-1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = setTimeout(resolve, ms);
        timers.push(id);
      });

    const run = async () => {
      await sleep(startDelay);
      for (let step = 0; step < sequence.length; step++) {
        if (cancelled) return;
        setActiveIndex(step);
        const target = sequence[step].value;
        for (let i = 1; i <= target.length; i++) {
          if (cancelled) return;
          setValues((prev) => {
            const next = prev.slice();
            next[step] = target.slice(0, i);
            return next;
          });
          await sleep(28 + Math.random() * 32);
        }
        await sleep(520);
      }
      if (!cancelled) {
        setActiveIndex(sequence.length);
        setDone(true);
      }
    };

    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [sequence, startDelay]);

  return { values, activeIndex, done };
}

export function LandingHero({ onOpenModal }: { onOpenModal?: () => void }) {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const rootRef = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, []);

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

  const briefSequence = useMemo(
    () => [
      {
        label: t('landing.hero.brief.field1Label'),
        value: t('landing.hero.brief.field1Value'),
      },
      {
        label: t('landing.hero.brief.field2Label'),
        value: t('landing.hero.brief.field2Value'),
      },
      {
        label: t('landing.hero.brief.field3Label'),
        value: t('landing.hero.brief.field3Value'),
      },
    ],
    [t]
  );

  const {
    values: briefValues,
    activeIndex,
    done: briefDone,
  } = useBriefTypewriter(briefSequence, 900);

  const reveal = (order: number): React.CSSProperties => ({
    opacity: revealed ? 1 : 0,
    transform: revealed ? 'translateY(0)' : 'translateY(22px)',
    transition: `opacity 900ms cubic-bezier(0.19,1,0.22,1) ${
      order * 110
    }ms, transform 900ms cubic-bezier(0.19,1,0.22,1) ${order * 110}ms`,
  });

  const filled = briefDone
    ? PROGRESS_STEPS
    : Math.min(PROGRESS_STEPS - 1, Math.max(0, activeIndex));

  const stats = [
    { val: t('landing.hero.stat1Value'), lbl: t('landing.hero.stat1Label') },
    { val: t('landing.hero.stat2Value'), lbl: t('landing.hero.stat2Label') },
    { val: t('landing.hero.stat3Value'), lbl: t('landing.hero.stat3Label') },
    { val: t('landing.hero.stat4Value'), lbl: t('landing.hero.stat4Label') },
  ];

  return (
    <section
      ref={rootRef}
      className="ls-scope ls-section ls-section--pad-lg ls-fade-bottom"
      style={{ minHeight: '100svh' }}
    >
      <style jsx global>{`
        .ls-hero-trust {
          border-color: var(--ls-rule);
          padding-top: 1.6rem;
        }
        .ls-hero-stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0 1.4rem;
          border-left: 1px solid var(--ls-rule);
        }
        .ls-hero-stat:first-child {
          padding-left: 0;
          border-left: 0;
        }
        .ls-hero-stat .val {
          font-family: var(--ls-mono);
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--ls-ink);
          letter-spacing: -0.01em;
        }
        .ls-hero-stat .lbl {
          font-family: var(--ls-sans);
          font-size: 0.72rem;
          color: var(--ls-ink-faint);
          letter-spacing: 0.03em;
        }

        .ls-brief-hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 1.1rem;
          margin-bottom: 1.2rem;
          border-bottom: 1px solid var(--ls-rule);
        }
        .ls-brief-live {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          font-family: var(--ls-mono);
          font-size: 10.5px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ls-ink-dim);
        }
        .ls-brief-live .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          animation: ls-pulse 2s ease-in-out infinite;
        }
        .dark .ls-brief-live .dot {
          background: #6cf2a0;
        }
        @keyframes ls-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
          }
        }
        .ls-brief-serial {
          font-family: var(--ls-mono);
          font-size: 10.5px;
          letter-spacing: 0.2em;
          color: var(--ls-ink-faint);
        }
        .ls-brief-title {
          font-family: var(--ls-sans);
          font-weight: 600;
          letter-spacing: -0.02em;
          font-size: 1.5rem;
          line-height: 1.1;
          color: var(--ls-ink);
          margin-bottom: 0.35rem;
        }
        .ls-brief-subtitle {
          font-family: var(--ls-mono);
          font-size: 10.5px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ls-ink-faint);
          margin-bottom: 1.3rem;
        }
        .ls-brief-delivery {
          margin-top: 1.2rem;
          padding-top: 1.1rem;
          border-top: 1px solid var(--ls-rule);
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .ls-brief-delivery .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .ls-brief-delivery .lbl {
          font-family: var(--ls-mono);
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ls-ink-faint);
        }
        .ls-brief-delivery .val {
          font-family: var(--ls-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          color: var(--ls-ink-dim);
        }
        .ls-brief-finish {
          margin-top: 1.3rem;
          width: 100%;
          height: 44px;
          border-radius: 12px;
          background: transparent;
          border: 1px solid var(--ls-rule);
          color: var(--ls-ink);
          font-family: var(--ls-sans);
          font-size: 0.88rem;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: background 220ms ease, border-color 220ms ease,
            transform 220ms ease;
        }
        .ls-brief-finish:hover {
          background: var(--ls-rule);
          border-color: var(--ls-ink-faint);
          transform: translateY(-1px);
        }
        .ls-brief-finish.ready {
          background: linear-gradient(
            135deg,
            color-mix(in oklab, var(--ls-accent) 14%, transparent),
            color-mix(in oklab, var(--ls-accent-warm) 12%, transparent)
          );
          border-color: var(--ls-accent);
        }
      `}</style>

      <div className="ls-mesh" aria-hidden />      <div className="ls-streak" aria-hidden />
      <div className="ls-grain" aria-hidden />

      <div className="ls-container">
        <div className="grid items-center gap-10 md:grid-cols-[1.15fr_0.85fr] md:gap-14 lg:gap-20">
          <div>
            <div
              style={reveal(0)}
              className="ls-eyebrow flex flex-wrap items-center gap-1"
            >
              <span className="num">{t('landing.hero.eyebrowSerial')}</span>
              <span className="dot">·</span>
              <span>{t('landing.hero.eyebrowLabel')}</span>
              <span className="dot">·</span>
              <span>{t('landing.hero.eyebrowTagline')}</span>
            </div>

            <h1 className="ls-display mt-9">
              <span className="line" style={reveal(1)}>
                {t('landing.hero.displayPrefix')}
              </span>
              <span className="line flourish mt-2" style={reveal(2)}>
                {t('landing.hero.displayFlourish')}
              </span>
            </h1>

            <p style={reveal(3)} className="ls-body ls-body--lead mt-8">
              {t('landing.hero.subhead')}
            </p>

            <div
              style={reveal(4)}
              className="mt-10 flex flex-wrap items-center gap-6"
            >
              <Button onClick={() => onOpenModal?.()} className="ls-cta">
                {t('landing.hero.primaryCta')}
                <svg
                  className="arrow ml-2 h-4 w-4"
                  aria-hidden="true"
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
              <a
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById('pricing')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="ls-link"
              >
                {t('landing.hero.secondaryCta')}
              </a>
            </div>

            <p
              style={{
                ...reveal(5),
                color: 'var(--ls-ink-faint)',
                fontFamily: 'var(--ls-mono)',
              }}
              className="mt-5 text-[10.5px] uppercase tracking-[0.18em]"
            >
              {t('landing.hero.guaranteeShort')}
            </p>

            <div
              style={reveal(6)}
              className="ls-hero-trust mt-10 flex flex-wrap items-stretch border-t"
            >
              {stats.map((s) => (
                <div key={s.lbl} className="ls-hero-stat">
                  <span className="val">{s.val}</span>
                  <span className="lbl">{s.lbl}</span>
                </div>
              ))}
            </div>

            <div
              style={reveal(7)}
              className="mt-6 flex flex-wrap items-center gap-3"
            >
              <span className="ls-pill ls-pill--accent">
                {t('landing.storage.tagline')}
              </span>
              <span className="ls-pill">
                {t('landing.storage.starter.tier')}{' '}
                <b style={{ color: 'var(--ls-ink)', fontWeight: 600 }}>
                  {t('landing.storage.starter.amount')}
                </b>
              </span>
              <span className="ls-pill">
                {t('landing.storage.growth.tier')}{' '}
                <b style={{ color: 'var(--ls-ink)', fontWeight: 600 }}>
                  {t('landing.storage.growth.amount')}
                </b>
              </span>
              <span className="ls-pill">
                {t('landing.storage.pro.tier')}{' '}
                <b style={{ color: 'var(--ls-ink)', fontWeight: 600 }}>
                  {t('landing.storage.pro.amount')}
                </b>
              </span>
            </div>
          </div>

          <aside
            style={{
              ...reveal(2),
              transform: revealed
                ? 'translateY(0) translateX(0)'
                : 'translateY(22px) translateX(16px)',
            }}
            className="ls-card ls-brief"
          >
            <div className="ls-brief-hdr">
              <span className="ls-brief-live">
                <span className="dot" />
                {t('landing.hero.brief.live')}
              </span>
              <span className="ls-brief-serial">
                {t('landing.hero.brief.serial')}
              </span>
            </div>

            <div className="ls-brief-title">
              {t('landing.hero.brief.title')}
            </div>
            <div className="ls-brief-subtitle">
              {t('landing.hero.brief.subtitle')}
            </div>

            {briefSequence.map((field, i) => {
              const shown = briefValues[i];
              const isActive = activeIndex === i && !briefDone;
              const isPending = activeIndex < i;
              return (
                <div key={field.label} className="ls-field">
                  <span className="lbl">{field.label}</span>
                  <span
                    className="val"
                    style={{ opacity: isPending ? 0.3 : 1 }}
                  >
                    {isPending ? '·' : shown || '\u00A0'}
                    {isActive && <span className="ls-caret" />}
                  </span>
                </div>
              );
            })}

            <div className="ls-brief-delivery">
              <div className="row">
                <span className="lbl">
                  {t('landing.hero.brief.progressLabel')}
                </span>
                <span className="val">
                  {briefDone
                    ? t('landing.hero.brief.progressReady')
                    : t('landing.hero.brief.progressBuilding')}
                </span>
              </div>
              <div className="ls-bar">
                {Array.from({ length: PROGRESS_STEPS }).map((_, i) => (
                  <div
                    key={i}
                    className={`ls-bar-cell ${i < filled ? 'on' : ''}`}
                    style={{ animationDelay: `${i * 90}ms` }}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenModal?.()}
              className={`ls-brief-finish ${briefDone ? 'ready' : ''}`}
            >
              {briefDone
                ? t('landing.hero.brief.ctaReady')
                : t('landing.hero.brief.ctaPending')}
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12h14m-5-6l6 6-6 6"
                />
              </svg>
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}