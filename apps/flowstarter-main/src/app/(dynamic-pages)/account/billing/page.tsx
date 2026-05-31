import { auth } from '@clerk/nextjs/server';
import { PricingTable } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { BillingDetailsForm } from './BillingDetailsForm';

export const metadata = {
  title: 'Billing & plan',
  description: 'Manage your Flowstarter subscription.',
};

// B2C plans, in the order they should read. Slugs must match the Clerk
// Billing plan slugs (Dashboard → Billing → Plans) and the webhook's
// CANONICAL_TIER_SLUGS mirror.
const PLANS = [
  { slug: 'starter', name: 'Starter' },
  { slug: 'pro', name: 'Pro' },
  { slug: 'ecommerce', name: 'Ecommerce' },
  { slug: 'max', name: 'Max' },
] as const;

/**
 * Customer billing page — the target of the editor's "Upgrade plan" CTA
 * (`/account/billing`). Shows the current plan and renders Clerk's
 * `<PricingTable/>`, whose in-app checkout drawer handles upgrade / downgrade /
 * cancel and collects payment + billing details (company name, address, tax id)
 * securely. Authoritative plan checks use `has({ plan })`, not the mirrored
 * `tier_name`.
 */
export default async function BillingPage() {
  const { userId, has } = await auth();
  if (!userId) redirect('/login?next=/account/billing');

  const current = PLANS.find((p) => has({ plan: p.slug })) ?? null;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="mb-10">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          Billing &amp; plan
        </h1>
        <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-slate-600 dark:text-slate-300">
          Choose the plan that fits how much you edit each month. Upgrades take
          effect immediately; you can change or cancel any time.
        </p>
      </header>

      <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 dark:border-slate-700/60 dark:bg-slate-900/40">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Current plan
          </p>
          <p className="mt-0.5 text-lg font-semibold text-slate-900 dark:text-slate-50">
            {current ? current.name : 'No active plan'}
          </p>
        </div>
        {current ? (
          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
            Active
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-600/40 dark:bg-slate-700/30 dark:text-slate-300">
            Free
          </span>
        )}
      </div>

      <PricingTable />

      <BillingDetailsForm />
    </main>
  );
}
