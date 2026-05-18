'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/unified-button';
import { useI18n } from '@/lib/i18n';
import { useBookingModal } from './booking-modal-store';

const PROGRESS_STEPS = 4;

/** Ensures starter price stat always shows a qualifier (covers stale bundles / shard drift). */
function heroStatValueWithQualifier(statIndex: number, val: string): string {
  if (statIndex !== 1) return val;
  const t = val.trim();
  if (/^(starting from|from)\s/i.test(t)) return val;
  return `Starting from ${t}`;
}

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

export function LandingHero() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const openBookingModal = useBookingModal((s) => s.open);
  // Always revealed — entrance animation via CSS, not JS state.
  // JS-gated opacity caused hero flash/reflow on Android Chrome on first paint.
  const revealed = true;

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
      {
        label: t('landing.hero.brief.field4Label'),
        value: t('landing.hero.brief.field4Value'),
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
    {
      val: heroStatValueWithQualifier(1, t('landing.hero.stat2Value')),
      lbl: t('landing.hero.stat2Label'),
    },
    { val: t('landing.hero.stat3Value'), lbl: t('landing.hero.stat3Label') },
    { val: t('landing.hero.stat4Value'), lbl: t('landing.hero.stat4Label') },
  ];

  return (
    <section
      className="ls-scope ls-section ls-section--pad-lg ls-fade-bottom"
      style={{
        minHeight: '100svh',
        paddingTop: 'clamp(4.5rem, 9vh, 6.5rem)',
        paddingBottom: 'clamp(3rem, 6vh, 5rem)',
      }}
    >
      <div className="ls-container">
        <div className="grid items-center gap-10 md:grid-cols-[1.15fr_0.85fr] md:gap-14 lg:gap-20">
          <div className="ls-hero-content">
            <div
              style={reveal(0)}
              className="ls-eyebrow flex flex-wrap items-center gap-1"
            >
              <span>{t('landing.hero.eyebrowSerial')}</span>
              {t('landing.hero.eyebrowLabel') && (
                <>
                  <span className="dot">·</span>
                  <span>{t('landing.hero.eyebrowLabel')}</span>
                </>
              )}
              {t('landing.hero.eyebrowTagline') && (
                <>
                  <span className="dot">·</span>
                  <span>{t('landing.hero.eyebrowTagline')}</span>
                </>
              )}
            </div>

            <h1 className="ls-display ls-display--hero mt-9">
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
              className="mt-10 flex w-full flex-wrap items-center gap-3 sm:gap-6"
            >
              <Button
                onClick={openBookingModal}
                className="ls-cta-hero w-full sm:w-auto h-14 px-8 text-[1.02rem] sm:text-[1.08rem]"
              >
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
                href="#process"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById('process')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="ls-link ls-link--hero w-full text-center sm:w-auto sm:text-left"
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
                {t('landing.hero.pills.label')}
              </span>
              <span className="ls-pill">{t('landing.hero.pills.booking')}</span>
              <span className="ls-pill">
                {t('landing.hero.pills.newsletter')}
              </span>
              <span className="ls-pill">{t('landing.hero.pills.leads')}</span>
              <span className="ls-pill">{t('landing.hero.pills.edit')}</span>
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
              onClick={openBookingModal}
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
