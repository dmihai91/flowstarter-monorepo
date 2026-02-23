/**
 * Auth & Mode Utilities
 * 
 * Handles team authentication and mode detection.
 * - Team: Clerk auth, verified by email domain
 * - Client: Clerk auth via magic link
 */

/**
 * Team email domains that are allowed to access the editor
 */
export const TEAM_EMAIL_DOMAINS = ['flowstarter.co', 'flowstarter.com'];

/**
 * Check if a user email is a team member (client-side)
 */
export function isTeamEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return TEAM_EMAIL_DOMAINS.includes(domain);
}

export type UserMode = 'team' | 'client' | 'guest';

export interface TeamUser {
  email: string;
  name: string;
}

export interface ClientUser {
  id: string;
  email: string;
  name: string;
  projectId?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// MODE DETECTION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get current user mode
 */
export function getUserMode(): UserMode {
  if (typeof window === 'undefined') return 'guest';
  
  const mode = localStorage.getItem('flowstarter_mode');
  if (mode === 'team') return 'team';
  if (mode === 'client') return 'client';
  return 'guest';
}

export function isTeamMode(): boolean {
  return getUserMode() === 'team';
}

export function isClientMode(): boolean {
  return getUserMode() === 'client';
}

// ════════════════════════════════════════════════════════════════════════════
// TEAM AUTH
// ════════════════════════════════════════════════════════════════════════════

export function isTeamAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('flowstarter_team_token');
  return !!token && isTeamMode();
}

export function getTeamUser(): TeamUser | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('flowstarter_team_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setTeamSession(token: string, user: TeamUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('flowstarter_team_token', token);
  localStorage.setItem('flowstarter_team_user', JSON.stringify(user));
  localStorage.setItem('flowstarter_mode', 'team');
}

export function clearTeamSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('flowstarter_team_token');
  localStorage.removeItem('flowstarter_team_user');
  if (localStorage.getItem('flowstarter_mode') === 'team') {
    localStorage.removeItem('flowstarter_mode');
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CLIENT AUTH
// ════════════════════════════════════════════════════════════════════════════

export function isClientAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const session = localStorage.getItem('flowstarter_client_session');
  return !!session && isClientMode();
}

export function getClientUser(): ClientUser | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('flowstarter_client_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setClientSession(sessionToken: string, user: ClientUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('flowstarter_client_session', sessionToken);
  localStorage.setItem('flowstarter_client_user', JSON.stringify(user));
  localStorage.setItem('flowstarter_mode', 'client');
  if (user.projectId) {
    localStorage.setItem('flowstarter_client_project', user.projectId);
  }
}

export function clearClientSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('flowstarter_client_session');
  localStorage.removeItem('flowstarter_client_user');
  localStorage.removeItem('flowstarter_client_project');
  if (localStorage.getItem('flowstarter_mode') === 'client') {
    localStorage.removeItem('flowstarter_mode');
  }
}

export function getClientProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('flowstarter_client_project');
}

// ════════════════════════════════════════════════════════════════════════════
// FEATURE FLAGS (what each mode can do)
// ════════════════════════════════════════════════════════════════════════════

export interface ModeCapabilities {
  canGenerateMagicLink: boolean;
  canPublish: boolean;
  canEditCode: boolean;
  canUseTerminal: boolean;
  canDeleteProject: boolean;
  canAccessAllProjects: boolean;
  customizationLevel: 'full' | 'constrained' | 'none';
}

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
        canPublish: true, // Can publish their own changes
        canEditCode: false,
        canUseTerminal: false,
        canDeleteProject: false,
        canAccessAllProjects: false,
        customizationLevel: 'constrained',
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
