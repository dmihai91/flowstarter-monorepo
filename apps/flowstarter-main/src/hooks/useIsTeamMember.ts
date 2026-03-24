'use client';

import { useUser } from '@clerk/nextjs';

/**
 * Hook to check the current user's role.
 *
 * Roles (Clerk publicMetadata.role):
 *   'admin'        — full access: all projects, revenue, client stats
 *   'team'         — team member: create/edit projects, no admin panels
 *   'partner' /
 *   'collaborator' — assigned projects only, read-only revenue
 *   anything else  — regular client user
 *
 * To set a role in Clerk Dashboard:
 *   Users → Select user → Edit publicMetadata: { "role": "admin" }
 */
export function useIsTeamMember(): {
  isTeamMember: boolean;
  isAdmin: boolean;
  isCollaborator: boolean;
  role: string | undefined;
  isLoaded: boolean;
} {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) {
    return { isTeamMember: false, isAdmin: false, isCollaborator: false, role: undefined, isLoaded };
  }

  const metadata = user.publicMetadata as { role?: string } | undefined;
  const role = metadata?.role?.toLowerCase();

  const isAdmin = role === 'admin';
  const isTeamMember = role === 'team' || role === 'admin';
  const isCollaborator = role === 'partner' || role === 'collaborator';

  return { isTeamMember, isAdmin, isCollaborator, role, isLoaded };
}
