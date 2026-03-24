/**
 * Asset URL helpers — all template images served from Cloudflare R2.
 * Base URL: https://assets.flowstarter.dev (or R2.dev subdomain during setup)
 */

const ASSETS_BASE = process.env.NEXT_PUBLIC_ASSETS_URL ?? 'https://assets.flowstarter.dev';

/**
 * Returns the R2 URL for a template thumbnail.
 * @param slug  e.g. 'local-business-1' or 'coach-pro'
 * @param dark  whether to use the dark variant (if available)
 */
export function templateThumbnailUrl(slug: string, dark = false): string {
  const suffix = dark ? '-dark' : '';
  return `${ASSETS_BASE}/templates/${slug}${suffix}.png`;
}

/**
 * Returns the R2 URL for any asset under /templates/
 */
export function templateAssetUrl(filename: string): string {
  return `${ASSETS_BASE}/templates/${filename}`;
}
