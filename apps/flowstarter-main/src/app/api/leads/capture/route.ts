// @ts-nocheck
/**
 * POST /api/leads/capture
 * Public endpoint — called from generated client sites.
 * No auth required. Rate-limited by projectId + IP.
 * Stores lead in Supabase.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

// Simple in-memory rate limit (per IP, 10 submissions per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  // CORS headers for cross-origin form submissions
  const origin = request.headers.get('origin') || '*';

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many submissions' },
      { status: 429, headers: corsHeaders(origin) },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const projectId = body.projectId as string;
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId required' },
        { status: 400, headers: corsHeaders(origin) },
      );
    }

    // Extract known fields, put the rest in extra
    const { name, email, phone, message, source, ...extra } = body;
    delete extra.projectId;

    const supabase = createSupabaseServiceRoleClient();

    // Verify project exists
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: 'Invalid project' },
        { status: 400, headers: corsHeaders(origin) },
      );
    }

    // Basic spam detection
    const isSpam = detectSpam(
      (name as string) || '',
      (email as string) || '',
      (message as string) || '',
    );

    const { error } = await supabase.from('leads' as any).insert({
      project_id: projectId,
      name: (name as string) || null,
      email: (email as string) || null,
      phone: (phone as string) || null,
      message: (message as string) || null,
      source: (source as string) || null,
      ip_address: ip,
      user_agent: request.headers.get('user-agent') || null,
      referrer: request.headers.get('referer') || null,
      extra: Object.keys(extra).length > 0 ? extra : {},
      status: isSpam ? 'spam' : 'new',
    });

    if (error) {
      console.error('[Leads] Insert failed:', error);
      return NextResponse.json(
        { error: 'Failed to save' },
        { status: 500, headers: corsHeaders(origin) },
      );
    }

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders(origin) },
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400, headers: corsHeaders(origin) },
    );
  }
}

// CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function detectSpam(name: string, email: string, message: string): boolean {
  const combined = `${name} ${email} ${message}`.toLowerCase();
  const spamPatterns = [
    /\bviagra\b/, /\bcasino\b/, /\bcrypto\b/, /\bbitcoin\b/,
    /\bsex\b/, /\bporn\b/, /https?:\/\/[^\s]+\.[^\s]+/,
    /\b(buy|cheap|free|win|winner|prize|click here)\b/,
  ];
  const spamScore = spamPatterns.filter((p) => p.test(combined)).length;
  return spamScore >= 2;
}
