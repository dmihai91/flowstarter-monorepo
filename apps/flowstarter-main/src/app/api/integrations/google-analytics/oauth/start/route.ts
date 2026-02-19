import { createOAuthState } from '@/lib/oauth-state';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

function getBaseUrl(req: Request) {
  try {
    const url = new URL(req.url);
    return `${url.protocol}//${url.host}`;
  } catch {
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }
}

export async function POST(req: Request) {
  // Verify user is authenticated before starting OAuth flow
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const base = getBaseUrl(req);
  const clientId =
    process.env.GOOGLE_OAUTH_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
  const redirectUri = `${base}/api/integrations/google-analytics/oauth/callback`;

  // Generate secure state parameter for CSRF protection
  const state = await createOAuthState('google-analytics');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: `https://www.googleapis.com/auth/analytics.readonly 
      https://www.googleapis.com/auth/analytics.edit`,
    access_type: 'offline',
    include_granted_scopes: 'true',
    state,
    prompt: 'consent',
  });
  const authorizeUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.json({ authorizeUrl });
}
