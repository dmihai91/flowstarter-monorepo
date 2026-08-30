/**
 * Where the client can actually see their site.
 *
 * There is no `preview_url` or `live_url` column: a workspace's hostnames live
 * in `workspace_hosts` (one row flagged `is_primary`), and the automatic
 * preview subdomain is derived from the slug the same way
 * `lib/hosting/deploy.ts` derives it, through `getSubdomainUrl` so the base
 * domain is never hardcoded. A link is only offered once `deploy_status` says
 * something has actually been deployed — a dead link is worse than none.
 */
import { getSubdomainUrl } from '@flowstarter/platform-config';

export interface SiteLink {
  kind: 'live' | 'preview';
  href: string;
  hostname: string;
  label: string;
}

export interface SiteLinkInput {
  slug: string | null | undefined;
  deployStatus: string | null | undefined;
  hosts: Array<{ hostname: string; is_primary: boolean | null }>;
}

/** Deploy states in which something is genuinely being served. */
const SERVING = new Set(['live', 'deploying']);

export function resolveSiteLink({
  slug,
  deployStatus,
  hosts,
}: SiteLinkInput): SiteLink | null {
  if (!SERVING.has(deployStatus ?? '')) return null;

  const primary = hosts.find((host) => host.is_primary)?.hostname;
  if (primary) {
    return {
      kind: 'live',
      hostname: primary,
      href: `https://${primary}`,
      label: 'View your site',
    };
  }

  if (!slug) return null;
  const hostname = getSubdomainUrl(`${slug}.preview`).replace(
    /^https?:\/\//,
    ''
  );
  return {
    kind: 'preview',
    hostname,
    href: `https://${hostname}`,
    label: 'View your preview',
  };
}
