/**
 * React hook for user mode and capabilities
 */

import { useState, useEffect } from 'react';
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

export function useUserMode(): UseUserModeReturn {
  const [mode, setMode] = useState<UserMode>('guest');
  const [teamUser, setTeamUser] = useState<TeamUser | null>(null);
  const [clientUser, setClientUser] = useState<ClientUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Read from localStorage on client
    const currentMode = getUserMode();
    setMode(currentMode);
    
    if (currentMode === 'team') {
      setTeamUser(getTeamUser());
    } else if (currentMode === 'client') {
      setClientUser(getClientUser());
    }
    
    setIsLoading(false);
  }, []);

  const capabilities = getModeCapabilities(mode);

  return {
    mode,
    capabilities,
    teamUser,
    clientUser,
    isTeam: mode === 'team',
    isClient: mode === 'client',
    isGuest: mode === 'guest',
    isLoading,
  };
}
