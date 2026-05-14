import { cn } from '@/lib/utils';
import type { BriefData } from '../new-project.logic';
import { Field, inputClass } from './Field';

export function SetupStep({
  data,
  update,
  submitting,
  submitError,
}: {
  data: BriefData;
  update: <K extends keyof BriefData>(key: K, value: BriefData[K]) => void;
  submitting: boolean;
  submitError: string | null;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-medium tracking-[-0.005em] text-[var(--ls-ink)]">
        Tier & commerce
      </h2>

      <Field label="Tier *">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              { v: 'essential', label: 'Essential', sub: 'Service site' },
              { v: 'pro', label: 'Pro', sub: 'Service+' },
              { v: 'commerce', label: 'Commerce', sub: 'Shopify' },
              { v: 'custom', label: 'Custom', sub: 'Bespoke' },
            ] as const
          ).map((opt) => {
            const active = data.tier === opt.v;
            return (
              <button
                key={opt.v}
                type="button"
                onClick={() => update('tier', opt.v)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-colors',
                  active
                    ? 'border-[var(--ls-accent)] bg-[color-mix(in_oklab,var(--ls-accent)_12%,var(--ls-glass-bg))] text-[var(--ls-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                    : 'border-[var(--ls-rule)] bg-[var(--ls-glass-bg)] text-[var(--ls-ink-dim)] hover:border-[color-mix(in_oklab,var(--ls-accent)_40%,var(--ls-rule))]'
                )}
              >
                <div className="text-sm font-semibold">{opt.label}</div>
                <div className="text-[0.65rem] text-[var(--ls-ink-faint)]">
                  {opt.sub}
                </div>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Commerce mode">
        <select
          value={data.commerceMode}
          onChange={(e) =>
            update('commerceMode', e.target.value as BriefData['commerceMode'])
          }
          className={inputClass}
        >
          <option value="">None / not applicable</option>
          <option value="shopify_external">Shopify (external link)</option>
          <option value="shopify_native">Shopify (native theme)</option>
          <option value="custom_inhouse">Custom in-house</option>
        </select>
      </Field>

      <Field label="Billing">
        <div className="flex items-center gap-2">
          {(['monthly', 'annual'] as const).map((b) => {
            const active = data.billingInterval === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => update('billingInterval', b)}
                className={cn(
                  'rounded-[10px] border px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                  active
                    ? 'border-[var(--ls-accent)] bg-[color-mix(in_oklab,var(--ls-accent)_12%,var(--ls-glass-bg))] text-[var(--ls-ink)]'
                    : 'border-[var(--ls-rule)] bg-[var(--ls-glass-bg)] text-[var(--ls-ink-dim)] hover:border-[color-mix(in_oklab,var(--ls-accent)_35%,var(--ls-rule))]'
                )}
              >
                {b}
              </button>
            );
          })}
        </div>
      </Field>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)] p-3.5 transition-colors hover:border-[var(--ls-glass-edge)]">
        <input
          type="checkbox"
          checked={data.isFounding}
          onChange={(e) => update('isFounding', e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-sm">
          <span className="font-medium text-[var(--ls-ink)]">
            Founding client
          </span>
          <span className="mt-0.5 block text-[12px] leading-snug text-[var(--ls-ink-faint)]">
            One of the first 10 per tier - discounted setup, 50/50 billing.
          </span>
        </span>
      </label>

      {submitError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.07] p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {submitError}
        </div>
      )}

      {submitting && (
        <p className="text-xs text-[var(--ls-ink-faint)]">Creating project…</p>
      )}
    </div>
  );
}
