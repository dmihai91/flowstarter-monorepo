/**
 * GET /api/team/projects/pipeline
 *
 * Every workspace in the concierge flow, grouped by project_state, with the
 * stall signals an operator needs. A static sibling of `[id]` in the same
 * shape as `projects/draft`.
 *
 * Auth: operator-only, inside the shared handler.
 * Implementation: `@/lib/flowstarter/pipeline/api` — /admin and /team are the
 * same surface under two names and must not be allowed to drift.
 */
export { pipelineBoardHandler as GET } from '@/lib/flowstarter/pipeline/api';
