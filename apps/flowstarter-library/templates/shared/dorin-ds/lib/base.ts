/**
 * Resolve an internal href against the template's deployment base path.
 *
 * Astro injects `import.meta.env.BASE_URL` (always trailing-slashed) at
 * build time per-template, e.g. "/preview/coach-pro/" or "/" depending
 * on `astro.config.mjs`. Using this helper lets every template author
 * write hrefs like `/about` — they will be rewritten to
 * `/preview/coach-pro/about` when the template is hosted under a base
 * path, and left as `/about` for standalone deploys.
 *
 * External hrefs (http, https, mailto, tel) and pure anchors (#hash)
 * are returned unchanged. Empty hrefs become "#".
 */
export function withBase(href: string | undefined | null): string {
  if (!href) return '#';
  // Pass-through external & non-navigational schemes
  if (
    /^(https?:|mailto:|tel:|sms:|javascript:|#)/i.test(href) ||
    href.startsWith('//')
  ) {
    return href;
  }
  // Already a relative path (no leading slash) — leave to the browser.
  if (!href.startsWith('/')) {
    return href;
  }
  const base =
    typeof import.meta !== 'undefined' &&
    typeof import.meta.env !== 'undefined' &&
    typeof import.meta.env.BASE_URL === 'string'
      ? import.meta.env.BASE_URL
      : '/';
  // Strip leading slash from href so we can join cleanly.
  return `${base}${href.replace(/^\/+/, '')}`;
}

/**
 * Build a hash-anchor href against the template base. Useful when the
 * caller wants to scroll to an element on the same page from a CTA
 * defined elsewhere (e.g. `/services#pricing`).
 */
export function withBaseAndHash(path: string, hash: string): string {
  return `${withBase(path)}#${hash.replace(/^#/, '')}`;
}
