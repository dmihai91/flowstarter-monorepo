/**
 * Team Auth Utilities
 * 
 * Simple auth for team members (Darius, Dorin).
 * Stored in localStorage, checked client-side.
 */

export interface TeamUser {
  email: string;
  name: string;
}

/**
 * Check if current user is authenticated as team member
 */
export function isTeamAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('flowstarter_team_token');
  const mode = localStorage.getItem('flowstarter_mode');
  
  return !!token && mode === 'team';
}

/**
 * Get current team user
 */
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

/**
 * Clear team session (logout)
 */
export function clearTeamSession(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('flowstarter_team_token');
  localStorage.removeItem('flowstarter_team_user');
  localStorage.removeItem('flowstarter_mode');
}

/**
 * Check if in team mode (for UI decisions)
 */
export function isTeamMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('flowstarter_mode') === 'team';
}

/**
 * Check if in client mode
 */
export function isClientMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('flowstarter_mode') === 'client';
}
