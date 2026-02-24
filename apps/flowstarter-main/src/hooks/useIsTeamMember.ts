'use client';

import { useUser } from '@clerk/nextjs';

/**
 * Hook to check if the current user is a team member
 * Team members have access to creation/edit features
 * Regular users (clients) only see their projects
 * 
 * Uses Clerk publicMetadata.role to determine access:
 * - 'team' or 'admin' = team member with full access
 * - anything else = regular user (client)
 * 
 * To set a user as team member in Clerk Dashboard:
 * 1. Go to Users → Select user
 * 2. Edit publicMetadata: { "role": "team" }
 */
export function useIsTeamMember(): { isTeamMember: boolean; isLoaded: boolean } {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) {
    return { isTeamMember: false, isLoaded };
  }

  // Check publicMetadata for role
  const metadata = user.publicMetadata as { role?: string } | undefined;
  const role = metadata?.role?.toLowerCase();
  
  const isTeamMember = role === 'team' || role === 'admin';

  return { isTeamMember, isLoaded };
}
