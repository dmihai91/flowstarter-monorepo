'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { EXTERNAL_URLS } from '@/lib/constants';
import { useI18n } from '@/lib/i18n';
import { CalendlyEmbed } from './CalendlyEmbed';

const OPTION_IDS = ['starter', 'pro', 'custom', 'unsure'] as const;
const OPTIONS_WITH_PRICE = new Set(['starter', 'pro', 'custom']);

type OptionId = (typeof OPTION_IDS)[number];
type Step = 'select' | 'calendar' | 'confirmed';

/** Ensures paid tiers always read with a clear qualifier (handles stale bundles / i18n drift). */
function formatPrequalTierPrice(id: OptionId, price: string): string {
  if (id === 'custom') return price;
  const t = price.trim();
  if (/^(from|starting\s+from)\s/i.test(t)) return t;
  return `Starting from ${t}`;
}

interface PreQualModalProps {
  open: boolean;
  onClose: () => void;
  source?: string;
  /** Pre-select a plan when opened from pricing cards */
  initialPlan?: string | null;
}

export function PreQualModal({
  open,
  onClose,
  source = 'cta',
  initialPlan,
}: PreQualModalProps) {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const [selected, setSelected] = useState<OptionId | null>(null);
  const [step, setStep] = useState<Step>('select');

  const options = useMemo(
    () =>
      OPTION_IDS.map((id) => ({
        id,
        name: t(`landing.prequal.options.${id}.name`),
        desc: t(`landing.prequal.options.${id}.desc`),
        price: OPTIONS_WITH_PRICE.has(id)
          ? formatPrequalTierPrice(id, t(`landing.prequal.options.${id}.price`))
          : null,
      })),
    [t]
  );

  // Reset on open + lock scroll; apply initial plan
  useEffect(() => {
    if (open) {
      const lowered = initialPlan?.toLowerCase() as OptionId | undefined;
      const matchedId =
        lowered && OPTION_IDS.includes(lowered) ? lowered : null;
      setSelected(matchedId);
      setStep('select');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, initialPlan]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleBookClick = useCallback(() => {
    if (selected) setStep('calendar');
  }, [selected]);

  const handleBack = useCallback(() => {
    setStep('select');
  }, []);

  const handleEventScheduled = useCallback(() => {
    setStep('confirmed');
  }, []);

  if (!open) return null;
  if (typeof window === 'undefined') return null;

  const calendlyUrl = EXTERNAL_URLS.calendly.discovery;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="bg-black/60 backdrop-blur-sm"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100dvh',
          minHeight: '100vh',
          zIndex: 9998,
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prequal-title"
        className="flex items-start sm:items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))]"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100dvh',
          zIndex: 9999,
          overflowY: 'auto',
        }}
      >
        <div
          className={[
            'relative w-full my-auto rounded-2xl border border-white/10 bg-white dark:bg-[#0f1117] shadow-2xl shadow-black/30 p-5 sm:p-8 transition-all duration-300',
            step === 'calendar' ? 'max-w-3xl' : 'max-w-md sm:max-w-2xl',
          ].join(' ')}
        >
          {/* Drag handle — mobile only */}
          <div className="sm:hidden flex justify-center mb-4 -mt-1">
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            aria-label={t('landing.prequal.close')}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors z-10"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* ─── STEP 1: Package selection ─── */}
          {step === 'select' && (
            <>
              {/* Header */}
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--purple-primary)] mb-2">
                  {t('landing.prequal.eyebrow')}
                </p>
                <h2
                  id="prequal-title"
                  className="text-2xl font-bold text-[var(--fs-ink)]"
                >
                  {t('landing.prequal.title')}
                </h2>
                <p className="mt-1 text-base text-[var(--fs-ink-faint)]">
                  {t('landing.prequal.subtitle')}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2 mb-5">
                {options.map((opt) => {
                  const isSelected = selected === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelected(opt.id)}
                      className={[
                        'w-full flex items-center justify-between gap-4 rounded-xl border px-4 py-4 text-left transition-all duration-150',
                        isSelected
                          ? 'border-[var(--purple-primary)] bg-[var(--purple-primary)]/8 ring-1 ring-[var(--purple-primary)]'
                          : 'border-[var(--fs-rule)] hover:border-[var(--purple-primary)]/50 dark:hover:border-white/20 bg-transparent',
                      ].join(' ')}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        {/* Radio dot */}
                        <span
                          className={[
                            'flex-shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors',
                            isSelected
                              ? 'border-[var(--purple-primary)]'
                              : 'border-gray-300 dark:border-white/30',
                          ].join(' ')}
                        >
                          {isSelected && (
                            <span className="h-2 w-2 rounded-full bg-[var(--purple-primary)]" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-base font-semibold text-[var(--fs-ink)]">
                            {opt.name}
                          </span>
                          <span className="block text-sm text-[var(--fs-ink-faint)] truncate">
                            {opt.desc}
                          </span>
                        </span>
                      </span>
                      {opt.price && (
                        <span className="flex-shrink-0 text-sm font-medium text-gray-400 dark:text-white/40">
                          {opt.price}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={handleBookClick}
                disabled={!selected}
                aria-disabled={!selected}
                className={[
                  'flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold transition-all duration-200',
                  selected
                    ? 'bg-[linear-gradient(135deg,var(--landing-btn-from),var(--landing-btn-via))] text-white shadow-lg shadow-[var(--purple-primary)]/25 hover:opacity-90 cursor-pointer'
                    : 'border border-[var(--fs-rule-strong)] bg-[color-mix(in_oklab,var(--fs-bg-elevated)_82%,var(--fs-ink)_18%)] text-[var(--fs-ink-faint)] opacity-70 cursor-not-allowed shadow-none',
                ].join(' ')}
              >
                {t('landing.prequal.cta')}
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>

              <p className="mt-3 text-center text-xs text-gray-400 dark:text-white/30">
                {t('landing.prequal.footnote')}
              </p>
            </>
          )}

          {/* ─── STEP 2: Calendly inline widget ─── */}
          {step === 'calendar' && (
            <>
              {/* Back button + header */}
              <div className="mb-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-[var(--fs-ink)]/50 dark:hover:text-white transition-colors"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  {t('landing.prequal.calendar.back')}
                </button>
                <div className="h-4 w-px bg-gray-200 dark:bg-white/10" />
                <p className="text-sm text-[var(--fs-ink-faint)]">
                  <span className="font-medium text-[var(--purple-primary)]">
                    {options.find((o) => o.id === selected)?.name}
                  </span>{' '}
                  {t('landing.prequal.calendar.planSelected')}
                </p>
              </div>

              <div className="mb-2">
                <h2
                  id="prequal-title"
                  className="text-xl font-bold text-[var(--fs-ink)]"
                >
                  {t('landing.prequal.calendar.title')}
                </h2>
                <p className="mt-1 text-sm text-[var(--fs-ink-faint)]">
                  {t('landing.prequal.calendar.subtitle')}
                </p>
              </div>

              {/* Calendly widget */}
              <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-white/5">
                <CalendlyEmbed
                  url={calendlyUrl}
                  utmContent={`${selected}-plan`}
                  utmSource={source}
                  utmMedium="prequal-modal"
                  onEventScheduled={handleEventScheduled}
                />
              </div>
            </>
          )}

          {/* ─── STEP 3: Confirmation ─── */}
          {step === 'confirmed' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              {/* Checkmark */}
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <svg
                  className="h-8 w-8 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-[var(--fs-ink)] mb-2">
                {t('landing.prequal.confirmed.title')}
              </h2>
              <p className="text-base text-[var(--fs-ink-faint)] max-w-sm">
                {t('landing.prequal.confirmed.body')}
              </p>
              <p className="mt-4 text-sm text-gray-400 dark:text-white/30">
                {t('landing.prequal.confirmed.note')}
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--landing-btn-from),var(--landing-btn-via))] px-8 py-3 text-base font-semibold text-white shadow-lg shadow-[var(--purple-primary)]/25 hover:opacity-90 transition-opacity"
              >
                {t('landing.prequal.confirmed.cta')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
