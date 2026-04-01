/**
 * POST /api/integrations/store-secret
 *
 * Stores or deletes project-scoped integration secrets in Supabase Vault.
 * Secrets are never returned to the client after storage.
 */

import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { getAuth } from '@clerk/remix/ssr.server';
import { hasServerTeamAccess } from '~/lib/auth/serverTeamAccess';
import {
  createProjectSecretsClient,
  deleteProjectSecret,
  getProjectSecretDefinition,
  storeProjectSecret,
  type ProjectSecretAction,
} from '~/lib/integrations/projectSecrets.server';

interface StoreSecretRequest {
  /** Supabase project UUID */
  projectId: string;

  /** Integration provider (e.g. "calendly", "google_analytics") */
  provider: string;

  /** Name/key under which the secret is stored in Vault */
  secretName: string;

  /** The actual secret value to encrypt and store */
  secretValue?: string;

  /** Action to perform */
  action?: ProjectSecretAction;
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const auth = await getAuth(args);

  if (!auth.userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasServerTeamAccess(auth.sessionClaims)) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: StoreSecretRequest;

  try {
    body = (await request.json()) as StoreSecretRequest;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { projectId, provider, secretName, secretValue, action = 'store' } = body;

  if (!projectId || !provider || !secretName) {
    return json({ error: 'Missing required fields: projectId, provider, secretName' }, { status: 400 });
  }

  const definition = getProjectSecretDefinition(provider, secretName);

  if (!definition) {
    return json({ error: 'Unsupported integration secret' }, { status: 400 });
  }

  if (action === 'store' && !secretValue) {
    return json({ error: 'secretValue is required when action is store' }, { status: 400 });
  }

  let supabase;

  try {
    supabase = createProjectSecretsClient();
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Supabase Vault is not configured' },
      { status: 500 },
    );
  }

  try {
    if (action === 'delete') {
      const result = await deleteProjectSecret({
        supabase,
        projectId,
        provider: provider as 'calendly' | 'analytics',
        secretName: secretName as 'apiKey' | 'refreshToken',
      });

      return json({
        success: true,
        action,
        provider,
        secretName,
        projectId,
        deleted: result.deleted,
      });
    }

    const result = await storeProjectSecret({
      supabase,
      projectId,
      provider: provider as 'calendly' | 'analytics',
      secretName: secretName as 'apiKey' | 'refreshToken',
      secretValue: secretValue!,
    });

    return json({
      success: true,
      action,
      provider,
      secretName,
      projectId,
      secretId: result.secretId,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Secret management failed' }, { status: 500 });
  }
}
