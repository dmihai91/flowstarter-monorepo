import 'server-only';

import {
  buildProjectIntegrationUpdate,
  readProjectIntegrationSnapshot,
} from '@/lib/project-integrations';
import { readUserSecret } from '@/lib/user-integration-vault';
import { readSecret } from '@/lib/vault';
import type { SupabaseClient } from '@supabase/supabase-js';

type ProjectRow = {
  id: string;
  user_id: string | null;
  status?: string | null;
  is_draft?: boolean | null;
  updated_at?: string | null;
  created_at?: string | null;
  calendly_api_key_id?: string | null;
  calendly_url?: string | null;
};

type CalendlyIntegrationConfig = {
  access_token_secret_id?: string;
};

function pickProjectForCalendlySync(projects: ProjectRow[]): ProjectRow | null {
  if (projects.length === 0) return null;

  const liveProject = projects.find(
    (project) =>
      !project.is_draft &&
      (project.status === 'active' || project.status === 'completed')
  );
  if (liveProject) return liveProject;

  const nonDraftProject = projects.find((project) => !project.is_draft);
  return nonDraftProject || projects[0];
}

export async function findProjectForCalendlySync(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, user_id, status, is_draft, updated_at, created_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to load projects: ${error.message}`);

  return (
    pickProjectForCalendlySync((data as ProjectRow[] | null) || [])?.id || null
  );
}

export async function syncCalendlySelectionToProject(params: {
  supabase: SupabaseClient;
  userId: string;
  eventUrl?: string;
}): Promise<string | null> {
  const { supabase, userId, eventUrl } = params;
  const normalizedUrl = eventUrl?.trim();
  if (!normalizedUrl) return null;

  const projectId = await findProjectForCalendlySync(supabase, userId);
  if (!projectId) return null;

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    throw new Error(
      `Failed to load project for Calendly sync: ${
        projectError?.message || 'Missing project'
      }`
    );
  }

  const { error } = await supabase
    .from('projects')
    .update(
      buildProjectIntegrationUpdate(project as Record<string, unknown>, {
        calendly: {
          url: normalizedUrl,
          apiKeySecretId: readProjectIntegrationSnapshot(
            project as Record<string, unknown>
          ).calendly.apiKeySecretId,
        },
      })
    )
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error)
    throw new Error(`Failed to sync Calendly project config: ${error.message}`);

  return projectId;
}

export async function readCalendlyAccessTokenForProject(params: {
  supabase: SupabaseClient;
  projectId: string;
  userId: string;
}): Promise<string | null> {
  const { supabase, projectId, userId } = params;

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError)
    throw new Error(`Failed to load project: ${projectError.message}`);
  if (!project) return null;

  const projectRow = project as ProjectRow;
  if (projectRow.user_id !== userId) {
    throw new Error('Forbidden');
  }

  const snapshot = readProjectIntegrationSnapshot(
    project as Record<string, unknown>
  );

  if (snapshot.calendly.apiKeySecretId) {
    return readSecret(supabase, snapshot.calendly.apiKeySecretId);
  }

  const { data: integration, error: integrationError } = await supabase
    .from('user_integrations')
    .select('config')
    .eq('user_id', userId)
    .eq('integration_id', 'calendly')
    .single();

  if (integrationError) {
    const code = (integrationError as { code?: string }).code;
    if (code === 'PGRST116') return null;
    throw new Error(
      `Failed to load Calendly integration: ${integrationError.message}`
    );
  }

  const config = integration?.config as CalendlyIntegrationConfig | null;
  if (!config?.access_token_secret_id) return null;

  return readUserSecret(supabase, config.access_token_secret_id);
}
