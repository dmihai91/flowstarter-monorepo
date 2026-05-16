'use client';

import { useCallback, useState } from 'react';
import { Button } from '@flowstarter/flow-design-system';
import {
  type DiscoveryData,
  type Step,
  type Tier,
  EMPTY_DISCOVERY,
  LAST_STEP,
  STEPS,
  canProceed,
  recommendTier,
} from './discovery.logic';
import { AboutStep } from './steps/AboutStep';
import { BusinessStep } from './steps/BusinessStep';
import { GoalsStep } from './steps/GoalsStep';
import { CommerceStep } from './steps/CommerceStep';
import { RecommendationStep } from './steps/RecommendationStep';
import { SubscriptionStep } from './steps/SubscriptionStep';
import { PreviewStep } from './steps/PreviewStep';

export interface DiscoveryCompletePayload {
  tier: Tier;
  data: DiscoveryData;
}

export function DiscoveryWizard({
  initialTier,
  source,
  onComplete,
  t,
}: {
  initialTier?: Tier | null;
  source: string;
  onComplete: (payload: DiscoveryCompletePayload) => void;
  t: (key: string) => string;
}) {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<DiscoveryData>(() => ({
    ...EMPTY_DISCOVERY,
    selectedTier: initialTier ?? '',
  }));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = useCallback(
    <K extends keyof DiscoveryData>(key: K, value: DiscoveryData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const proceed = canProceed(step, data);

  const handleNext = useCallback(() => {
    if (!proceed) return;
    setStep((s) => Math.min(LAST_STEP, s + 1) as Step);
  }, [proceed]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(1, s - 1) as Step);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!proceed) return;
    setSubmitting(true);
    setSubmitError(null);
    const tier = (data.selectedTier as Tier | '') || recommendTier(data).tier;

    // Best-effort lead capture — never block the user from booking
    try {
      await fetch('/api/discovery/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, selectedTier: tier, source }),
      }).catch(() => undefined);
    } catch {
      // Swallow — capture is non-blocking
    }

    setSubmitting(false);
    onComplete({ tier: tier as Tier, data });
  }, [data, onComplete, proceed, source]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--purple-primary)] mb-2">
          {t('landing.discovery.eyebrow')}
        </p>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--fs-ink)] leading-tight">
          {t(`landing.discovery.steps.${STEPS[step - 1].key}.title`)}
        </h2>
      </div>

      {/* Step indicator */}
      <ol className="mb-7 flex items-center gap-1.5" aria-label="progress">
        {STEPS.map((s, idx) => {
          const isActive = s.n === step;
          const isDone = s.n < step;
          const clickable = isDone;
          return (
            <li key={s.n} className="flex flex-1 items-center gap-1.5">
              <button
                type="button"
                onClick={() => clickable && setStep(s.n)}
                disabled={!clickable && !isActive}
                aria-current={isActive ? 'step' : undefined}
                aria-label={t(`landing.discovery.steps.${s.key}.title`)}
                className={[
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors',
                  isActive
                    ? 'bg-[var(--purple-primary)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]'
                    : '',
                  isDone
                    ? 'bg-[var(--purple-primary)]/15 text-[var(--purple-primary)] cursor-pointer hover:bg-[var(--purple-primary)]/25'
                    : '',
                  !isActive && !isDone
                    ? 'border border-[var(--fs-rule)] text-[var(--fs-ink-faint)] bg-transparent'
                    : '',
                ].join(' ')}
              >
                {isDone ? (
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  s.n
                )}
              </button>
              {idx < STEPS.length - 1 && (
                <div
                  className={[
                    'h-px flex-1 transition-colors',
                    s.n < step
                      ? 'bg-[var(--purple-primary)]/40'
                      : 'bg-[var(--fs-rule)]',
                  ].join(' ')}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Step body */}
      <section>
        {step === 1 && <AboutStep data={data} update={update} t={t} />}
        {step === 2 && <BusinessStep data={data} update={update} t={t} />}
        {step === 3 && <GoalsStep data={data} update={update} t={t} />}
        {step === 4 && <CommerceStep data={data} update={update} t={t} />}
        {step === 5 && <RecommendationStep data={data} update={update} t={t} />}
        {step === 6 && <SubscriptionStep data={data} update={update} t={t} />}
        {step === 7 && <PreviewStep data={data} t={t} />}
      </section>

      {submitError && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/[0.07] p-3 text-sm text-red-700 dark:text-red-300"
        >
          {submitError}
        </div>
      )}

      {/* Nav — uses the design-system Button so the radius, height, and weight
          are guaranteed to match every other button on the site. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[var(--fs-rule)] pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={step === 1}
          icon={
            <svg
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
          }
          iconPosition="left"
        >
          {t('landing.discovery.nav.back')}
        </Button>

        {step < LAST_STEP ? (
          <Button
            variant="primary"
            size="sm"
            onClick={handleNext}
            disabled={!proceed}
            aria-disabled={!proceed}
            icon={
              <svg
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
            }
            iconPosition="right"
          >
            {t('landing.discovery.nav.continue')}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!proceed || submitting}
            aria-disabled={!proceed || submitting}
            loading={submitting}
            icon={
              !submitting ? (
                <svg
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
              ) : undefined
            }
            iconPosition="right"
          >
            {submitting
              ? t('landing.discovery.nav.submitting')
              : t('landing.discovery.nav.bookCall')}
          </Button>
        )}
      </div>
    </div>
  );
}
