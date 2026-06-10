// Central env-driven configuration. No hardcoded domains, no hardcoded amounts.
// All Stripe amounts are env-configurable constants per the v1 guardrails.

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Server-side pricing config (cents). */
export const PRICING = {
  currency: process.env.SELFSERVE_CURRENCY ?? 'eur',
  /** Stage 1 — non-refundable build fee. */
  buildFeeCents: int('SELFSERVE_BUILD_FEE_CENTS', 5_000),
  /** Stage 2 — delivery payment (both Launch and Code-only paths). */
  finalFeeCents: int('SELFSERVE_FINAL_FEE_CENTS', 14_900),
  /** Stage 2 Launch — monthly hosting/updates/AI-edits subscription. */
  monthlyCents: int('SELFSERVE_MONTHLY_CENTS', 3_900),
} as const;

export function formatCents(cents: number, currency = PRICING.currency): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** Display strings derived from the env amounts so copy never drifts from Stripe. */
export function pricingCopy() {
  const build = formatCents(PRICING.buildFeeCents);
  const final = formatCents(PRICING.finalFeeCents);
  const total = formatCents(PRICING.buildFeeCents + PRICING.finalFeeCents);
  const monthly = formatCents(PRICING.monthlyCents);
  return {
    build,
    final,
    total,
    monthly,
    headline: `${total} total — ${build} to start the build, ${final} on delivery. Then ${monthly}/month for hosting, your domain, updates & AI edits.`,
  };
}

/** Clerk Billing plan slug for the monthly hosting subscription. */
export const CLERK_HOSTING_PLAN = process.env.CLERK_HOSTING_PLAN_SLUG ?? 'hosting';

export const DEMO = {
  /** Free real-agent prompts before the paywall. */
  maxRefinements: int('SELFSERVE_DEMO_MAX_REFINEMENTS', 10),
  /** Hard rate limits per email/IP for demo generation. */
  maxDemosPerEmailPerDay: int('SELFSERVE_MAX_DEMOS_PER_EMAIL_PER_DAY', 3),
  maxDemosPerIpPerDay: int('SELFSERVE_MAX_DEMOS_PER_IP_PER_DAY', 8),
} as const;

export const ENGINE = {
  /** 'mock' streams the prototype feed; 'orchestrator' runs the real agent pipeline. */
  mode: (process.env.BUILD_ENGINE_MODE ?? 'mock') as 'mock' | 'orchestrator',
  maxRetries: int('BUILD_MAX_RETRIES', 2),
  /** Builds older than this without completion trigger the stuck path. */
  stuckAfterMs: int('BUILD_STUCK_AFTER_MS', 2 * 60 * 60 * 1000),
} as const;

export const ALERTS = {
  /** Internal alert sink for build failures (Slack/Discord-style webhook). */
  adminWebhookUrl: process.env.ADMIN_ALERT_WEBHOOK_URL,
  adminEmail: process.env.ADMIN_ALERT_EMAIL,
} as const;

export const EMAIL = {
  // TODO(placeholder): transactional email provider. When RESEND_API_KEY is unset,
  // emails are logged to the console instead of sent.
  resendApiKey: process.env.RESEND_API_KEY,
  from: process.env.EMAIL_FROM ?? 'Flowstarter <hello@example.invalid>',
} as const;

export const MODELS = {
  /** Cheap/fast model for demo generation + demo refinements (never the build model). */
  demo: process.env.SELFSERVE_DEMO_MODEL ?? 'deepseek/deepseek-v4-flash',
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
} as const;
