/**
 * Team Auth - Mode and Capabilities
 * 
 * This module provides user mode detection and capability management.
 * Authentication is handled by Clerk, this handles authorization levels.
 */

export type UserMode = 'guest' | 'client' | 'team';

export interface TeamUser {
  id: string;
  email: string;
  name?: string;
}

export interface ClientUser {
  email: string;
  projectId?: string;
}

export interface ModeCapabilities {
  canGenerateMagicLink: boolean;
  canPublish: boolean;
  canEditCode: boolean;
  canUseTerminal: boolean;
  canDeleteProject: boolean;
  canAccessAllProjects: boolean;
  customizationLevel: 'none' | 'basic' | 'advanced' | 'full';
}

// Team email domains
export const TEAM_EMAIL_DOMAINS = ['flowstarter.app'];

// Storage keys
const STORAGE_KEYS = {
  teamSession: 'fs_team_session',
  clientSession: 'fs_client_session',
} as const;

/**
 * Get current user mode
 */
export function getUserMode(): UserMode {
  if (typeof window === 'undefined') return 'guest';
  
  const teamSession = localStorage.getItem(STORAGE_KEYS.teamSession);
  if (teamSession) return 'team';
  
  const clientSession = localStorage.getItem(STORAGE_KEYS.clientSession);
  if (clientSession) return 'client';
  
  return 'guest';
}

/**
 * Check if in team mode
 */
export function isTeamMode(): boolean {
  return getUserMode() === 'team';
}

/**
 * Get team user from storage
 */
export function getTeamUser(): TeamUser | null {
  if (typeof window === 'undefined') return null;
  
  const session = localStorage.getItem(STORAGE_KEYS.teamSession);
  if (!session) return null;
  
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

/**
 * Get client user from storage
 */
export function getClientUser(): ClientUser | null {
  if (typeof window === 'undefined') return null;
  
  const session = localStorage.getItem(STORAGE_KEYS.clientSession);
  if (!session) return null;
  
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

/**
 * Set team session (called after Clerk auth)
 */
export function setTeamSession(userId: string, userData: { email: string; name?: string }) {
  if (typeof window === 'undefined') return;
  
  const teamUser: TeamUser = {
    id: userId,
    email: userData.email,
    name: userData.name,
  };
  
  localStorage.setItem(STORAGE_KEYS.teamSession, JSON.stringify(teamUser));
}

/**
 * Clear team session
 */
export function clearTeamSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.teamSession);
}

/**
 * Set client session (for magic link access)
 */
export function setClientSession(email: string, projectId?: string) {
  if (typeof window === 'undefined') return;
  
  const clientUser: ClientUser = { email, projectId };
  localStorage.setItem(STORAGE_KEYS.clientSession, JSON.stringify(clientUser));
}

/**
 * Clear client session
 */
export function clearClientSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.clientSession);
}

/**
 * Get capabilities for a mode
 */
export function getModeCapabilities(mode: UserMode): ModeCapabilities {
  switch (mode) {
    case 'team':
      return {
        canGenerateMagicLink: true,
        canPublish: true,
        canEditCode: true,
        canUseTerminal: true,
        canDeleteProject: true,
        canAccessAllProjects: true,
        customizationLevel: 'full',
      };
    case 'client':
      return {
        canGenerateMagicLink: false,
        canPublish: false,
        canEditCode: false,
        canUseTerminal: false,
        canDeleteProject: false,
        canAccessAllProjects: false,
        customizationLevel: 'basic',
      };
    default:
      return {
        canGenerateMagicLink: false,
        canPublish: false,
        canEditCode: false,
        canUseTerminal: false,
        canDeleteProject: false,
        canAccessAllProjects: false,
        customizationLevel: 'none',
      };
  }
}

/**
 * Check if team authenticated
 */
export function isTeamAuthenticated(): boolean {
  return getUserMode() === 'team';
}
