/**
 * Limit-reached banner shown above the composer when the workspace's monthly
 * €-budget gate is blocked (read from /api/clerk/usage via useUsage). Tiered
 * CTA: paid tiers → "Upgrade plan" (Clerk billing page); Max → "Contact us"
 * (no higher tier). Renders nothing when the gate is absent / not blocked, so
 * it's safe to mount unconditionally above the composer.
 */
import { useUsage } from "../../hooks/useUsage";
import type { PlanKey } from "../../lib/clerkSession";
import { getBillingUrl, getContactUrl } from "../../lib/mainAppUrl";

const TIER_LABEL: Record<PlanKey, string> = {
  starter: "Starter",
  pro: "Pro",
  max: "Max",
  ecommerce: "Ecommerce",
  admin: "Admin",
};

export function ComposerLimitReachedPanel() {
  const { data } = useUsage();
  if (!data || data.status !== "ok") return null;
  const gate = data.gate;
  if (!gate || !gate.blocked) return null;

  const tier = TIER_LABEL[gate.tier] ?? gate.tier;
  const headline =
    gate.reason === "sessions"
      ? `You've used all your editing sessions this month on the ${tier} plan.`
      : `You've reached this month's AI editing budget on the ${tier} plan.`;
  const ctaHref = gate.isMax ? getContactUrl() : getBillingUrl();
  const ctaLabel = gate.isMax ? "Contact us" : "Upgrade plan";
  const sub = gate.isMax
    ? "You're on our top plan — contact us to extend your limit and keep editing."
    : "Upgrade your plan to keep editing this month.";

  return (
    <div
      role="status"
      className="mx-3 mb-2 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-[0.8rem]"
    >
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-[color:var(--fs-ink)]">{headline}</p>
        <p className="text-[color:var(--fs-ink-dim)]">{sub}</p>
      </div>
      <a
        href={ctaHref}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-[0.78rem] font-semibold text-white transition-colors hover:bg-amber-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
      >
        {ctaLabel}
      </a>
    </div>
  );
}
