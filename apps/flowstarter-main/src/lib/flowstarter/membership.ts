import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface EnsureClientMembershipInput {
  workspaceId: string;
  clerkUserId: string;
}

export interface EnsureClientMembershipResult {
  workspaceId: string;
  clerkUserId: string;
  /** False when the membership already existed and was left untouched. */
  created: boolean;
}

/**
 * Gives a Clerk user client-role membership of a workspace, which is what the
 * RLS policies check before letting anyone read their own project.
 *
 * Idempotent: the row's primary key is (workspace_id, clerk_user_id), and a
 * conflict is ignored rather than overwritten. That matters — re-running this
 * for a teammate who is already an 'admin' must not demote them to 'client'.
 */
export async function ensureClientMembership({
  workspaceId,
  clerkUserId,
}: EnsureClientMembershipInput): Promise<EnsureClientMembershipResult> {
  if (!workspaceId || !UUID.test(workspaceId)) {
    throw new Error('ensureClientMembership requires a valid workspaceId');
  }
  if (!clerkUserId || !clerkUserId.trim()) {
    throw new Error('ensureClientMembership requires a clerkUserId');
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('workspace_memberships')
    .upsert(
      {
        workspace_id: workspaceId,
        clerk_user_id: clerkUserId,
        role: 'client',
      },
      { onConflict: 'workspace_id,clerk_user_id', ignoreDuplicates: true }
    )
    .select('workspace_id, clerk_user_id, role');

  if (error) throw error;

  return {
    workspaceId,
    clerkUserId,
    created: (data?.length ?? 0) > 0,
  };
}
