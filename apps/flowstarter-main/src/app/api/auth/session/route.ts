/**
 * Auth Session API - Returns current user session info
 * 
 * Used by editor to verify Clerk session via shared cookies.
 * CORS configured to allow editor subdomains.
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  // Local development
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  // Development
  'https://editor.flowstarter.dev',
  // Production
  'https://editor.flowstarter.app',
];

// Team email domains
const TEAM_EMAIL_DOMAINS = ['flowstarter.app'];

function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { authenticated: false },
        { headers: corsHeaders }
      );
    }
    
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { headers: corsHeaders }
      );
    }
    
    const email = user.primaryEmailAddress?.emailAddress;
    const name = user.fullName || user.firstName || 'User';
    
    // Check if team member
    const domain = email?.split('@')[1]?.toLowerCase();
    const isTeam = domain && TEAM_EMAIL_DOMAINS.includes(domain);
    
    return NextResponse.json({
      authenticated: true,
      userId,
      email,
      name,
      isTeam,
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Session check failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}
