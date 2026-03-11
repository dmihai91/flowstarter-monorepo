/**
 * GET /api/analytics/connect?projectId=xxx
 *   → Redirects to Google OAuth consent
 *
 * POST /api/analytics/connect (callback handler)
 *   → Exchanges code for tokens, stores refresh_token in Supabase
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = 'https://www.googleapis.com/auth/analytics.readonly';

export async function GET(request: NextRequest) {
  await requireAuth();
  const projectId = request.nextUrl.searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://flowstarter.dev'}/api/analytics/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: projectId,
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params}`);
}
