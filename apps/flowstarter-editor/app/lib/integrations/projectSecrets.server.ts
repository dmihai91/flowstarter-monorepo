import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { buildProjectIntegrationUpdate, readProjectIntegrationConfig } from './projectIntegrations';

export type SupportedProjectSecretProvider = 'calendly' | 'analytics';
export type SupportedProjectSecretName = 'apiKey' | 'refreshToken';
export type ProjectSecretAction = 'store' | 'delete';

interface ProjectSecretDefinition {
  column: 'calendly_api_key_id' | 'ga_refresh_token_id';
  vaultName: string;
  description: string;
  clearFields?: string[];
}

const PROJECT_SECRET_DEFINITIONS: Record<string, ProjectSecretDefinition> = {
  'calendly:apiKey': {
    column: 'calendly_api_key_id',
    vaultName: 'calendly_api_key',
    description: 'Calendly Personal Access Token',
  },
  'analytics:refreshToken': {
    column: 'ga_refresh_token_id',
    vaultName: 'ga_refresh_token',
    description: 'Google Analytics refresh token',
    clearFields: ['ga_connected_at'],
  },
};

type SupabaseProjectSecretClient = Pick<SupabaseClient, 'rpc' | 'from'>;

export function getProjectSecretDefinition(provider: string, secretName: string): ProjectSecretDefinition | null {
  return PROJECT_SECRET_DEFINITIONS[`${provider}:${secretName}`] ?? null;
}

export function createProjectSecretsClient(): SupabaseProjectSecretClient {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase Vault is not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function storeProjectSecret(params: {
  supabase: SupabaseProjectSecretClient;
  projectId: string;
  provider: SupportedProjectSecretProvider;
  secretName: SupportedProjectSecretName;
  secretValue: string;
}): Promise<{ secretId: string; column: string }> {
  const definition = getProjectSecretDefinition(params.provider, params.secretName);

  if (!definition) {
    throw new Error('Unsupported integration secret');
  }

  const { data, error } = await params.supabase.rpc('store_project_secret', {
    p_project_id: params.projectId,
    p_name: definition.vaultName,
    p_value: params.secretValue,
    p_description: definition.description,
  });

  if (error || !data) {
    throw new Error(`Vault store failed: ${error?.message || 'Unknown error'}`);
  }

  const { data: project, error: projectError } = await params.supabase
    .from('projects')
    .select('*')
    .eq('id', params.projectId)
    .single();

  if (projectError || !project) {
    throw new Error(`Project lookup failed: ${projectError?.message || 'Unknown error'}`);
  }

  const { error: updateError } = await params.supabase
    .from('projects')
    .update(
      buildProjectIntegrationUpdate(project, {
        calendly: params.provider === 'calendly' ? { apiKeySecretId: data as string } : undefined,
        analytics:
          params.provider === 'analytics'
            ? {
                refreshTokenSecretId: data as string,
                connectedAt: new Date().toISOString(),
              }
            : undefined,
      }),
    )
    .eq('id', params.projectId);

  if (updateError) {
    throw new Error(`Project secret reference update failed: ${updateError.message}`);
  }

  return { secretId: data as string, column: definition.column };
}

export async function deleteProjectSecret(params: {
  supabase: SupabaseProjectSecretClient;
  projectId: string;
  provider: SupportedProjectSecretProvider;
  secretName: SupportedProjectSecretName;
}): Promise<{ deleted: boolean; column: string }> {
  const definition = getProjectSecretDefinition(params.provider, params.secretName);

  if (!definition) {
    throw new Error('Unsupported integration secret');
  }

  const { data: project, error: projectError } = await params.supabase
    .from('projects')
    .select('*')
    .eq('id', params.projectId)
    .single();

  if (projectError) {
    throw new Error(`Project lookup failed: ${projectError.message}`);
  }

  const config = readProjectIntegrationConfig(project);
  const secretId = params.provider === 'calendly' ? config.calendlyApiKeyId : config.gaRefreshTokenId;

  if (secretId) {
    const { error: deleteError } = await params.supabase.rpc('delete_project_secret', {
      p_secret_id: secretId,
    });

    if (deleteError) {
      throw new Error(`Vault delete failed: ${deleteError.message}`);
    }
  }

  const { error: updateError } = await params.supabase
    .from('projects')
    .update(
      buildProjectIntegrationUpdate(project, {
        calendly: params.provider === 'calendly' ? { apiKeySecretId: null } : undefined,
        analytics: params.provider === 'analytics' ? { refreshTokenSecretId: null, connectedAt: null } : undefined,
      }),
    )
    .eq('id', params.projectId);

  if (updateError) {
    throw new Error(`Project secret reference cleanup failed: ${updateError.message}`);
  }

  return { deleted: !!secretId, column: definition.column };
}
