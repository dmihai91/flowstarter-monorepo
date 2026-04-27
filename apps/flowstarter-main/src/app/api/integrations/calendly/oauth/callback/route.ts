import { useServerSupabaseWithAuth } from '@/hooks/useServerSupabase';
import { storeUserSecret } from '@/lib/user-integration-vault';
import { validateOAuthState } from '@/lib/oauth-state';
import { logSecurityEvent, oauthAuditContext } from '@/lib/security-audit';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

interface CalendlyTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  created_at: number;
  scope: string;
  organization: string;
  owner: string;
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(
        new URL('/sign-in?redirect=/dashboard/help', req.url)
      );
    }

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const state = url.searchParams.get('state');

    // Validate OAuth state to prevent CSRF attacks
    const stateValidation = await validateOAuthState('calendly', state);
    if (!stateValidation.valid) {
      await logSecurityEvent(
        'oauth.state_mismatch',
        userId,
        oauthAuditContext('calendly', false, 'STATE_INVALID')
      );
      return NextResponse.redirect(
        new URL(
          `/dashboard/help?provider=calendly&status=error&message=${encodeURIComponent(
            stateValidation.error || 'Invalid OAuth state'
          )}`,
          req.url
        )
      );
    }

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/help?provider=calendly&status=error&message=${encodeURIComponent(
            error
          )}`,
          req.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          '/dashboard/help?provider=calendly&status=error&message=No+authorization+code',
          req.url
        )
      );
    }

    const clientId = process.env.CALENDLY_CLIENT_ID;
    const clientSecret = process.env.CALENDLY_CLIENT_SECRET;
    const redirectUri = `${url.protocol}//${url.host}/api/integrations/calendly/oauth/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL(
          '/dashboard/help?provider=calendly&status=error&message=Server+configuration+error',
          req.url
        )
      );
    }

    // Exchange authorization code for tokens
    // Calendly uses HTTP Basic Auth with client_id:client_secret
    const tokenResponse = await fetch('https://auth.calendly.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Calendly token exchange failed:', errorData);
      await logSecurityEvent(
        'oauth.flow_failed',
        userId,
        oauthAuditContext('calendly', false, 'TOKEN_EXCHANGE_FAILED')
      );
      return NextResponse.redirect(
        new URL(
          '/dashboard/help?provider=calendly&status=error&message=Token+exchange+failed',
          req.url
        )
      );
    }

    const tokens: CalendlyTokenResponse = await tokenResponse.json();

    const supabase = await useServerSupabaseWithAuth();

    // ── Store secrets in Vault (encrypted at rest) ──────────────────────────
    let accessTokenSecretId: string;
    let refreshTokenSecretId: string;
    try {
      [accessTokenSecretId, refreshTokenSecretId] = await Promise.all([
        storeUserSecret(
          supabase,
          userId,
          'calendly',
          'access_token',
          tokens.access_token
        ),
        storeUserSecret(
          supabase,
          userId,
          'calendly',
          'refresh_token',
          tokens.refresh_token
        ),
      ]);
    } catch (vaultErr) {
      console.error('Vault store failed (Calendly):', vaultErr);
      await logSecurityEvent(
        'oauth.flow_failed',
        userId,
        oauthAuditContext('calendly', false, 'VAULT_ERROR')
      );
      return NextResponse.redirect(
        new URL(
          '/dashboard/help?provider=calendly&status=error&message=Failed+to+encrypt+credentials',
          req.url
        )
      );
    }

    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    // ── Persist only non-sensitive metadata + vault UUID references ──────────
    const { error: dbError } = await supabase.from('user_integrations').upsert(
      {
        user_id: userId,
        integration_id: 'calendly',
        config: {
          // Vault UUID references — plaintext tokens are never stored here
          access_token_secret_id: accessTokenSecretId,
          refresh_token_secret_id: refreshTokenSecretId,
          // Non-sensitive metadata
          token_type: tokens.token_type,
          expires_at: expiresAt,
          organization: tokens.organization,
          owner: tokens.owner,
        },
      },
      { onConflict: 'user_id,integration_id' }
    );

    if (dbError) {
      await logSecurityEvent(
        'oauth.flow_failed',
        userId,
        oauthAuditContext('calendly', false, 'DB_ERROR')
      );
      return NextResponse.redirect(
        new URL(
          '/dashboard/help?provider=calendly&status=error&message=Failed+to+save+credentials',
          req.url
        )
      );
    }

    await logSecurityEvent(
      'oauth.flow_completed',
      userId,
      oauthAuditContext('calendly', true)
    );

    return NextResponse.redirect(
      new URL('/dashboard/help?provider=calendly&status=success', req.url)
    );
  } catch (error) {
    console.error('Calendly OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        '/dashboard/help?provider=calendly&status=error&message=Unknown+error',
        req.url
      )
    );
  }
}
