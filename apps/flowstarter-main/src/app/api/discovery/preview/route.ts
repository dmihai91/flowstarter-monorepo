/**
 * POST /api/discovery/preview
 *
 * Generates a real first-pass site preview from the discovery wizard answers
 * using the same system-prompt LLM pipeline the team uses (generateSiteCopy →
 * OpenRouter / Claude). This is the "wire it locally" path: real generation,
 * no Docker/Hetzner sandbox yet. The wizard renders the result into the
 * preview frame; the deterministic mock stays as the fail-open fallback.
 *
 * Public (under the /api/discovery allowlist), rate-limited, fails open:
 * if OpenRouter is unconfigured or generation errors, returns { skip:true }
 * so the wizard shows the static mock instead of dead-ending.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isOpenRouterConfigured } from '@/lib/ai/client';
import { generateSiteCopy, type SiteCopyInput } from '@/lib/ai/site-copy';

const PreviewSchema = z.object({
  businessName: z.string().max(200).optional().default(''),
  fullName: z.string().max(200).optional().default(''),
  description: z.string().min(1).max(5000),
  industry: z.string().max(200).optional().default(''),
  targetAudience: z.string().max(500).optional().default(''),
  goal: z
    .enum(['leads', 'sales', 'bookings', 'portfolio', ''])
    .optional()
    .default(''),
  brandTone: z
    .enum(['professional', 'bold', 'friendly', 'minimal', ''])
    .optional()
    .default(''),
});

const RATE_LIMIT = 4;
const RATE_WINDOW_MS = 60_000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

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

/** Wizard goal → site-copy goal (portfolio has no direct copy goal). */
function mapGoal(g: string): SiteCopyInput['goal'] {
  if (g === 'sales' || g === 'bookings' || g === 'leads') return g;
  return 'leads';
}

/** Wizard tone → site-copy tone (minimal collapses to professional). */
function mapTone(t: string): SiteCopyInput['brandTone'] {
  if (t === 'bold' || t === 'friendly' || t === 'professional') return t;
  return 'professional';
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = PreviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid payload' },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // Fail open — wizard falls back to the deterministic mock.
  if (!isOpenRouterConfigured()) {
    return NextResponse.json({ skip: true });
  }

  const businessName = (d.businessName || d.fullName || '').trim();
  if (!businessName) {
    return NextResponse.json({ skip: true });
  }

  try {
    const copy = await generateSiteCopy({
      businessName,
      description: d.description,
      industry: d.industry || undefined,
      targetAudience: d.targetAudience || undefined,
      goal: mapGoal(d.goal),
      brandTone: mapTone(d.brandTone),
    });
    return NextResponse.json({ copy });
  } catch (err) {
    console.error('[discovery/preview] generation failed', err);
    return NextResponse.json({ skip: true });
  }
}
