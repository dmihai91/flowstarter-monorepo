/**
 * POST /api/admin/projects/[id]/pipeline/jobs/[jobId]/notes
 *
 * A note from an operator to the agents building this site, folded into the
 * worker's next pass.
 */
export { jobNoteHandler as POST } from '@/lib/flowstarter/pipeline/api';
