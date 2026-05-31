/**
 * Per-client configuration for the Shopify operator-landing template.
 *
 * Everything client-specific lives in `sites/<slug>.ts`. The active site is
 * chosen at build time with `VITE_SITE=<slug>` (defaults to "lebadusul").
 * The rest of the app is generic, so a new Shopify project is just:
 *   1. add `sites/<slug>.ts` (a SiteConfig)
 *   2. drop the storefront screenshot in `public/assets/<slug>.jpg`
 *   3. build with `VITE_SITE=<slug>`
 */

export interface SiteConfig {
  /** Platform brand shown in the top bar (e.g. "Flowstarter"). */
  readonly brandName: string;
  /** Workspace handle shown as the mono crumb + tab context. */
  readonly workspaceSlug: string;
  /** Store display name — the hero headline (e.g. "Lebădușul"). */
  readonly storeName: string;
  /** Public storefront URL (https://…). */
  readonly storeUrl: string;
  /** Bare storefront host shown in the preview URL bar + sub copy. */
  readonly storeHost: string;
  /** Small accented kicker above the headline. `lead` is accented. */
  readonly kicker: { readonly lead: string; readonly tail: string };
  /** One-line hero promise under the headline. */
  readonly lede: string;
  /** Sub copy wrapping the storefront link: `{before} <host link> {after}`. */
  readonly sub: { readonly before: string; readonly after: string };
  /** Hero badges (short, non-technical facts). */
  readonly badges: ReadonlyArray<{ readonly label: string; readonly accent?: boolean }>;
  /** Storefront screenshot served at the site root (e.g. "/assets/lebadusul.jpg"). */
  readonly storefrontImage: string;
  /** Alt text for the screenshot. */
  readonly storefrontAlt: string;
  /** "Need help?" target (support/contact). */
  readonly helpUrl: string;
  /** Platform marketing site link in the footer. */
  readonly brandUrl: string;
  /** Bare platform host shown as the footer link label. */
  readonly brandHost: string;
}

// Eagerly load every site config so the chosen one resolves synchronously at
// render time (no async/loading state for a single-screen page).
const modules = import.meta.glob<{ default: SiteConfig }>("../sites/*.ts", {
  eager: true,
});

const DEFAULT_SITE = "lebadusul";

function resolveSiteConfig(): SiteConfig {
  const key = (import.meta.env.VITE_SITE ?? DEFAULT_SITE).trim();
  const entry = modules[`../sites/${key}.ts`];
  if (!entry) {
    const available = Object.keys(modules)
      .map((p) => p.replace("../sites/", "").replace(".ts", ""))
      .join(", ");
    throw new Error(
      `Unknown VITE_SITE "${key}". Available sites: ${available || "(none)"}`,
    );
  }
  return entry.default;
}

export const siteConfig: SiteConfig = resolveSiteConfig();
