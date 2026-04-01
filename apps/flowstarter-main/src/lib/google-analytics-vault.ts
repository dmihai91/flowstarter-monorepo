/**
 * Google Analytics credentials via Supabase Vault.
 *
 * New path: project-level GA config with refresh token in Vault.
 * Falls back to legacy user_integrations table.
 */
import 'server-only';
import { readProjectIntegrationSnapshot } from '@/lib/project-integrations';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
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
export async function getProjectGACredentials(
  projectId: string
): Promise<ProjectGA | null> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  const snapshot = readProjectIntegrationSnapshot(
    project as Record<string, unknown> | null | undefined
  );

  if (
    !snapshot.analytics.propertyId ||
    !snapshot.analytics.refreshTokenSecretId
  ) {
    return null;
  }

  // Decrypt refresh token from Vault
  const refreshToken = await readSecret(
    supabase,
    snapshot.analytics.refreshTokenSecretId
  );
  if (!refreshToken) return null;

  // Exchange for access token
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:
        process.env.GOOGLE_CLIENT_ID ||
        process.env.GOOGLE_OAUTH_CLIENT_ID ||
        '',
      client_secret:
        process.env.GOOGLE_CLIENT_SECRET ||
        process.env.GOOGLE_OAUTH_CLIENT_SECRET ||
        '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    console.error('[GA-Vault] Token refresh failed:', res.status);
    return null;
  }

  const { access_token } = (await res.json()) as { access_token: string };
  return {
    propertyId: snapshot.analytics.propertyId,
    accessToken: access_token,
  };
}

/**
 * Get GA credentials for all projects belonging to a user.
 * Used by the dashboard stats aggregation.
 */
export async function getAllProjectGACredentials(
  userId: string
): Promise<ProjectGA[]> {
  const supabase = createSupabaseServiceRoleClient();

  // Get all projects with GA configured (via team membership or ownership)
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId);

  if (!projects?.length) return [];

  const results: ProjectGA[] = [];

  for (const project of projects) {
    const snapshot = readProjectIntegrationSnapshot(
      project as Record<string, unknown>
    );
    if (
      !snapshot.analytics.propertyId ||
      !snapshot.analytics.refreshTokenSecretId
    ) {
      continue;
    }
    try {
      const creds = await getProjectGACredentials(project.id);
      if (creds) results.push(creds);
    } catch (e) {
      console.error(`[GA-Vault] Failed for project ${project.id}:`, e);
    }
  }

  return results;
}
