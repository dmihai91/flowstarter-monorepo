'use client';

import { useUser } from '@clerk/nextjs';

// Team email domains that have access to creation features
const TEAM_DOMAINS = [
  'flowstarter.app',
  'flowstarter.dev',
  'flowstarter.io',
];

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
  
  const isTeamMember = TEAM_DOMAINS.includes(domain);

  return { isTeamMember, isLoaded };
}
