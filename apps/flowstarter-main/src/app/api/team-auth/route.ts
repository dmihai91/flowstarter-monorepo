/**
 * Team Auth API - Callback handler for editor SSO
 * 
 * After Clerk login, redirects team members back to editor with session token.
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Allowed team email domains
const TEAM_EMAIL_DOMAINS = ['flowstarter.co', 'flowstarter.com'];

// Allowed editor origins
const ALLOWED_EDITOR_ORIGINS = [
  'http://localhost:5175',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://editor.flowstarter.co',
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUrl = searchParams.get('redirect_url');
  
  // Validate redirect URL
  if (!redirectUrl) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  try {
    const redirectOrigin = new URL(redirectUrl).origin;
    if (!ALLOWED_EDITOR_ORIGINS.includes(redirectOrigin)) {
      return NextResponse.json({ error: 'Invalid redirect URL' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid redirect URL' }, { status: 400 });
  }
  
  // Check authentication
  const { userId } = await auth();
  
  if (!userId) {
    // Not authenticated - redirect to login with callback
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect_url', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Get user details
  const user = await currentUser();
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  const email = user.primaryEmailAddress?.emailAddress;
  const name = user.fullName || user.firstName || 'Team Member';
  
  // Verify team email domain
  const domain = email?.split('@')[1]?.toLowerCase();
  const isTeam = domain && TEAM_EMAIL_DOMAINS.includes(domain);
  
  if (!isTeam) {
    // Not a team member - redirect with error
    const errorUrl = new URL(redirectUrl);
    errorUrl.searchParams.set('error', encodeURIComponent(`Access denied. Only ${TEAM_EMAIL_DOMAINS.join(', ')} emails allowed.`));
    return NextResponse.redirect(errorUrl);
  }
  
  // Generate simple session token (in production, use proper JWT)
  const token = Buffer.from(`${userId}:${email}:${Date.now()}`).toString('base64');
  
  // Redirect back to editor with session info
  const callbackUrl = new URL(redirectUrl);
  callbackUrl.searchParams.set('token', token);
  callbackUrl.searchParams.set('email', email || '');
  callbackUrl.searchParams.set('name', name);
  
  return NextResponse.redirect(callbackUrl);
}
