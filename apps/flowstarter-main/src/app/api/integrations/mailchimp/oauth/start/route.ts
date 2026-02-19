import { NextResponse } from 'next/server';

function base(req: Request) {
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

export async function POST(req: Request) {
  const redirectUri = `${base(req)}/api/integrations/mailchimp/oauth/callback`;
  const authorizeUrl = `${redirectUri}?code=mock`;
  return NextResponse.json({ authorizeUrl });
}
