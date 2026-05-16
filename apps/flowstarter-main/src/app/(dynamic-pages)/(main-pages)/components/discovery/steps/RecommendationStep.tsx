import { useEffect, useMemo } from 'react';
import {
  type DiscoveryData,
  type Tier,
  BOOKING_DEPOSIT_PERCENT,
  TIER_MONTHLY_FROM,
  TIER_SETUP_FROM,
  bookingDepositFor,
  recommendTier,
} from '../discovery.logic';

const TIER_ORDER: ReadonlyArray<Tier> = [
  'starter',
  'pro',
  'commerce',
  'custom',
];

export function RecommendationStep({
  data,
  update,
  t,
}: {
  data: DiscoveryData;
  update: <K extends keyof DiscoveryData>(
    key: K,
    value: DiscoveryData[K]
  ) => void;
  t: (key: string) => string;
}) {
  const recommendation = useMemo(() => recommendTier(data), [data]);

  // Auto-select the recommended tier the first time the user lands here
  useEffect(() => {
    if (!data.selectedTier) {
      update('selectedTier', recommendation.tier);
    }
  }, [data.selectedTier, recommendation.tier, update]);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h3 className="text-lg font-bold text-[var(--fs-ink)]">
          {t('landing.discovery.steps.recommendation.title')}
        </h3>
        <p className="text-sm text-[var(--fs-ink-faint)]">
          {t('landing.discovery.steps.recommendation.subtitle')}
        </p>
      </header>

      {/* Recommendation card */}
      <div className="rounded-lg border border-[var(--purple-primary)]/40 bg-[var(--purple-primary)]/[0.06] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--purple-primary)]">
              {t('landing.discovery.recommendation.eyebrow')}
            </p>
            <h4 className="mt-1 text-xl font-bold text-[var(--fs-ink)]">
              {t(`landing.discovery.tiers.${recommendation.tier}.name`)}
            </h4>
            <p className="mt-1 text-sm text-[var(--fs-ink-faint)]">
              {t(`landing.discovery.tiers.${recommendation.tier}.tagline`)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-[0.1em] text-[var(--fs-ink-faint)]">
              {t('landing.discovery.recommendation.setupFrom')}
            </div>
            <div className="text-base font-bold text-[var(--fs-ink)]">
              {TIER_SETUP_FROM[recommendation.tier]}
            </div>
            <div className="mt-0.5 text-[12px] text-[var(--fs-ink-faint)]">
              + {TIER_MONTHLY_FROM[recommendation.tier]}
            </div>
          </div>
        </div>

        {/* Reasons */}
        <ul className="mt-4 space-y-1.5">
          {recommendation.reasonKeys.map((key) => (
            <li
              key={key}
              className="flex items-start gap-2 text-sm text-[var(--fs-ink)]/85"
            >
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--purple-primary)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>
                {t(`landing.discovery.recommendation.reasons.${key}`)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Override picker */}
      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--fs-ink-faint)]">
          {t('landing.discovery.recommendation.overrideLabel')}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TIER_ORDER.map((tier) => {
            const active = data.selectedTier === tier;
            const isRecommended = recommendation.tier === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => update('selectedTier', tier)}
                className={[
                  'relative rounded-lg border px-3 py-2.5 text-left transition-all',
                  active
                    ? 'border-[var(--purple-primary)] bg-[var(--purple-primary)]/8 ring-1 ring-[var(--purple-primary)]'
                    : 'border-[var(--fs-rule)] hover:border-[var(--purple-primary)]/40',
                ].join(' ')}
              >
                {isRecommended && (
                  <span className="absolute -top-2 right-2 rounded-full bg-[var(--purple-primary)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    {t('landing.discovery.recommendation.bestMatchBadge')}
                  </span>
                )}
                <div className="text-sm font-semibold text-[var(--fs-ink)]">
                  {t(`landing.discovery.tiers.${tier}.name`)}
                </div>
                <div className="mt-0.5 text-[11px] text-[var(--fs-ink-faint)]">
                  {t('landing.discovery.recommendation.from')}{' '}
                  {TIER_SETUP_FROM[tier]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Deposit notice — uses the user's currently selected tier so the amount
          updates if they pick a different option. */}
      {data.selectedTier && (
        <div className="rounded-lg border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]/40 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--purple-primary)]/15 text-[var(--purple-primary)]">
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--fs-ink)]">
                  {t('landing.discovery.recommendation.deposit.title')}
                </p>
                <p className="text-sm font-bold text-[var(--purple-primary)]">
                  {bookingDepositFor(data.selectedTier as Tier)}
                  <span className="ml-1 text-[11px] font-medium text-[var(--fs-ink-faint)]">
                    ({BOOKING_DEPOSIT_PERCENT}
                    {t('landing.discovery.recommendation.deposit.percentSuffix')}
                    )
                  </span>
                </p>
              </div>
              <p className="mt-1 text-[12px] leading-snug text-[var(--fs-ink-faint)]">
                {t('landing.discovery.recommendation.deposit.body')}
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="text-[12px] leading-snug text-[var(--fs-ink-faint)]">
        {t('landing.discovery.recommendation.footnote')}
      </p>
    </div>
  );
}
