import 'server-only';

import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import type { Json } from '@/lib/database.types';
import type { RoutingResult } from './routing-rules';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface RecordIntakeSubmissionInput {
  workspaceId: string;
  /** The discovery wizard payload, stored verbatim for calibration. */
  payload: Record<string, unknown>;
  routing: RoutingResult;
}

export interface RecordIntakeSubmissionResult {
  id: string;
}

/**
 * Persists the deterministic routing verdict alongside the intake payload,
 * so it can later be compared against the real project outcome
 * (`intake_submissions.outcome`, filled in separately once known).
 *
 * ── Why this is never called from the wizard-submit path ───────────────────
 * `intake_submissions.workspace_id` is `NOT NULL` (migration
 * 20260829090000_concierge_foundation_data_model.sql), but the discovery
 * wizard runs and submits BEFORE any workspace exists — the claim route
 * (`app/api/flowstarter/projects/claim/**`, owned by another agent) is what
 * creates the workspace. Loosening the column to nullable would need a
 * migration, and migrations are that agent's territory, not mine, so this
 * helper does not touch the schema.
 *
 * Instead, this only ever runs from a context that already has a
 * `workspaceId` — i.e. it is meant to be called by the claim flow
 * immediately after it creates the workspace, passing through the discovery
 * payload plus the `classifyRouting(data)` result computed when the wizard
 * was submitted (carried alongside the claim request). That keeps
 * `workspace_id` always populated with zero schema changes and zero
 * conflict with the migration another agent owns.
 */
export async function recordIntakeSubmission({
  workspaceId,
  payload,
  routing,
}: RecordIntakeSubmissionInput): Promise<RecordIntakeSubmissionResult> {
  if (!workspaceId || !UUID.test(workspaceId)) {
    throw new Error('recordIntakeSubmission requires a valid workspaceId');
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('intake_submissions')
    .insert({
      workspace_id: workspaceId,
      payload: payload as unknown as Json,
      score: routing.score,
      routing_decision: routing.decision,
      rules_fired: routing.rulesFired,
      decided_by: 'rules',
    })
    .select('id')
    .single();

  if (error) throw error;
  return { id: (data as { id: string }).id };
}

export interface ApplyRoutingOverrideInput {
  workspaceId: string;
  decision: 'standard' | 'custom';
  reason: string;
  /** Clerk user id of the operator making the call, or 'system'. */
  actor: string;
}

export interface ApplyRoutingOverrideResult {
  id: string;
}

/**
 * Manually overrides the routing decision on a workspace's most recent
 * intake submission. Writes `decided_by: 'override'`, `overridden: true`,
 * `override_reason`, and logs a `project_events` row (`kind:
 * 'routing_overridden'`) so the change is visible in the audit trail.
 *
 * No UI here — an admin screen (owned elsewhere) calls this.
 */
export async function applyRoutingOverride({
  workspaceId,
  decision,
  reason,
  actor,
}: ApplyRoutingOverrideInput): Promise<ApplyRoutingOverrideResult> {
  if (!workspaceId || !UUID.test(workspaceId)) {
    throw new Error('applyRoutingOverride requires a valid workspaceId');
  }
  if (!reason || !reason.trim()) {
    throw new Error('applyRoutingOverride requires a reason');
  }
  if (!actor || !actor.trim()) {
    throw new Error('applyRoutingOverride requires an actor');
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: latest, error: findError } = await supabase
    .from('intake_submissions')
    .select('id')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;
  if (!latest) {
    throw new Error(
      `applyRoutingOverride found no intake_submissions row for workspace ${workspaceId}`
    );
  }
  const submissionId = (latest as { id: string }).id;

  const { error: updateError } = await supabase
    .from('intake_submissions')
    .update({
      routing_decision: decision,
      decided_by: 'override',
      overridden: true,
      override_reason: reason,
    })
    .eq('id', submissionId);

  if (updateError) throw updateError;

  const { error: eventError } = await supabase.from('project_events').insert({
    workspace_id: workspaceId,
    kind: 'routing_overridden',
    actor,
    payload: { decision, reason, intakeSubmissionId: submissionId } as Json,
  });

  if (eventError) throw eventError;

  return { id: submissionId };
}
