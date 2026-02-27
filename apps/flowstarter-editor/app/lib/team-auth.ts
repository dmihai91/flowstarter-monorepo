/**
 * Team Auth Utilities
 * 
 * Handles user mode detection and capabilities for the editor.
 * Works with Clerk shared authentication across subdomains.
 */

// Storage keys
const STORAGE_KEYS = {
  MODE: 'flowstarter_user_mode',
  TEAM_USER: 'flowstarter_team_user',
  CLIENT_USER: 'flowstarter_client_user',
} as const;

// User mode types
export type UserMode = 'guest' | 'team' | 'client';

// Team user data (staff members)
export interface TeamUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'developer' | 'support';
  permissions: string[];
}

// Client user data (customers)
export interface ClientUser {
  id: string;
  email: string;
  name: string;
  organizationId?: string;
  organizationName?: string;
}

// Mode-based capabilities
export interface ModeCapabilities {
  canGenerateMagicLink: boolean;
  canPublish: boolean;
  canEditCode: boolean;
  canUseTerminal: boolean;
  canDeleteProject: boolean;
  canAccessAllProjects: boolean;
  customizationLevel: 'none' | 'basic' | 'full';
}

// Capability definitions by mode
const CAPABILITIES: Record<UserMode, ModeCapabilities> = {
  guest: {
    canGenerateMagicLink: false,
    canPublish: false,
    canEditCode: false,
    canUseTerminal: false,
    canDeleteProject: false,
    canAccessAllProjects: false,
    customizationLevel: 'none',
  },
  client: {
    canGenerateMagicLink: false,
    canPublish: true,
    canEditCode: true,
    canUseTerminal: false,
    canDeleteProject: false,
    canAccessAllProjects: false,
    customizationLevel: 'basic',
  },
  team: {
    canGenerateMagicLink: true,
    canPublish: true,
    canEditCode: true,
    canUseTerminal: true,
    canDeleteProject: true,
    canAccessAllProjects: true,
    customizationLevel: 'full',
  },
};

// Team email domains
const TEAM_EMAIL_DOMAINS = ['flowstarter.app', 'flowstarter.dev', 'flowstarter.com'];

/**
 * Safe localStorage getter (SSR-safe)
 */
function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safe localStorage setter (SSR-safe)
 */
function safeSetItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Safe localStorage remover (SSR-safe)
 */
function safeRemoveItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if an email belongs to a team member
 */
export function isTeamEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? TEAM_EMAIL_DOMAINS.includes(domain) : false;
}

/**
 * Get current user mode
 */
export function getUserMode(): UserMode {
  const mode = safeGetItem(STORAGE_KEYS.MODE);
  if (mode === 'team' || mode === 'client') {
    return mode;
  }
  return 'guest';
}

/**
 * Check if current mode is team
 */
export function isTeamMode(): boolean {
  return getUserMode() === 'team';
}

/**
 * Check if current mode is client
 */
export function isClientMode(): boolean {
  return getUserMode() === 'client';
}

/**
 * Get capabilities for a given mode
 */
export function getModeCapabilities(mode: UserMode): ModeCapabilities {
  return CAPABILITIES[mode] || CAPABILITIES.guest;
}

/**
 * Get current user's capabilities
 */
export function getCurrentCapabilities(): ModeCapabilities {
  return getModeCapabilities(getUserMode());
}

/**
 * Get team user data
 */
export function getTeamUser(): TeamUser | null {
  const data = safeGetItem(STORAGE_KEYS.TEAM_USER);
  if (!data) return null;
  try {
    return JSON.parse(data) as TeamUser;
  } catch {
    return null;
  }
}

/**
 * Get client user data
 */
export function getClientUser(): ClientUser | null {
  const data = safeGetItem(STORAGE_KEYS.CLIENT_USER);
  if (!data) return null;
  try {
    return JSON.parse(data) as ClientUser;
  } catch {
    return null;
  }
}

/**
 * Set team mode with user data
 */
export function setTeamMode(user: TeamUser): void {
  safeSetItem(STORAGE_KEYS.MODE, 'team');
  safeSetItem(STORAGE_KEYS.TEAM_USER, JSON.stringify(user));
  safeRemoveItem(STORAGE_KEYS.CLIENT_USER);
}

/**
 * Set client mode with user data
 */
export function setClientMode(user: ClientUser): void {
  safeSetItem(STORAGE_KEYS.MODE, 'client');
  safeSetItem(STORAGE_KEYS.CLIENT_USER, JSON.stringify(user));
  safeRemoveItem(STORAGE_KEYS.TEAM_USER);
}

/**
 * Clear auth and return to guest mode
 */
export function clearAuth(): void {
  safeRemoveItem(STORAGE_KEYS.MODE);
  safeRemoveItem(STORAGE_KEYS.TEAM_USER);
  safeRemoveItem(STORAGE_KEYS.CLIENT_USER);
}

/**
 * Initialize user mode from Clerk session
 * Called when Clerk auth state changes
 */
export function initializeFromClerkUser(clerkUser: {
  id: string;
  primaryEmailAddress?: { emailAddress: string } | null;
  fullName?: string | null;
  firstName?: string | null;
} | null): UserMode {
  if (!clerkUser) {
    clearAuth();
    return 'guest';
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress;
  if (!email) {
    clearAuth();
    return 'guest';
  }

  const name = clerkUser.fullName || clerkUser.firstName || 'User';

  if (isTeamEmail(email)) {
    setTeamMode({
      id: clerkUser.id,
      email,
      name,
      role: 'developer', // Default role, could be fetched from metadata
      permissions: ['read', 'write', 'admin'], // Default permissions
    });
    return 'team';
  }

  setClientMode({
    id: clerkUser.id,
    email,
    name,
  });
  return 'client';
}
