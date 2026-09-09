/**
 * GET /api/admin/projects/[id]/pipeline/jobs/[jobId]/log
 *
 * The full build log: every line the agents narrated, every tool call they
 * made, and every line the machine printed, oldest first. `?format=text` for
 * a downloadable `HH:MM:SS [source] text` file.
 */
export { jobLogHandler as GET } from '@/lib/flowstarter/pipeline/job-log-api';
