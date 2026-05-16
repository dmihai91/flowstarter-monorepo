'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@flowstarter/flow-design-system';
import {
  type DiscoveryData,
  type Step,
  type Tier,
  DEMO_STATE_KEY,
  EMPTY_DISCOVERY,
  LAST_STEP,
  STEPS,
  bookingDepositFor,
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

/**
 * Draft autosave. sessionStorage (not localStorage) on purpose: the draft
 * holds PII (name/email), so it should survive a refresh but not linger
 * across browser sessions. Cleared on submit.
 */
const DRAFT_KEY = 'fs-discovery-draft-v1';

interface Draft {
  data: DiscoveryData;
  step: Step;
}

function loadDraft(): Draft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    if (!parsed || typeof parsed !== 'object' || !parsed.data) return null;
    const stepNum = Number(parsed.step);
    const step = (
      Number.isFinite(stepNum) ? Math.min(LAST_STEP, Math.max(1, stepNum)) : 1
    ) as Step;
    // Merge over EMPTY so a schema change can't yield missing keys.
    return { data: { ...EMPTY_DISCOVERY, ...parsed.data }, step };
  } catch {
    return null;
  }
}

function clearDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
    window.sessionStorage.removeItem(DEMO_STATE_KEY);
  } catch {
    // ignore
  }
}

export interface DiscoveryCompletePayload {
  tier: Tier;
  data: DiscoveryData;
}

export function DiscoveryWizard({
  initialTier,
  source,
  onComplete,
  onWideChange,
  t,
}: {
  initialTier?: Tier | null;
  source: string;
  onComplete: (payload: DiscoveryCompletePayload) => void;
  /** Signals the host modal to widen for the large preview step. */
  onWideChange?: (wide: boolean) => void;
  t: (key: string) => string;
}) {
  // Restore an in-progress draft so a refresh doesn't lose the input.
  const [step, setStep] = useState<Step>(() => loadDraft()?.step ?? 1);
  const [data, setData] = useState<DiscoveryData>(() => {
    const draft = loadDraft();
    if (draft) {
      // Keep a pricing-card pre-selection only if the draft didn't set one.
      return draft.data.selectedTier
        ? draft.data
        : { ...draft.data, selectedTier: initialTier ?? '' };
    }
    return { ...EMPTY_DISCOVERY, selectedTier: initialTier ?? '' };
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Persist the draft on every change (cheap; object is small).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step }));
    } catch {
      // storage full / disabled — autosave is best-effort
    }
  }, [data, step]);

  // The preview/editor step needs more room — ask the modal to widen.
  useEffect(() => {
    onWideChange?.(step === LAST_STEP);
  }, [step, onWideChange]);

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

    // Best-effort lead capture — never block the user from booking.
    // Capture the persisted lead id so the deposit webhook can mark it paid.
    let leadId: string | null = null;
    try {
      const leadRes = await fetch('/api/discovery/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, selectedTier: tier, source }),
      });
      const leadJson = (await leadRes.json().catch(() => ({}))) as {
        leadId?: string | null;
      };
      leadId = leadJson.leadId ?? null;
    } catch {
      // Swallow — capture is non-blocking
    }

    // Submitted — drop the autosaved draft (covers both the Stripe
    // redirect-away path and the straight-to-Calendly fallback below).
    clearDraft();

    // Booking deposit: send the prospect to Stripe Checkout. On success
    // Stripe redirects back with ?deposit=paid and the modal reopens on the
    // calendar step. If Stripe is unconfigured or errors, the endpoint
    // returns { skip:true } and we fall through straight to Calendly so the
    // funnel never dead-ends.
    try {
      const res = await fetch('/api/discovery/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          fullName: data.fullName,
          email: data.email,
          businessName: data.businessName,
          subscription: data.subscription,
          source,
          leadId,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        url?: string;
        skip?: boolean;
      };
      if (res.ok && json.url) {
        window.location.href = json.url;
        return; // leaving the SPA — keep the spinner until navigation
      }
    } catch {
      // Fail open — proceed to booking without the deposit gate
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
              ? t('landing.discovery.nav.redirecting')
              : `${t('landing.discovery.nav.payPrefix')} ${bookingDepositFor(
                  (data.selectedTier as Tier | '') || recommendTier(data).tier
                )} · ${t('landing.discovery.nav.bookCall')}`}
          </Button>
        )}
      </div>
    </div>
  );
}
