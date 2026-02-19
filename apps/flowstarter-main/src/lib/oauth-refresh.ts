/**
 * OAuth Token Refresh Utility
 *
 * Handles automatic token refresh for OAuth integrations.
 * Use this when making API calls to check if tokens need refresh.
 */

import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

type OAuthProvider = 'google-analytics' | 'calendly' | 'mailchimp';

interface ProviderConfig {
  tokenUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
}

const PROVIDER_CONFIGS: Record<OAuthProvider, ProviderConfig> = {
  'google-analytics': {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientIdEnv: 'GOOGLE_OAUTH_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_OAUTH_CLIENT_SECRET',
  },
  calendly: {
    tokenUrl: 'https://auth.calendly.com/oauth/token',
    clientIdEnv: 'CALENDLY_CLIENT_ID',
    clientSecretEnv: 'CALENDLY_CLIENT_SECRET',
  },
  mailchimp: {
    tokenUrl: 'https://login.mailchimp.com/oauth2/token',
    clientIdEnv: 'MAILCHIMP_CLIENT_ID',
    clientSecretEnv: 'MAILCHIMP_CLIENT_SECRET',
  },
};

interface RefreshResult {
  access_token: string;
  expires_at: string;
  refresh_token?: string; // Some providers rotate refresh tokens
}

/**
 * Refresh an OAuth access token using the refresh token
 */
export async function refreshOAuthToken(
  provider: OAuthProvider,
  refreshToken: string
): Promise<RefreshResult | null> {
  const config = PROVIDER_CONFIGS[provider];
  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];

  if (!clientId || !clientSecret) {
    console.error(`[OAuth Refresh] Missing credentials for ${provider}`);
    return null;
  }

  try {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OAuth Refresh] ${provider} refresh failed:`, errorText);
      return null;
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      refresh_token: data.refresh_token, // May be undefined if not rotated
    };
  } catch (error) {
    console.error(`[OAuth Refresh] ${provider} error:`, error);
    return null;
  }
}

/**
 * Check if a token is expired or about to expire (within 5 minutes)
 */
export function isTokenExpired(expiresAt: string | undefined): boolean {
  if (!expiresAt) return true;

  const expiryTime = new Date(expiresAt).getTime();
  const bufferMs = 5 * 60 * 1000; // 5 minutes buffer

  return Date.now() >= expiryTime - bufferMs;
}

/**
 * Get a valid access token for a user's integration, refreshing if needed
 *
 * This function handles the full flow:
 * 1. Fetches stored tokens from database
 * 2. Checks if access token is expired
 * 3. Refreshes if needed and updates database
 * 4. Returns valid access token
 */
export async function getValidAccessToken(
  userId: string,
  provider: OAuthProvider
): Promise<{ accessToken: string; config: Record<string, unknown> } | null> {
  // Use service role to bypass RLS for token refresh operations
  const supabase = createSupabaseServiceRoleClient();

  const { data: integration, error } = await supabase
    .from('user_integrations')
    .select('config')
    .eq('user_id', userId)
    .eq('integration_id', provider)
    .single();

  if (error || !integration?.config) {
    console.error(`[OAuth] No ${provider} integration found for user`);
    return null;
  }

  const config = integration.config as Record<string, unknown>;
  const accessToken = config.access_token as string | undefined;
  const refreshToken = config.refresh_token as string | undefined;
  const expiresAt = config.expires_at as string | undefined;

  if (!accessToken) {
    console.error(`[OAuth] No access token for ${provider}`);
    return null;
  }

  // Check if token needs refresh
  if (isTokenExpired(expiresAt) && refreshToken) {
    console.info(`[OAuth] Refreshing ${provider} token for user ${userId}`);

    const refreshed = await refreshOAuthToken(provider, refreshToken);

    if (!refreshed) {
      // Refresh failed - token may be revoked
      console.error(`[OAuth] Failed to refresh ${provider} token`);
      return null;
    }

    // Update stored tokens
    const updatedConfig = {
      ...config,
      access_token: refreshed.access_token,
      expires_at: refreshed.expires_at,
      // Update refresh token if rotated
      ...(refreshed.refresh_token && {
        refresh_token: refreshed.refresh_token,
      }),
    };

    const { error: updateError } = await supabase
      .from('user_integrations')
      .update({ config: updatedConfig })
      .eq('user_id', userId)
      .eq('integration_id', provider);

    if (updateError) {
      console.error(
        `[OAuth] Failed to update ${provider} tokens:`,
        updateError
      );
      // Still return the new token even if we couldn't persist it
    }

    return { accessToken: refreshed.access_token, config: updatedConfig };
  }

  return { accessToken, config };
}

/**
 * Revoke OAuth tokens and clear from database
 */
export async function revokeIntegration(
  userId: string,
  provider: OAuthProvider
): Promise<boolean> {
  const supabase = createSupabaseServiceRoleClient();

  // Get current tokens to revoke at provider
  const { data: integration } = await supabase
    .from('user_integrations')
    .select('config')
    .eq('user_id', userId)
    .eq('integration_id', provider)
    .single();

  if (integration?.config) {
    const config = integration.config as Record<string, unknown>;
    const accessToken = config.access_token as string;

    // Provider-specific revocation
    try {
      if (provider === 'google-analytics' && accessToken) {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
          { method: 'POST' }
        );
      }
      // Add other providers as needed
    } catch (error) {
      console.warn(`[OAuth] Token revocation failed for ${provider}:`, error);
      // Continue with local deletion even if revocation fails
    }
  }

  // Delete from database
  const { error } = await supabase
    .from('user_integrations')
    .delete()
    .eq('user_id', userId)
    .eq('integration_id', provider);

  if (error) {
    console.error(`[OAuth] Failed to delete ${provider} integration:`, error);
    return false;
  }

  return true;
}
