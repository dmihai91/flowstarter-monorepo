/**
 * Google Analytics credentials via Supabase Vault.
 *
 * New path: project-level GA config with refresh token in Vault.
 * Falls back to legacy user_integrations table.
 */
import 'server-only';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { readSecret } from '@/lib/vault';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface ProjectGA {
  propertyId: string;
  accessToken: string;
}

/**
 * Get GA access token for a project, using Vault-encrypted refresh token.
 * Returns null if GA not configured for this project.
 */
export async function getProjectGACredentials(projectId: string): Promise<ProjectGA | null> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: project } = await supabase
    .from('projects')
    .select('ga_property_id, ga_refresh_token_id')
    .eq('id', projectId)
    .single();

  if (!project?.ga_property_id || !project?.ga_refresh_token_id) return null;

  // Decrypt refresh token from Vault
  const refreshToken = await readSecret(supabase, project.ga_refresh_token_id);
  if (!refreshToken) return null;

  // Exchange for access token
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    console.error('[GA-Vault] Token refresh failed:', res.status);
    return null;
  }

  const { access_token } = (await res.json()) as { access_token: string };
  return { propertyId: project.ga_property_id, accessToken: access_token };
}

/**
 * Get GA credentials for all projects belonging to a user.
 * Used by the dashboard stats aggregation.
 */
export async function getAllProjectGACredentials(userId: string): Promise<ProjectGA[]> {
  const supabase = createSupabaseServiceRoleClient();

  // Get all projects with GA configured (via team membership or ownership)
  const { data: projects } = await supabase
    .from('projects')
    .select('id, ga_property_id, ga_refresh_token_id')
    .not('ga_property_id', 'is', null)
    .not('ga_refresh_token_id', 'is', null);

  if (!projects?.length) return [];

  const results: ProjectGA[] = [];

  for (const project of projects) {
    try {
      const creds = await getProjectGACredentials(project.id);
      if (creds) results.push(creds);
    } catch (e) {
      console.error(`[GA-Vault] Failed for project ${project.id}:`, e);
    }
  }

  return results;
}
