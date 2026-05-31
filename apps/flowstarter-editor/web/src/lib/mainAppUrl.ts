/**
 * Resolve links into the main Flowstarter app from the editor.
 *
 * The editor build bakes `VITE_MAIN_APP_LOGIN_URL` (vite.config.ts derives it
 * from NEXT_PUBLIC_SITE_URL / VITE_MAIN_APP_ORIGIN — never a hardcoded
 * domain). We reuse it to build the limit-reached CTA targets: the Clerk
 * billing/upgrade page and the contact form. Returns "" when unset (LAN/dev),
 * in which case callers fall back to a relative path.
 */

/** Billing/upgrade page (Clerk <PricingTable/>) on the main app. */
export const MAIN_APP_BILLING_PATH = "/account/billing";
/** Public contact form on the main app (Max-tier "contact us" target). */
export const MAIN_APP_CONTACT_PATH = "/contact";

export function getMainAppBaseUrl(): string {
  const loginUrl = (import.meta.env.VITE_MAIN_APP_LOGIN_URL ?? "").trim();
  if (!loginUrl) return "";
  try {
    return new URL(loginUrl).origin;
  } catch {
    // Best-effort: strip a trailing /login or /sign-in segment.
    return loginUrl.replace(/\/(login|sign-in)(\/.*)?$/i, "");
  }
}

function withBase(path: string): string {
  const base = getMainAppBaseUrl();
  return base ? `${base}${path}` : path;
}

/** Upgrade target — the Clerk billing page on the main app. */
export function getBillingUrl(): string {
  return withBase(MAIN_APP_BILLING_PATH);
}

/** Max-tier "contact us" target. */
export function getContactUrl(): string {
  return withBase(MAIN_APP_CONTACT_PATH);
}
