'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/unified-button';
import { useI18n } from '@/lib/i18n';
import { useBookingModal } from './booking-modal-store';

const PROGRESS_STEPS = 4;

type BriefField = { label: string; value: string };

export function LandingHero() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const openBookingModal = useBookingModal((s) => s.open);
  // Always revealed — entrance animation via CSS, not JS state.
  // JS-gated opacity caused hero flash/reflow on Android Chrome on first paint.
  const revealed = true;

  const briefFields = useMemo<BriefField[]>(() => {
    const label1 = t('landing.hero.brief.field1Label');
    const label2 = t('landing.hero.brief.field2Label');
    const label3 = t('landing.hero.brief.field3Label');
    const label4 = t('landing.hero.brief.field4Label');
    return [
      { label: label1, value: t('landing.hero.brief.field1Value') },
      { label: label2, value: t('landing.hero.brief.field2Value') },
      { label: label3, value: t('landing.hero.brief.field3Value') },
      { label: label4, value: t('landing.hero.brief.field4Value') },
    ];
  }, [t]);

  const reveal = (order: number): React.CSSProperties => ({
    opacity: revealed ? 1 : 0,
    transform: revealed ? 'translateY(0)' : 'translateY(22px)',
    transition: `opacity 900ms cubic-bezier(0.19,1,0.22,1) ${
      order * 110
    }ms, transform 900ms cubic-bezier(0.19,1,0.22,1) ${order * 110}ms`,
  });

  const filled = PROGRESS_STEPS;

  const stats = [
    { val: t('landing.hero.stat1Value'), lbl: t('landing.hero.stat1Label') },
    { val: t('landing.hero.stat2Value'), lbl: t('landing.hero.stat2Label') },
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
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
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

            <p style={reveal(3)} className="ls-hero-proof mt-5">
              {t('landing.hero.proofLine')}
            </p>

            <p style={reveal(4)} className="ls-body ls-body--lead mt-8">
              {t('landing.hero.subhead')}
            </p>

            <div
              style={reveal(5)}
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
                ...reveal(6),
                color: 'var(--ls-ink-faint)',
                fontFamily: 'var(--ls-mono)',
              }}
              className="mt-5 text-[10.5px] uppercase tracking-[0.18em]"
            >
              {t('landing.hero.guaranteeShort')}
            </p>

            <div
              style={reveal(7)}
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
              style={reveal(8)}
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

            {briefFields.map((field) => {
              return (
                <div key={field.label} className="ls-field">
                  <span className="lbl">{field.label}</span>
                  <span className="val">{field.value}</span>
                </div>
              );
            })}

            <div className="ls-brief-delivery">
              <div className="row">
                <span className="lbl">
                  {t('landing.hero.brief.progressLabel')}
                </span>
                <span className="val">
                  {t('landing.hero.brief.progressReady')}
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
              className="ls-brief-finish ready"
            >
              {t('landing.hero.brief.ctaReady')}
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
