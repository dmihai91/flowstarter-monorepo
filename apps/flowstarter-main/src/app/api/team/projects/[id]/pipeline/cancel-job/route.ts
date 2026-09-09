/**
 * POST /api/team/projects/[id]/pipeline/cancel-job
 *
 * Cancels a stuck queued/running job with a recorded reason.
 */
export { cancelJobHandler as POST } from '@/lib/flowstarter/pipeline/api';
