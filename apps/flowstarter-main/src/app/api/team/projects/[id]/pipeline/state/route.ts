/**
 * POST /api/team/projects/[id]/pipeline/state
 *
 * Operator override of project_state, guarded by the shared transition map and
 * written to project_events as `state_overridden`.
 */
export { overrideStateHandler as POST } from '@/lib/flowstarter/pipeline/api';
