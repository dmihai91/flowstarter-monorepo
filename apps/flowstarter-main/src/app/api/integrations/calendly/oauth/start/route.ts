import { NextResponse } from 'next/server';

function base(req: Request) {
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

export async function POST(req: Request) {
  const redirectUri = `${base(req)}/api/integrations/calendly/oauth/callback`;
  // Placeholder authorize URL for MVP
  const authorizeUrl = `${redirectUri}?code=mock`;
  return NextResponse.json({ authorizeUrl });
}
