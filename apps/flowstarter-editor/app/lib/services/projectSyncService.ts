/**
 * Project Sync Service
 *
 * Syncs project data from the editor to the main platform's Supabase.
 * Uses the handoff token for authentication.
 */

// Main platform URL - configure via environment
const MAIN_PLATFORM_URL = import.meta.env.VITE_MAIN_PLATFORM_URL || 
  (import.meta.env.PROD ? 'https://flowstarter.app' : 'https://flowstarter.dev');

// Storage keys
const HANDOFF_TOKEN_KEY = 'flowstarter_handoff_token';
const HANDOFF_DATA_KEY = 'flowstarter_handoff_data';

/**
 * Project sync data structure
 */
export interface ProjectSyncData {
  // Basic info
  name?: string;
  description?: string;

  // Business info (from onboarding)
  businessInfo?: {
    uvp?: string;
    targetAudience?: string;
    businessGoals?: string[];
    brandTone?: string;
    pricingOffers?: string;
    industry?: string;
  };

  // Design choices
  template?: {
    id: string;
    name: string;
    slug?: string;
  };
  palette?: {
    id: string;
    name: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
  };
  fonts?: {
    id: string;
    name: string;
    heading: { family: string; weight: number };
    body: { family: string; weight: number };
  };

  // Status
  onboardingStep?: string;
  onboardingComplete?: boolean;
}

/**
 * Get stored handoff info
 */
export function getHandoffInfo(): { token: string; projectId: string } | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem(HANDOFF_TOKEN_KEY);
  const dataStr = localStorage.getItem(HANDOFF_DATA_KEY);

  if (!token || !dataStr) {
    return null;
  }

  try {
    const data = JSON.parse(dataStr);

    if (data.projectId && data.fromMainPlatform) {
      return { token, projectId: data.projectId };
    }
  } catch {
    // Invalid data
  }

  return null;
}

/**
 * Store handoff token for future sync operations
 */
export function storeHandoffToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(HANDOFF_TOKEN_KEY, token);
}

/**
 * Clear handoff data (call when project is complete or user leaves)
 */
export function clearHandoffData(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(HANDOFF_TOKEN_KEY);
  localStorage.removeItem(HANDOFF_DATA_KEY);
}

/**
 * Check if we have a valid handoff connection
 */
export function hasHandoffConnection(): boolean {
  return getHandoffInfo() !== null;
}

/**
 * Sync project data to the main platform
 *
 * @param data - Project data to sync
 * @returns Promise with sync result
 */
export async function syncProjectToMainPlatform(data: ProjectSyncData): Promise<{ success: boolean; error?: string }> {
  const handoff = getHandoffInfo();

  if (!handoff) {
    console.log('[ProjectSync] No handoff connection, skipping sync');
    return { success: true }; // Not an error - just no handoff to sync to
  }

  try {
    console.log('[ProjectSync] Syncing to main platform:', {
      projectId: handoff.projectId,
      dataKeys: Object.keys(data),
    });

    const response = await fetch(`${MAIN_PLATFORM_URL}/api/editor/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${handoff.token}`,
      },
      body: JSON.stringify({
        projectId: handoff.projectId,
        data,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[ProjectSync] Sync failed:', response.status, errorData);

      return {
        success: false,
        error: (errorData as { error?: string }).error || `Sync failed: ${response.status}`,
      };
    }

    const result = await response.json();
    console.log('[ProjectSync] Sync successful:', result);

    return { success: true };
  } catch (error) {
    console.error('[ProjectSync] Sync error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Fetch project data from the main platform
 */
export async function fetchProjectFromMainPlatform(): Promise<{
  success: boolean;
  project?: Record<string, unknown>;
  error?: string;
}> {
  const handoff = getHandoffInfo();

  if (!handoff) {
    return { success: false, error: 'No handoff connection' };
  }

  try {
    const response = await fetch(`${MAIN_PLATFORM_URL}/api/editor/sync?projectId=${handoff.projectId}`, {
      headers: {
        Authorization: `Bearer ${handoff.token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: (errorData as { error?: string }).error || `Fetch failed: ${response.status}`,
      };
    }

    const result = (await response.json()) as { project?: Record<string, unknown> };

    return { success: true, project: result.project };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Convenience functions for syncing specific onboarding steps
 */

export async function syncProjectName(name: string): Promise<{ success: boolean; error?: string }> {
  return syncProjectToMainPlatform({ name });
}

export async function syncProjectDescription(description: string): Promise<{ success: boolean; error?: string }> {
  return syncProjectToMainPlatform({ description });
}

export async function syncBusinessInfo(businessInfo: ProjectSyncData['businessInfo']): Promise<{
  success: boolean;
  error?: string;
}> {
  return syncProjectToMainPlatform({
    businessInfo,
    onboardingStep: 'template',
  });
}

export async function syncTemplateSelection(template: ProjectSyncData['template']): Promise<{
  success: boolean;
  error?: string;
}> {
  return syncProjectToMainPlatform({
    template,
    onboardingStep: 'palette',
  });
}

export async function syncPaletteSelection(palette: ProjectSyncData['palette']): Promise<{
  success: boolean;
  error?: string;
}> {
  return syncProjectToMainPlatform({
    palette,
    onboardingStep: 'font',
  });
}

export async function syncFontSelection(fonts: ProjectSyncData['fonts']): Promise<{
  success: boolean;
  error?: string;
}> {
  return syncProjectToMainPlatform({
    fonts,
    onboardingStep: 'creating',
  });
}

export async function syncOnboardingComplete(): Promise<{ success: boolean; error?: string }> {
  return syncProjectToMainPlatform({
    onboardingStep: 'ready',
    onboardingComplete: true,
  });
}

