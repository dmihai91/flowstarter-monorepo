import {
  type DiscoveryData,
  type SubscriptionTier,
  ECOMMERCE_SUBSCRIPTION,
  SUBSCRIPTIONS,
  usesDedicatedSubscription,
} from '../discovery.logic';

const ORDER: ReadonlyArray<SubscriptionTier> = ['starter', 'pro', 'max'];

export function SubscriptionStep({
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
  const dedicated = usesDedicatedSubscription(data.selectedTier);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h3 className="text-lg font-bold text-[var(--fs-ink)]">
          {t('landing.discovery.steps.subscription.title')}
        </h3>
        <p className="text-sm text-[var(--fs-ink-faint)]">
          {t(
            dedicated
              ? 'landing.discovery.steps.subscription.subtitleStore'
              : 'landing.discovery.steps.subscription.subtitle'
          )}
        </p>
      </header>

      {dedicated ? (
        /* Commerce build package → dedicated, fixed store subscription */
        <div className="rounded-lg border border-[var(--purple-primary)]/40 bg-[var(--purple-primary)]/[0.06] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--purple-primary)]">
                {t('landing.discovery.subscription.storeEyebrow')}
              </p>
              <h4 className="mt-1 text-xl font-bold text-[var(--fs-ink)]">
                {t('landing.discovery.subscription.storeName')}
              </h4>
              <p className="mt-1 text-sm text-[var(--fs-ink-faint)]">
                {ECOMMERCE_SUBSCRIPTION.sessions}{' '}
                {t('landing.discovery.subscription.sessionsSuffix')} ·{' '}
                {t('landing.discovery.subscription.storeOps')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-[var(--fs-ink)]">
                €{ECOMMERCE_SUBSCRIPTION.priceEur}
                <span className="text-[12px] font-medium text-[var(--fs-ink-faint)]">
                  /mo
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[12px] leading-snug text-[var(--fs-ink-faint)]">
            {t('landing.discovery.subscription.storeNote')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {ORDER.map((tier) => {
            const plan = SUBSCRIPTIONS[tier];
            const active = data.subscription === tier;
            const isPro = tier === 'pro';
            return (
              <button
                key={tier}
                type="button"
                onClick={() => update('subscription', tier)}
                className={[
                  'relative rounded-lg border px-4 py-4 text-left transition-all',
                  active
                    ? 'border-[var(--purple-primary)] bg-[var(--purple-primary)]/8 ring-1 ring-[var(--purple-primary)]'
                    : 'border-[var(--fs-rule)] hover:border-[var(--purple-primary)]/40',
                ].join(' ')}
              >
                {isPro && (
                  <span className="absolute -top-2 right-3 rounded-full bg-[var(--purple-primary)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    {t('landing.discovery.subscription.popular')}
                  </span>
                )}
                <div className="text-sm font-semibold text-[var(--fs-ink)]">
                  {t(`landing.discovery.subscription.tiers.${tier}`)}
                </div>
                <div className="mt-1 text-lg font-bold text-[var(--fs-ink)]">
                  €{plan.priceEur}
                  <span className="text-[12px] font-medium text-[var(--fs-ink-faint)]">
                    /mo
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-[var(--fs-ink-faint)]">
                  {plan.sessions}{' '}
                  {t('landing.discovery.subscription.sessionsSuffix')}
                  {tier === 'pro' && ' (3×)'}
                  {tier === 'max' && ' (9×)'}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-[12px] leading-snug text-[var(--fs-ink-faint)]">
        {t('landing.discovery.subscription.footnote')}
      </p>
    </div>
  );
}
