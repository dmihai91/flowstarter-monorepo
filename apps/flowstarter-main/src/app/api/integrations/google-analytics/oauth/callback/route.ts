import { useServerSupabaseWithAuth } from '@/hooks/useServerSupabase';
import { validateOAuthState } from '@/lib/oauth-state';
import { logSecurityEvent, oauthAuditContext } from '@/lib/security-audit';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(
        new URL('/sign-in?redirect=/dashboard/integrations', req.url)
      );
    }

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const state = url.searchParams.get('state');

    // Validate OAuth state to prevent CSRF attacks
    const stateValidation = await validateOAuthState('google-analytics', state);
    if (!stateValidation.valid) {
      await logSecurityEvent(
        'oauth.state_mismatch',
        userId,
        oauthAuditContext('google-analytics', false, 'STATE_INVALID')
      );
      return NextResponse.redirect(
        new URL(
          `/dashboard/integrations?provider=google-analytics&status=error&message=${encodeURIComponent(
            stateValidation.error || 'Invalid OAuth state'
          )}`,
          req.url
        )
      );
    }

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(
          `/dashboard/integrations?provider=google-analytics&status=error&message=${encodeURIComponent(
            error
          )}`,
          req.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          '/dashboard/integrations?provider=google-analytics&status=error&message=No+authorization+code',
          req.url
        )
      );
    }

    // Exchange authorization code for tokens
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const redirectUri = `${url.protocol}//${url.host}/api/integrations/google-analytics/oauth/callback`;

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth credentials');
      return NextResponse.redirect(
        new URL(
          '/dashboard/integrations?provider=google-analytics&status=error&message=Server+configuration+error',
          req.url
        )
      );
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL(
          '/dashboard/integrations?provider=google-analytics&status=error&message=Token+exchange+failed',
          req.url
        )
      );
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Store tokens in database (use authenticated client to respect RLS)
    const supabase = await useServerSupabaseWithAuth();
    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    const { error: dbError } = await supabase.from('user_integrations').upsert(
      {
        user_id: userId,
        integration_id: 'google-analytics',
        config: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_type: tokens.token_type,
          scope: tokens.scope,
          expires_at: expiresAt,
        },
      },
      {
        onConflict: 'user_id,integration_id',
      }
    );

    if (dbError) {
      await logSecurityEvent(
        'oauth.flow_failed',
        userId,
        oauthAuditContext('google-analytics', false, 'DB_ERROR')
      );
      return NextResponse.redirect(
        new URL(
          '/dashboard/integrations?provider=google-analytics&status=error&message=Failed+to+save+credentials',
          req.url
        )
      );
    }

    // Success! Log and redirect
    await logSecurityEvent(
      'oauth.flow_completed',
      userId,
      oauthAuditContext('google-analytics', true)
    );

    return NextResponse.redirect(
      new URL(
        '/dashboard/integrations?provider=google-analytics&status=success',
        req.url
      )
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        '/dashboard/integrations?provider=google-analytics&status=error&message=Unknown+error',
        req.url
      )
    );
  }
}
