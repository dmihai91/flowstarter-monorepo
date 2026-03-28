import { useServerSupabaseWithAuth } from '@/hooks/useServerSupabase';
import { storeUserSecret } from '@/lib/user-integration-vault';
import { validateOAuthState } from '@/lib/oauth-state';
import { logSecurityEvent, oauthAuditContext } from '@/lib/security-audit';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

interface MailchimpTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface MailchimpMetadata {
  dc: string;
  role: string;
  accountname: string;
  user_id: string;
  login: { email: string; avatar: string | null };
  login_url: string;
  api_endpoint: string;
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
    const stateValidation = await validateOAuthState('mailchimp', state);
    if (!stateValidation.valid) {
      await logSecurityEvent(
        'oauth.state_mismatch',
        userId,
        oauthAuditContext('mailchimp', false, 'STATE_INVALID')
      );
      return NextResponse.redirect(
        new URL(
          `/dashboard/integrations?provider=mailchimp&status=error&message=${encodeURIComponent(
            stateValidation.error || 'Invalid OAuth state'
          )}`,
          req.url
        )
      );
    }

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/integrations?provider=mailchimp&status=error&message=${encodeURIComponent(error)}`,
          req.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          '/dashboard/integrations?provider=mailchimp&status=error&message=No+authorization+code',
          req.url
        )
      );
    }

    const clientId = process.env.MAILCHIMP_CLIENT_ID;
    const clientSecret = process.env.MAILCHIMP_CLIENT_SECRET;
    const redirectUri = `${url.protocol}//${url.host}/api/integrations/mailchimp/oauth/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL(
          '/dashboard/integrations?provider=mailchimp&status=error&message=Server+configuration+error',
          req.url
        )
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      'https://login.mailchimp.com/oauth2/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Mailchimp token exchange failed:', errorData);
      await logSecurityEvent(
        'oauth.flow_failed',
        userId,
        oauthAuditContext('mailchimp', false, 'TOKEN_EXCHANGE_FAILED')
      );
      return NextResponse.redirect(
        new URL(
          '/dashboard/integrations?provider=mailchimp&status=error&message=Token+exchange+failed',
          req.url
        )
      );
    }

    const tokens: MailchimpTokenResponse = await tokenResponse.json();

    // Fetch datacenter and account info from metadata endpoint
    // This is required to construct the correct API endpoint for subsequent calls
    let dc = 'us1';
    let accountName = '';
    let apiEndpoint = 'https://us1.api.mailchimp.com/3.0';

    try {
      const metaRes = await fetch(
        'https://login.mailchimp.com/oauth2/metadata',
        {
          headers: { Authorization: `OAuth ${tokens.access_token}` },
        }
      );
      if (metaRes.ok) {
        const meta: MailchimpMetadata = await metaRes.json();
        dc = meta.dc;
        accountName = meta.accountname;
        apiEndpoint = meta.api_endpoint;
      }
    } catch (metaErr) {
      console.error('Failed to fetch Mailchimp metadata:', metaErr);
      // Non-fatal: continue with default us1 datacenter
    }

    const supabase = await useServerSupabaseWithAuth();

    // ── Store access token in Vault (encrypted at rest) ─────────────────────
    let accessTokenSecretId: string;
    try {
      accessTokenSecretId = await storeUserSecret(
        supabase, userId, 'mailchimp', 'access_token', tokens.access_token
      );
    } catch (vaultErr) {
      console.error('Vault store failed (Mailchimp):', vaultErr);
      await logSecurityEvent(
        'oauth.flow_failed',
        userId,
        oauthAuditContext('mailchimp', false, 'VAULT_ERROR')
      );
      return NextResponse.redirect(
        new URL(
          '/dashboard/integrations?provider=mailchimp&status=error&message=Failed+to+encrypt+credentials',
          req.url
        )
      );
    }

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    // ── Persist only non-sensitive metadata + vault UUID reference ───────────
    const { error: dbError } = await supabase.from('user_integrations').upsert(
      {
        user_id: userId,
        integration_id: 'mailchimp',
        config: {
          // Vault UUID reference — plaintext token is never stored here
          access_token_secret_id: accessTokenSecretId,
          // Non-sensitive metadata
          token_type: tokens.token_type,
          expires_at: expiresAt,
          dc,
          account_name: accountName,
          api_endpoint: apiEndpoint,
        },
      },
      { onConflict: 'user_id,integration_id' }
    );

    if (dbError) {
      await logSecurityEvent(
        'oauth.flow_failed',
        userId,
        oauthAuditContext('mailchimp', false, 'DB_ERROR')
      );
      return NextResponse.redirect(
        new URL(
          '/dashboard/integrations?provider=mailchimp&status=error&message=Failed+to+save+credentials',
          req.url
        )
      );
    }

    await logSecurityEvent(
      'oauth.flow_completed',
      userId,
      oauthAuditContext('mailchimp', true)
    );

    return NextResponse.redirect(
      new URL(
        '/dashboard/integrations?provider=mailchimp&status=success',
        req.url
      )
    );
  } catch (error) {
    console.error('Mailchimp OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        '/dashboard/integrations?provider=mailchimp&status=error&message=Unknown+error',
        req.url
      )
    );
  }
}
