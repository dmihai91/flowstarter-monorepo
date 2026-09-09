/**
 * Console noise that is not ours.
 *
 * Netlify injects its Deploy Preview collaboration drawer into every preview
 * it serves. The drawer frames `https://app.netlify.com/`, our CSP
 * `frame-src` does not allow that origin, and the browser blocks it and logs:
 *
 *   Framing 'https://app.netlify.com/' violates the following Content
 *   Security Policy directive: "frame-src 'self' ...". The request has been
 *   blocked.
 *
 * That block is the CSP working. The drawer is preview-only tooling injected
 * by the host, it does not exist in production, and allow-listing
 * app.netlify.com in `src/utils/security-headers.ts` to quieten a test would
 * weaken a real defence for every visitor. So the noise is filtered here, in
 * the test, and nowhere else.
 *
 * The other way out is to turn off "Deploy Preview Collaboration" under the
 * Netlify site settings, which only the site owner can do. Until someone
 * does, this filter is what keeps the preview lanes honest.
 */

/**
 * The exact origin the drawer frames. Observed on
 * deploy-preview-37--flowstarter-landing.netlify.app and
 * deploy-preview-38--flowstarter-landing.netlify.app: the message names
 * `https://app.netlify.com/` and no subdomain of it, so this is an exact
 * hostname match, not a suffix match.
 */
const DRAWER_HOST = 'app.netlify.com';

/** Chromium's frame-src violation message opens with the blocked URL. */
const FRAMING_URL = /Framing '([^']+)'/;

/**
 * True only for the drawer's own CSP violation.
 *
 * The host is read out of the message's URL and compared against
 * `URL.hostname`, never as a substring of the message. A substring test would
 * also swallow a genuine violation from an attacker-controlled URL that
 * merely contains the string, for example
 * `https://evil.example/app.netlify.com/`. Every other console error, CSP or
 * otherwise, stays fatal.
 */
export function isNetlifyPreviewDrawerNoise(text: string): boolean {
  if (!text.includes('Content Security Policy')) return false;

  const framed = FRAMING_URL.exec(text)?.[1];
  if (!framed) return false;

  try {
    return new URL(framed).hostname === DRAWER_HOST;
  } catch {
    // Not a URL we can parse, so not a message we are willing to ignore.
    return false;
  }
}
