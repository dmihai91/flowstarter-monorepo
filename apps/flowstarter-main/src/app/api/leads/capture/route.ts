/**
 * POST /api/leads/capture
 * Public endpoint — called from generated client sites.
 * No auth required. Rate-limited by IP.
 * Stores lead in Supabase.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DatabaseExtended } from '@/lib/database-extensions.types';

const LeadCaptureSchema = z
  .object({
    projectId: z.string().uuid('Invalid project ID'),
    name: z.string().max(200).optional(),
    email: z.string().email('Invalid email').optional(),
    phone: z.string().max(50).optional(),
    message: z.string().max(5000).optional(),
    source: z.string().max(100).optional(),
  })
  .passthrough(); // allow extra fields to land in `extra`

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

function detectSpam(name: string, email: string, message: string): boolean {
  const combined = `${name} ${email} ${message}`.toLowerCase();
  const spamPatterns = [
    /\bviagra\b/,
    /\bcasino\b/,
    /\bsex\b/,
    /\bporn\b/,
    /https?:\/\/[^\s]+\.[^\s]+/,
    /\b(buy now|cheap|click here|free money|you've won)\b/,
  ];
  return spamPatterns.filter((p) => p.test(combined)).length >= 2;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many submissions' },
      { status: 429, headers: corsHeaders(origin) }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const result = LeadCaptureSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.errors[0].message },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const { projectId, name, email, phone, message, source, ...extra } =
    result.data;

  try {
    const supabase =
      createSupabaseServiceRoleClient() as unknown as SupabaseClient<DatabaseExtended>;

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: 'Invalid project' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const isSpam = detectSpam(name || '', email || '', message || '');

    const { error } = await supabase.from('leads').insert({
      project_id: projectId,
      name: name ?? null,
      email: email ?? null,
      phone: phone ?? null,
      message: message ?? null,
      source: source ?? null,
      ip_address: ip,
      user_agent: request.headers.get('user-agent') || null,
      referrer: request.headers.get('referer') || null,
      extra: (Object.keys(extra).length > 0 ? extra : {}) as Record<
        string,
        string | number | boolean | null
      >,
      status: isSpam ? 'spam' : 'new',
    });

    if (error) {
      console.error('[Leads] Insert failed:', error);
      return NextResponse.json(
        { error: 'Failed to save' },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders(origin) }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400, headers: corsHeaders(origin) }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}
