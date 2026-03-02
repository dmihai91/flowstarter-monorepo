import 'server-only';
/**
 * Google OAuth Helper
 * Handles token refresh and token validation for Google OAuth integrations
 */

import { useServerSupabase } from '@/hooks/useServerSupabase';

interface GoogleTokenRefreshResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface StoredGoogleCredentials {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  scope: string;
  expires_at: string;
}

/**
 * Refresh an expired Google OAuth token
 */
export async function refreshGoogleToken(
  refreshToken: string
): Promise<GoogleTokenRefreshResponse | null> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing Google OAuth credentials');
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token refresh failed:', errorData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Get valid Google OAuth credentials for a user
 * Automatically refreshes if expired
 */
export async function getValidGoogleCredentials(
  userId: string,
  integrationId: string = 'google-analytics'
): Promise<string | null> {
  const supabase = useServerSupabase();

  // Fetch stored credentials
  const { data, error } = await supabase
    .from('user_integrations')
    .select('config')
    .eq('user_id', userId)
    .eq('integration_id', integrationId)
    .single();

  if (error || !data) {
    console.error('Failed to fetch user integration:', error);
    return null;
  }

  const config = data.config as StoredGoogleCredentials;
  const expiresAt = new Date(config.expires_at);
  const now = new Date();

  // Token is still valid
  if (expiresAt > now) {
    return config.access_token;
  }

  // Token expired, try to refresh
  if (!config.refresh_token) {
    console.error('No refresh token available');
    return null;
  }

  const refreshedTokens = await refreshGoogleToken(config.refresh_token);
  if (!refreshedTokens) {
    return null;
  }

  // Update stored credentials with new token
  const newExpiresAt = new Date(
    Date.now() + refreshedTokens.expires_in * 1000
  ).toISOString();

  const { error: updateError } = await supabase
    .from('user_integrations')
    .update({
      config: {
        ...config,
        access_token: refreshedTokens.access_token,
        expires_at: newExpiresAt,
        token_type: refreshedTokens.token_type,
        scope: refreshedTokens.scope,
      },
    })
    .eq('user_id', userId)
    .eq('integration_id', integrationId);

  if (updateError) {
    console.error('Failed to update refreshed token:', updateError);
    return null;
  }

  return refreshedTokens.access_token;
}

/**
 * Check if user has Google Analytics integration configured
 */
export async function hasGoogleAnalyticsIntegration(
  userId: string
): Promise<boolean> {
  const supabase = useServerSupabase();

  const { data, error } = await supabase
    .from('user_integrations')
    .select('id')
    .eq('user_id', userId)
    .eq('integration_id', 'google-analytics')
    .single();

  return !error && !!data;
}
