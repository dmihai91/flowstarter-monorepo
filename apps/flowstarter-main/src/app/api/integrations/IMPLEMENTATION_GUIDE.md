# OAuth Integrations Implementation Guide

This guide covers the secure implementation of OAuth integrations for Flowstarter.

## Security Foundation

All integrations MUST use the OAuth state utilities in `src/lib/oauth-state.ts`:

```typescript
import { createOAuthState, validateOAuthState } from '@/lib/oauth-state';

// In /oauth/start - Generate state
const state = await createOAuthState('provider-name');

// In /oauth/callback - Validate state
const { valid, error } = await validateOAuthState('provider-name', stateParam);
```

---

## 1. Google Analytics (Reference Implementation)

**Status:** ✅ Implemented with security best practices

### OAuth Configuration

| Setting       | Value                                  |
| ------------- | -------------------------------------- |
| Provider      | Google Cloud Console                   |
| Scopes        | `analytics.readonly`, `analytics.edit` |
| Grant Type    | Authorization Code                     |
| Token Storage | Supabase `user_integrations` table     |

### Environment Variables

```env
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
```

### Files

- `oauth/start/route.ts` - Initiates OAuth flow with state
- `oauth/callback/route.ts` - Handles callback, validates state, exchanges code
- `properties/route.ts` - Lists GA4 properties
- `resources/route.ts` - Fetches analytics data
- `finalize/route.ts` - Completes integration setup

---

## 2. Calendly

**Status:** 🚧 Stub implementation - needs completion

### OAuth Configuration

| Setting    | Value                                                        |
| ---------- | ------------------------------------------------------------ |
| Provider   | [Calendly Developer Portal](https://developer.calendly.com/) |
| Auth URL   | `https://auth.calendly.com/oauth/authorize`                  |
| Token URL  | `https://auth.calendly.com/oauth/token`                      |
| Scopes     | `default` (or specific scopes as needed)                     |
| Grant Type | Authorization Code                                           |

### Environment Variables Needed

```env
CALENDLY_CLIENT_ID=your-client-id
CALENDLY_CLIENT_SECRET=your-client-secret
```

### Implementation Steps

#### Step 1: Update `oauth/start/route.ts`

```typescript
import { createOAuthState } from '@/lib/oauth-state';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const base = `${url.protocol}//${url.host}`;
  const clientId = process.env.CALENDLY_CLIENT_ID;
  const redirectUri = `${base}/api/integrations/calendly/oauth/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Calendly not configured' },
      { status: 500 }
    );
  }

  const state = await createOAuthState('calendly');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  });

  const authorizeUrl = `https://auth.calendly.com/oauth/authorize?${params}`;
  return NextResponse.json({ authorizeUrl });
}
```

#### Step 2: Update `oauth/callback/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { useServerSupabaseWithAuth } from '@/hooks/useServerSupabase';
import { validateOAuthState } from '@/lib/oauth-state';
import { NextResponse } from 'next/server';

interface CalendlyTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  created_at: number;
  owner: string;
  organization: string;
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
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Validate state (CSRF protection)
    const stateValidation = await validateOAuthState('calendly', state);
    if (!stateValidation.valid) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/integrations?provider=calendly&status=error&message=${encodeURIComponent(
            stateValidation.error || 'Invalid state'
          )}`,
          req.url
        )
      );
    }

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/integrations?provider=calendly&status=error&message=${encodeURIComponent(
            error
          )}`,
          req.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          '/dashboard/integrations?provider=calendly&status=error&message=No+code',
          req.url
        )
      );
    }

    // Exchange code for tokens
    const clientId = process.env.CALENDLY_CLIENT_ID;
    const clientSecret = process.env.CALENDLY_CLIENT_SECRET;
    const redirectUri = `${url.protocol}//${url.host}/api/integrations/calendly/oauth/callback`;

    const tokenResponse = await fetch('https://auth.calendly.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Calendly token exchange failed:', errorText);
      return NextResponse.redirect(
        new URL(
          '/dashboard/integrations?provider=calendly&status=error&message=Token+exchange+failed',
          req.url
        )
      );
    }

    const tokens: CalendlyTokenResponse = await tokenResponse.json();

    // Store in database
    const supabase = await useServerSupabaseWithAuth();
    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    await supabase.from('user_integrations').upsert(
      {
        user_id: userId,
        integration_id: 'calendly',
        config: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          owner_uri: tokens.owner,
          organization_uri: tokens.organization,
        },
      },
      { onConflict: 'user_id,integration_id' }
    );

    return NextResponse.redirect(
      new URL(
        '/dashboard/integrations?provider=calendly&status=success',
        req.url
      )
    );
  } catch (error) {
    console.error('Calendly OAuth error:', error);
    return NextResponse.redirect(
      new URL(
        '/dashboard/integrations?provider=calendly&status=error&message=Unknown+error',
        req.url
      )
    );
  }
}
```

#### Step 3: Implement `resources/route.ts`

```typescript
// Fetch user's event types, scheduled events, etc.
// API Docs: https://developer.calendly.com/api-docs

import { auth } from '@clerk/nextjs/server';
import { useServerSupabaseWithAuth } from '@/hooks/useServerSupabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await useServerSupabaseWithAuth();
  const { data: integration } = await supabase
    .from('user_integrations')
    .select('config')
    .eq('user_id', userId)
    .eq('integration_id', 'calendly')
    .single();

  if (!integration?.config?.access_token) {
    return NextResponse.json({ error: 'Not connected' }, { status: 404 });
  }

  // Fetch event types
  const response = await fetch('https://api.calendly.com/event_types', {
    headers: {
      Authorization: `Bearer ${integration.config.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    // Token might be expired - implement refresh logic
    return NextResponse.json({ error: 'API request failed' }, { status: 500 });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
```

### Calendly API Features to Implement

- [ ] List event types (for embedding scheduling links)
- [ ] Get scheduled events
- [ ] Webhook for new bookings
- [ ] User availability

---

## 3. Mailchimp

**Status:** 🚧 Stub implementation - needs completion

### OAuth Configuration

| Setting      | Value                                                          |
| ------------ | -------------------------------------------------------------- |
| Provider     | [Mailchimp Developer Portal](https://mailchimp.com/developer/) |
| Auth URL     | `https://login.mailchimp.com/oauth2/authorize`                 |
| Token URL    | `https://login.mailchimp.com/oauth2/token`                     |
| Metadata URL | `https://login.mailchimp.com/oauth2/metadata`                  |
| Grant Type   | Authorization Code                                             |

### Environment Variables Needed

```env
MAILCHIMP_CLIENT_ID=your-client-id
MAILCHIMP_CLIENT_SECRET=your-client-secret
```

### Implementation Steps

#### Step 1: Update `oauth/start/route.ts`

```typescript
import { createOAuthState } from '@/lib/oauth-state';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const base = `${url.protocol}//${url.host}`;
  const clientId = process.env.MAILCHIMP_CLIENT_ID;
  const redirectUri = `${base}/api/integrations/mailchimp/oauth/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Mailchimp not configured' },
      { status: 500 }
    );
  }

  const state = await createOAuthState('mailchimp');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  });

  const authorizeUrl = `https://login.mailchimp.com/oauth2/authorize?${params}`;
  return NextResponse.json({ authorizeUrl });
}
```

#### Step 2: Update `oauth/callback/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { useServerSupabaseWithAuth } from '@/hooks/useServerSupabase';
import { validateOAuthState } from '@/lib/oauth-state';
import { NextResponse } from 'next/server';

interface MailchimpTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
}

interface MailchimpMetadata {
  dc: string; // Data center (e.g., "us1")
  api_endpoint: string;
  login_url: string;
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
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Validate state
    const stateValidation = await validateOAuthState('mailchimp', state);
    if (!stateValidation.valid) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/integrations?provider=mailchimp&status=error&message=${encodeURIComponent(
            stateValidation.error || 'Invalid state'
          )}`,
          req.url
        )
      );
    }

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/integrations?provider=mailchimp&status=error&message=${encodeURIComponent(
            error
          )}`,
          req.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          '/dashboard/integrations?provider=mailchimp&status=error&message=No+code',
          req.url
        )
      );
    }

    const clientId = process.env.MAILCHIMP_CLIENT_ID;
    const clientSecret = process.env.MAILCHIMP_CLIENT_SECRET;
    const redirectUri = `${url.protocol}//${url.host}/api/integrations/mailchimp/oauth/callback`;

    // Exchange code for token
    const tokenResponse = await fetch(
      'https://login.mailchimp.com/oauth2/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId!,
          client_secret: clientSecret!,
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

    if (!tokenResponse.ok) {
      console.error('Mailchimp token exchange failed');
      return NextResponse.redirect(
        new URL(
          '/dashboard/integrations?provider=mailchimp&status=error&message=Token+exchange+failed',
          req.url
        )
      );
    }

    const tokens: MailchimpTokenResponse = await tokenResponse.json();

    // IMPORTANT: Get metadata to find the API endpoint (data center specific)
    const metadataResponse = await fetch(
      'https://login.mailchimp.com/oauth2/metadata',
      {
        headers: { Authorization: `OAuth ${tokens.access_token}` },
      }
    );

    if (!metadataResponse.ok) {
      console.error('Failed to get Mailchimp metadata');
      return NextResponse.redirect(
        new URL(
          '/dashboard/integrations?provider=mailchimp&status=error&message=Metadata+fetch+failed',
          req.url
        )
      );
    }

    const metadata: MailchimpMetadata = await metadataResponse.json();

    // Store in database
    const supabase = await useServerSupabaseWithAuth();
    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    await supabase.from('user_integrations').upsert(
      {
        user_id: userId,
        integration_id: 'mailchimp',
        config: {
          access_token: tokens.access_token,
          expires_at: expiresAt,
          dc: metadata.dc,
          api_endpoint: metadata.api_endpoint,
        },
      },
      { onConflict: 'user_id,integration_id' }
    );

    return NextResponse.redirect(
      new URL(
        '/dashboard/integrations?provider=mailchimp&status=success',
        req.url
      )
    );
  } catch (error) {
    console.error('Mailchimp OAuth error:', error);
    return NextResponse.redirect(
      new URL(
        '/dashboard/integrations?provider=mailchimp&status=error&message=Unknown+error',
        req.url
      )
    );
  }
}
```

#### Step 3: Implement `resources/route.ts`

```typescript
// Fetch lists, campaigns, etc.
// API Docs: https://mailchimp.com/developer/marketing/api/

import { auth } from '@clerk/nextjs/server';
import { useServerSupabaseWithAuth } from '@/hooks/useServerSupabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await useServerSupabaseWithAuth();
  const { data: integration } = await supabase
    .from('user_integrations')
    .select('config')
    .eq('user_id', userId)
    .eq('integration_id', 'mailchimp')
    .single();

  if (!integration?.config?.access_token) {
    return NextResponse.json({ error: 'Not connected' }, { status: 404 });
  }

  const { access_token, api_endpoint } = integration.config;

  // Fetch lists (audiences)
  const response = await fetch(`${api_endpoint}/3.0/lists`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'API request failed' }, { status: 500 });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
```

### Mailchimp API Features to Implement

- [ ] List audiences (lists)
- [ ] Add subscriber to list
- [ ] Create/send campaigns
- [ ] Webhook for subscriber events

---

## Token Refresh Strategy

All three providers support refresh tokens. Implement a shared utility:

```typescript
// src/lib/oauth-refresh.ts

export async function refreshOAuthToken(
  provider: 'google-analytics' | 'calendly' | 'mailchimp',
  refreshToken: string
): Promise<{ access_token: string; expires_at: string } | null> {
  const configs = {
    'google-analytics': {
      url: 'https://oauth2.googleapis.com/token',
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    },
    calendly: {
      url: 'https://auth.calendly.com/oauth/token',
      clientId: process.env.CALENDLY_CLIENT_ID,
      clientSecret: process.env.CALENDLY_CLIENT_SECRET,
    },
    mailchimp: {
      url: 'https://login.mailchimp.com/oauth2/token',
      clientId: process.env.MAILCHIMP_CLIENT_ID,
      clientSecret: process.env.MAILCHIMP_CLIENT_SECRET,
    },
  };

  const config = configs[provider];
  if (!config.clientId || !config.clientSecret) return null;

  const response = await fetch(config.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };
}
```

---

## Database Schema

Ensure `user_integrations` table exists:

```sql
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  integration_id TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, integration_id)
);

-- RLS Policies
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations"
  ON user_integrations FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own integrations"
  ON user_integrations FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own integrations"
  ON user_integrations FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own integrations"
  ON user_integrations FOR DELETE
  USING (auth.uid()::text = user_id);
```

---

## Testing Checklist

For each integration:

- [ ] OAuth start requires authentication
- [ ] State parameter is generated and validated
- [ ] Tokens are stored with authenticated Supabase client
- [ ] Token refresh works when access token expires
- [ ] Disconnect/revoke flow clears stored tokens
- [ ] Error states are handled gracefully
- [ ] Rate limiting is applied to API endpoints

---

## Security Checklist

- [x] OAuth state parameter (CSRF protection)
- [x] Authenticated Supabase client (RLS)
- [x] User authentication required
- [ ] Token encryption at rest (consider for sensitive tokens)
- [ ] Audit logging for OAuth events
- [ ] Rate limiting on OAuth endpoints
