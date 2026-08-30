/**
 * Which projects belong to the signed-in client.
 *
 * Membership is the only thing that grants a client sight of a workspace, so
 * the list is built from `workspace_memberships` and never from a workspace
 * column. Two round trips rather than an embedded join: the join returns a
 * shape that changes with the FK metadata, and this runs on the first page a
 * client sees.
 */
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

export interface ClientWorkspaceSummary {
  id: string;
  name: string;
  clientBusinessName: string | null;
  projectState: string | null;
  updatedAt: string | null;
}

export async function listClientWorkspaces(
  clerkUserId: string
): Promise<ClientWorkspaceSummary[]> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: memberships, error: membershipError } = await supabase
    .from('workspace_memberships')
    .select('workspace_id')
    .eq('clerk_user_id', clerkUserId);
  if (membershipError) throw membershipError;

  const ids = (memberships ?? [])
    .map((row) => row.workspace_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
  if (ids.length === 0) return [];

  const { data: workspaces, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, name, client_business_name, project_state, updated_at')
    .in('id', ids);
  if (workspaceError) throw workspaceError;

  return (workspaces ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    clientBusinessName: row.client_business_name ?? null,
    projectState: row.project_state ?? null,
    updatedAt: row.updated_at ?? null,
  }));
}

/** The name to show a client for their own project. */
export function workspaceDisplayName(
  workspace: Pick<ClientWorkspaceSummary, 'name' | 'clientBusinessName'>
): string {
  return (
    workspace.clientBusinessName?.trim() || workspace.name || 'Your project'
  );
}
