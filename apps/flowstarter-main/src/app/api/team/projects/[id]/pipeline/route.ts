/**
 * GET /api/team/projects/[id]/pipeline
 *
 * The project's audit timeline (project_events) and its job ledger history,
 * plus the state moves an operator is allowed to make from here.
 */
export { pipelineDetailHandler as GET } from '@/lib/flowstarter/pipeline/api';
