/**
 * Build `/admin/login` relative path preserving cross-app return hints from the
 * current page (`redirect_url`, `next`) — e.g. client login footer → team login.
 */
export function buildTeamLoginHref(
  searchParams: Pick<URLSearchParams, 'get'>
): string {
  const qs = new URLSearchParams();
  const r = searchParams.get('redirect_url');
  const n = searchParams.get('next');
  if (r) qs.set('redirect_url', r);
  if (n) qs.set('next', n);
  const suffix = qs.toString();
  return suffix ? `/admin/login?${suffix}` : '/admin/login';
}
