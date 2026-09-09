/**
 * GET /api/team/projects/[id]/pipeline/jobs/[jobId]/events
 *
 * The build conversation: the worker's phases and logs, the agents' replies
 * and the operators' notes for one job, oldest first. `?after=<iso>` for the
 * live panel's polling.
 */
export { jobEventsHandler as GET } from '@/lib/flowstarter/pipeline/api';
