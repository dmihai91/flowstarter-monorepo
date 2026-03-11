/**
 * GET /api/analytics/callback?code=xxx&state=projectId
 * OAuth callback — exchanges code, stores refresh token in Vault (encrypted).
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { storeSecret } from '@/lib/vault';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export async function GET(request: NextRequest) {
  await requireAuth();
  const code = request.nextUrl.searchParams.get('code');
  const projectId = request.nextUrl.searchParams.get('state');

  if (!code || !projectId) {
    return NextResponse.redirect(new URL('/team/dashboard?error=analytics_connect_failed', request.url));
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://flowstarter.dev'}/api/analytics/callback`;

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/team/dashboard?error=analytics_token_failed', request.url));
  }

  const tokens = (await tokenRes.json()) as { refresh_token?: string; access_token: string };

  if (!tokens.refresh_token) {
    return NextResponse.redirect(new URL('/team/dashboard?error=no_refresh_token', request.url));
  }

  // Store refresh token encrypted in Vault
  const supabase = createSupabaseServiceRoleClient();
  const secretId = await storeSecret(
    supabase, projectId, 'ga_refresh_token', tokens.refresh_token,
    'Google Analytics refresh token',
  );

  // Store vault reference (not the token itself)
  await supabase
    .from('projects')
    .update({
      ga_refresh_token_id: secretId,
      ga_connected_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  return NextResponse.redirect(
    new URL(`/team/dashboard/analytics?projectId=${projectId}&connected=true`, request.url),
  );
}
