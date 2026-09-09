/**
 * Console noise that is not ours.
 *
 * Netlify injects its Deploy Preview collaboration drawer into every preview
 * it serves. The drawer frames `https://app.netlify.com/`, our CSP `frame-src`
 * does not allow that origin, and the browser blocks it and logs:
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
 *
 * Deliberately narrow: a message has to name BOTH the Netlify origin and the
 * CSP to be ignored. Every other console error stays fatal.
 */
export function isNetlifyPreviewDrawerNoise(text: string): boolean {
  return (
    text.includes('app.netlify.com') && text.includes('Content Security Policy')
  );
}
