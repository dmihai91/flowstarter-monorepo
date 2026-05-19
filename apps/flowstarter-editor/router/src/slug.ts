/**
 * Workspace-slug parsing — an EXACT mirror of the editor server's
 * `parseWorkspaceSlugFromHost` (apps/flowstarter-editor/server/src/auth/
 * clerkGate.ts:256-270). The router MUST derive the slug identically to
 * the gate, or routing and auth would disagree (request lands on the
 * wrong process / a non-member is served the wrong workspace).
 *
 * Keep these two in sync. `router/test/slug.test.ts` pins parity.
 */

export function parseWorkspaceSlugFromHost(
  host: string | null | undefined,
  publicDomainEnv: string | undefined = process.env.EDITOR_PUBLIC_DOMAIN,
): string | null {
  if (!host) return null;
  const cleaned = host
    .split(",")[0]
    ?.trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
  if (!cleaned) return null;
  if (cleaned === "localhost" || cleaned.endsWith(".local")) return null;

  const publicDomain = (publicDomainEnv ?? "flowstarter.net").toLowerCase();
  if (!cleaned.endsWith(`.${publicDomain}`)) return null;

  const head = cleaned.slice(0, -`.${publicDomain}`.length);
  if (!head || head === "www" || head.includes(".")) return null;
  // Slugs are alphanumeric + dashes only.
  if (!/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(head)) return null;
  return head;
}
