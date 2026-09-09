/**
 * GET /api/team/projects/[id]/changes
 *
 * The client's change requests with the rule table's suggested price on each.
 */
export { listChangeRequestsHandler as GET } from '@/lib/flowstarter/change-requests-api';
