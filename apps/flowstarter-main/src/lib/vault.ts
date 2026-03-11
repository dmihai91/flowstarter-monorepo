/**
 * Supabase Vault helpers for encrypted secret storage.
 * All secrets are encrypted at rest via pgsodium.
 * 
 * Usage:
 *   const secretId = await storeSecret(supabase, projectId, 'ga_refresh_token', token);
 *   const token = await readSecret(supabase, secretId);
 *   await deleteSecret(supabase, secretId);
 */
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Store a secret in Vault, returns its UUID */
export async function storeSecret(
  supabase: SupabaseClient,
  projectId: string,
  name: string,
  value: string,
  description?: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('store_project_secret', {
    p_project_id: projectId,
    p_name: name,
    p_value: value,
    p_description: description || undefined,
  });

  if (error) throw new Error(`Vault store failed: ${error.message}`);
  return data as string;
}

/** Read a decrypted secret from Vault by its UUID */
export async function readSecret(
  supabase: SupabaseClient,
  secretId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc('read_project_secret', {
    p_secret_id: secretId,
  });

  if (error) throw new Error(`Vault read failed: ${error.message}`);
  return data as string | null;
}

/** Delete a secret from Vault */
export async function deleteSecret(
  supabase: SupabaseClient,
  secretId: string,
): Promise<void> {
  const { error } = await supabase.rpc('delete_project_secret', {
    p_secret_id: secretId,
  });

  if (error) throw new Error(`Vault delete failed: ${error.message}`);
}
