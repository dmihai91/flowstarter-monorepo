/**
 * Vault helpers for user-level integration secrets.
 * OAuth tokens and API keys are encrypted at rest via pgsodium / Supabase Vault.
 *
 * Secret UUIDs are stored as references inside user_integrations.config — the
 * plaintext is never persisted in the database.
 *
 * RPCs (defined in migration 20260329000000_user_integration_vault.sql):
 *   store_user_secret(p_user_id, p_integration_id, p_key_name, p_value) → UUID
 *   read_user_secret(p_secret_id)                                        → TEXT
 *   delete_user_secret(p_secret_id)                                      → VOID
 */
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Encrypt and store an integration secret.
 * Returns the vault UUID to save as a reference in config.
 */
export async function storeUserSecret(
  supabase: SupabaseClient,
  userId: string,
  integrationId: string,
  keyName: string,
  value: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('store_user_secret', {
    p_user_id: userId,
    p_integration_id: integrationId,
    p_key_name: keyName,
    p_value: value,
  });

  if (error) throw new Error(`Vault store failed [${integrationId}/${keyName}]: ${error.message}`);
  return data as string;
}

/**
 * Decrypt and retrieve an integration secret by its vault UUID.
 * Returns null if the secret does not exist.
 */
export async function readUserSecret(
  supabase: SupabaseClient,
  secretId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc('read_user_secret', {
    p_secret_id: secretId,
  });

  if (error) throw new Error(`Vault read failed: ${error.message}`);
  return data as string | null;
}

/**
 * Permanently delete a secret from vault.
 */
export async function deleteUserSecret(
  supabase: SupabaseClient,
  secretId: string,
): Promise<void> {
  const { error } = await supabase.rpc('delete_user_secret', {
    p_secret_id: secretId,
  });

  if (error) throw new Error(`Vault delete failed: ${error.message}`);
}
