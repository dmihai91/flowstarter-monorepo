import { headers } from 'next/headers';

/**
 * Resolves the URL prefix for an internal library link.
 *
 * The library can be reached two ways in this app:
 *   1. From `library.flowstarter.net/<path>` — middleware rewrites the host
 *      so the request is served by `/library/<path>` internally, but the
 *      visible URL is the bare `/<path>`. Internal links should therefore be
 *      emitted as `/<path>` so the address bar stays clean.
 *   2. From `flowstarter.net/library/<path>` (dev/preview/marketing-link) —
 *      no rewrite happens; internal links must include the `/library` prefix
 *      so they hit the correct route segment.
 *
 * `getLibraryPathPrefix` returns either `''` (subdomain) or `/library`
 * (everywhere else) based on the inbound `Host` header.
 */
export async function getLibraryPathPrefix(): Promise<string> {
  const h = await headers();
  const host = (h.get('host') ?? '').toLowerCase();
  return host.startsWith('library.') ? '' : '/library';
}

/**
 * Build a fully-qualified internal href for the library, e.g.
 * `libHref(prefix, '/templates/coach-pro')` → `/library/templates/coach-pro`.
 *
 * The prefix should come from `getLibraryPathPrefix()` once per request and
 * be threaded down to client components via props.
 */
export function libHref(prefix: string, path: string): string {
  if (!path.startsWith('/')) return path;
  return `${prefix}${path === '/' ? '' : path}` || '/';
}
