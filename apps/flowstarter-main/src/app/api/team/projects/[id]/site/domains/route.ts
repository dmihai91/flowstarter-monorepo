/**
 * POST /api/team/projects/[id]/site/domains — attach a custom domain.
 * DELETE /api/team/projects/[id]/site/domains?domain=xxx — detach one.
 *
 * See `addWorkspaceDomainHandler` / `removeWorkspaceDomainHandler` in
 * `@/lib/hosting/site-domains-api` for the actual behavior — shared with the
 * `/api/admin/...` twin of this route so the two cannot drift.
 */
export {
  addWorkspaceDomainHandler as POST,
  removeWorkspaceDomainHandler as DELETE,
} from '@/lib/hosting/site-domains-api';
