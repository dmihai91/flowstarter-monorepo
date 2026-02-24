'use client';

import { useUser } from '@clerk/nextjs';

// Team email domain that has access to creation features
const TEAM_DOMAIN = 'flowstarter.app';

/**
 * Hook to check if the current user is a team member
 * Team members have access to creation/edit features
 * Regular users (clients) only see their projects
 */
export function useIsTeamMember(): { isTeamMember: boolean; isLoaded: boolean } {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) {
    return { isTeamMember: false, isLoaded };
  }

  const email = user.primaryEmailAddress?.emailAddress || '';
  const domain = email.split('@')[1]?.toLowerCase() || '';
  
  const isTeamMember = domain === TEAM_DOMAIN;

  return { isTeamMember, isLoaded };
}
