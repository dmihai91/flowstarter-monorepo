/**
 * POST /api/integrations/store-secret
 *
 * Stores a provider secret (API key, token, etc.) in Supabase Vault.
 * Supabase Vault uses pgsodium under the hood for envelope encryption.
 *
 * TODO: Wire up to a real Supabase client and call:
 *   const { data, error } = await supabase.rpc('vault.create_secret', {
 *     new_secret: secretValue,
 *     new_name:   secretName,
 *     // optional: new_description, new_key_id (pgsodium key)
 *   });
 *
 * Vault stores the encrypted value in vault.secrets and returns a UUID.
 * To retrieve later: SELECT * FROM vault.decrypted_secrets WHERE name = ?
 */

import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';

interface StoreSecretRequest {
  /** Integration provider (e.g. "calendly", "google_analytics") */
  provider: string;
  /** Name/key under which the secret is stored in Vault */
  secretName: string;
  /** The actual secret value to encrypt and store */
  secretValue: string;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  let body: StoreSecretRequest;
  try {
    body = (await request.json()) as StoreSecretRequest;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { provider, secretName, secretValue } = body;

  if (!provider || !secretName || !secretValue) {
    return json(
      { error: 'Missing required fields: provider, secretName, secretValue' },
      { status: 400 },
    );
  }

  // TODO: Authenticate the request (e.g. verify Clerk session / JWT)
  // TODO: Initialize Supabase admin client with service role key
  // TODO: Call vault.create_secret via supabase.rpc():
  //
  //   const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  //   const { data, error } = await supabase.rpc('vault.create_secret', {
  //     new_secret: secretValue,
  //     new_name:   `${provider}/${secretName}`,
  //   });
  //
  //   if (error) return json({ success: false, error: error.message }, { status: 500 });
  //   return json({ success: true, secretId: data });

  return json({
    success: true,
    message: 'Secret storage not yet implemented',
  });
}
