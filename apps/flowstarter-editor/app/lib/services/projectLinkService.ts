/**
 * Project Link Service
 *
 * Handles linking editor (Convex) projects to the main platform (Supabase).
 * Used for reverse sync: when a project is created in the editor,
 * this service creates a corresponding record in Supabase.
 */

const MAIN_PLATFORM_URL =
  typeof window !== 'undefined' && window.location.hostname.includes('flowstarter.dev')
    ? 'https://flowstarter.dev'
    : 'http://localhost:3000';

interface LinkProjectParams {
  convexProjectId: string;
  projectName: string;
  projectDescription?: string;
  clerkToken: string;
}

interface LinkProjectResult {
  supabaseProjectId: string;
  alreadyLinked: boolean;
}

/**
 * Create a Supabase project record linked to a Convex project.
 * Fire-and-forget safe — caller should not block on this.
 */
export async function linkProjectToSupabase({
  convexProjectId,
  projectName,
  projectDescription,
  clerkToken,
}: LinkProjectParams): Promise<LinkProjectResult | null> {
  try {
    const response = await fetch(`${MAIN_PLATFORM_URL}/api/editor/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
      },
      body: JSON.stringify({
        convexProjectId,
        projectName,
        projectDescription,
      }),
    });

    if (!response.ok) {
      console.warn('[ProjectLink] Failed to link project:', response.status);
      return null;
    }

    const data = await response.json();
    return {
      supabaseProjectId: data.supabaseProjectId,
      alreadyLinked: data.alreadyLinked,
    };
  } catch (error) {
    console.warn('[ProjectLink] Error linking project:', error);
    return null;
  }
}
