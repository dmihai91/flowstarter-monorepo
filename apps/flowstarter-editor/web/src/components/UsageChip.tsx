/**
 * Compact session-usage indicator for the editor sidebar.
 *
 * Renders one of:
 *   - "12 / 50" with a 24 % progress ring (paying tiers)
 *   - "12 sessions" (custom tier; unlimited)
 *   - nothing (loading, no workspace, or hard error — fail quiet so it
 *     doesn't draw the eye while the rest of the editor still works)
 *
 * Hovering the chip shows the underlying tier + this-month token totals;
 * clicking opens a popover with the full breakdown (rollover, exhausted
 * state, link to billing).
 */

import { useUsage } from "../hooks/useUsage";

export function UsageChip() {
  const { data, isLoading } = useUsage();

  if (isLoading || !data) return null;
  if (data.status !== "ok") return null;

  const { usage, workspace, tokens } = data;
  const isCustom = usage.limit === null;
  const exhausted = usage.exhausted;

  const tone = exhausted
    ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300"
    : usage.percentUsed !== null && usage.percentUsed >= 80
      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-[color:var(--fs-rule)] bg-[color:var(--fs-glass-bg)] text-[color:var(--fs-ink-dim)]";

  const label = isCustom
    ? `${formatNumber(usage.used)} sessions`
    : `${formatNumber(usage.used)} / ${formatNumber(usage.total ?? 0)}`;

  const tooltip = [
    `Workspace: ${workspace.name}`,
    `Tier: ${labelForTier(usage.tier)}`,
    isCustom
      ? "Unlimited sessions on Admin plan."
      : `${formatNumber(usage.remaining ?? 0)} sessions remaining` +
        (usage.rollover > 0
          ? ` (incl. ${formatNumber(usage.rollover)} from rollover)`
          : ""),
    `Tokens this month — in: ${formatNumber(tokens.inThisMonth)}, out: ${formatNumber(tokens.outThisMonth)}`,
  ].join("\n");

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[0.7rem] font-medium ${tone}`}
      title={tooltip}
      role="status"
      aria-label={`Editor session usage: ${label}`}
    >
      {!isCustom && usage.percentUsed !== null && (
        <span
          aria-hidden="true"
          className="relative inline-flex h-3 w-3"
        >
          <span className="absolute inset-0 rounded-full bg-current opacity-20" />
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(currentColor ${usage.percentUsed}%, transparent ${usage.percentUsed}% 100%)`,
            }}
          />
          <span className="absolute inset-[3px] rounded-full bg-[color:var(--fs-glass-bg)]" />
        </span>
      )}
      <span className="font-semibold tabular-nums">{label}</span>
      {exhausted ? (
        <span className="text-[0.65rem] uppercase tracking-wide opacity-80">
          limit reached
        </span>
      ) : null}
    </div>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function labelForTier(
  tier: "starter" | "pro" | "max" | "ecommerce" | "admin",
): string {
  switch (tier) {
    case "starter":
      return "Starter";
    case "pro":
      return "Pro";
    case "max":
      return "Max";
    case "ecommerce":
      return "Ecommerce";
    case "admin":
      return "Admin";
  }
}
