/**
 * React hook for user mode and capabilities
 * SSR-safe - returns guest mode on server
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  getUserMode, 
  getModeCapabilities, 
  getTeamUser, 
  getClientUser,
  type UserMode,
  type ModeCapabilities,
  type TeamUser,
  type ClientUser,
} from '~/lib/team-auth';

interface UseUserModeReturn {
  mode: UserMode;
  capabilities: ModeCapabilities;
  teamUser: TeamUser | null;
  clientUser: ClientUser | null;
  isTeam: boolean;
  isClient: boolean;
  isGuest: boolean;
  isLoading: boolean;
}

// Default capabilities for guest (used during SSR)
const GUEST_CAPABILITIES: ModeCapabilities = {
  canGenerateMagicLink: false,
  canPublish: false,
  canEditCode: false,
  canUseTerminal: false,
  canDeleteProject: false,
  canAccessAllProjects: false,
  customizationLevel: 'none',
};

export function useUserMode(): UseUserModeReturn {
  const [mode, setMode] = useState<UserMode>('guest');
  const [teamUser, setTeamUser] = useState<TeamUser | null>(null);
  const [clientUser, setClientUser] = useState<ClientUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Read from localStorage on client only
    const currentMode = getUserMode();
    setMode(currentMode);
    
    if (currentMode === 'team') {
      setTeamUser(getTeamUser());
    } else if (currentMode === 'client') {
      setClientUser(getClientUser());
    }
    
    setIsLoading(false);
  }, []);

  // Memoize capabilities to prevent unnecessary re-renders
  const capabilities = useMemo(() => {
    if (!isMounted) return GUEST_CAPABILITIES;
    return getModeCapabilities(mode);
  }, [mode, isMounted]);

  return {
    mode,
    capabilities,
    teamUser,
    clientUser,
    isTeam: isMounted && mode === 'team',
    isClient: isMounted && mode === 'client',
    isGuest: !isMounted || mode === 'guest',
    isLoading: !isMounted || isLoading,
  };
}
