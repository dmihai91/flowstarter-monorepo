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
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.MAILCHIMP_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'Mailchimp OAuth not configured' },
      { status: 500 }
    );
  }

  const base = getBaseUrl(req);
  const redirectUri = `${base}/api/integrations/mailchimp/oauth/callback`;

  // Generate secure state parameter for CSRF protection
  const state = await createOAuthState('mailchimp');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });

  const authorizeUrl = `https://login.mailchimp.com/oauth2/authorize?${params.toString()}`;
  return NextResponse.json({ authorizeUrl });
}
