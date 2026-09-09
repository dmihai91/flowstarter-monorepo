/**
 * POST /api/admin/projects/[id]/changes/[changeId]/status
 *
 * Declines a request, or marks a paid one done once the work has shipped.
 */
export { setChangeRequestStatusHandler as POST } from '@/lib/flowstarter/change-requests-api';
