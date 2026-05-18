/**
 * POST /api/discovery/recommend
 *
 * LLM-driven build-tier recommendation. Feeds the full discovery answers
 * (including the free-text description) to a small model via OpenRouter and
 * returns a tier + reason keys.
 *
 * Public (under the /api/discovery allowlist), rate-limited, fails open:
 * if OpenRouter is unconfigured or the model errors / returns junk, this
 * falls back to the deterministic `recommendTier` so the wizard always gets
 * a usable answer and never dead-ends.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { recommendTierLLM } from '@/lib/ai/recommend-tier';
import {
  type DiscoveryData,
  EMPTY_DISCOVERY,
  recommendTier,
} from '@/app/(dynamic-pages)/(main-pages)/components/discovery/discovery.logic';

const Schema = z.object({
  businessName: z.string().max(200).optional().default(''),
  description: z.string().max(5000).optional().default(''),
  industry: z.string().max(200).optional().default(''),
  targetAudience: z.string().max(500).optional().default(''),
  goal: z
    .enum(['leads', 'sales', 'bookings', 'portfolio', ''])
    .optional()
    .default(''),
  secondaryGoals: z
    .array(z.enum(['leads', 'sales', 'bookings', 'portfolio']))
    .optional()
    .default([]),
  brandTone: z
    .enum(['professional', 'bold', 'friendly', 'minimal', ''])
    .optional()
    .default(''),
  pageCount: z
    .enum(['lt-5', '5-7', '8-15', '15+', 'unsure', ''])
    .optional()
    .default(''),
  timeline: z
    .enum(['asap', '4-weeks', '1-3-months', 'flexible', ''])
    .optional()
    .default(''),
  commerceMode: z
    .enum(['none', 'few-services', 'digital', 'physical', 'mixed', ''])
    .optional()
    .default(''),
  catalogSize: z
    .enum(['na', '1-5', '6-25', '26-100', '100+', 'unsure'])
    .optional()
    .default('na'),
  customIntegrations: z.string().max(2000).optional().default(''),
});

const RATE_LIMIT = 8;
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

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid payload' },
      { status: 400 }
    );
  }

  const data: DiscoveryData = { ...EMPTY_DISCOVERY, ...parsed.data };

  // Deterministic result is always computed — it is the fail-open answer and
  // the floor we never go below.
  const deterministic = recommendTier(data);

  try {
    const llm = await recommendTierLLM(data);
    if (llm) {
      return NextResponse.json({ ...llm, source: 'llm' });
    }
  } catch {
    // fall through to deterministic
  }

  return NextResponse.json({ ...deterministic, source: 'fallback' });
}
