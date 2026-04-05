/**
 * Tests for POST /api/leads/capture
 * Tests Zod validation, spam detection, CORS, and rate limiting logic.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';

// Mirror schema from route
const LeadCaptureSchema = z
  .object({
    projectId: z.string().uuid('Invalid project ID'),
    name: z.string().max(200).optional(),
    email: z.string().email('Invalid email').optional(),
    phone: z.string().max(50).optional(),
    message: z.string().max(5000).optional(),
    source: z.string().max(100).optional(),
  })
  .passthrough();

// Mirror spam detection from route (updated patterns — crypto/bitcoin removed)
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

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

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

// ── Zod validation ───────────────────────────────────────────────────────────

describe('LeadCaptureSchema validation', () => {
  it('accepts valid UUID projectId', () => {
    const result = LeadCaptureSchema.safeParse({
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID projectId', () => {
    const result = LeadCaptureSchema.safeParse({ projectId: 'not-a-uuid' });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.errors[0].message).toBe('Invalid project ID');
  });

  it('rejects missing projectId', () => {
    const result = LeadCaptureSchema.safeParse({ email: 'test@example.com' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = LeadCaptureSchema.safeParse({
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.errors[0].message).toBe('Invalid email');
  });

  it('accepts all optional fields absent', () => {
    const result = LeadCaptureSchema.safeParse({
      projectId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects name over 200 characters', () => {
    const result = LeadCaptureSchema.safeParse({
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'A'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('rejects message over 5000 characters', () => {
    const result = LeadCaptureSchema.safeParse({
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      message: 'A'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('passes extra fields through to extra object', () => {
    const result = LeadCaptureSchema.safeParse({
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Elena',
      company: 'Salon Elena',
      preferredDate: '2026-03-15',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).company).toBe(
        'Salon Elena'
      );
    }
  });
});

// ── Spam detection ───────────────────────────────────────────────────────────

describe('detectSpam', () => {
  it('marks obvious spam with multiple patterns', () => {
    expect(
      detectSpam('Casino King', 'spam@test.com', 'Buy cheap viagra now!')
    ).toBe(true);
  });

  it('marks link-heavy spam', () => {
    expect(
      detectSpam('', '', 'Click here https://evil.com buy now free money')
    ).toBe(true);
  });

  it('allows legitimate Romanian business messages', () => {
    expect(
      detectSpam(
        'Elena Popescu',
        'elena@salon.ro',
        'Doresc o programare pentru vineri'
      )
    ).toBe(false);
    expect(
      detectSpam('Ion Dima', 'ion@yahoo.ro', 'Cat costa un tratament facial?')
    ).toBe(false);
  });

  it('allows messages with single pattern (below threshold)', () => {
    expect(
      detectSpam('John', 'john@gmail.com', 'I want to buy your service')
    ).toBe(false);
  });

  it('handles empty fields without throwing', () => {
    expect(detectSpam('', '', '')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(detectSpam('CASINO', 'test@test.com', 'BUY NOW free money')).toBe(
      true
    );
  });

  it('does NOT flag crypto/bitcoin (legitimate SaaS terms)', () => {
    expect(
      detectSpam('John', 'john@startup.com', 'I run a crypto startup')
    ).toBe(false);
    expect(
      detectSpam('Maria', 'maria@test.com', 'We accept bitcoin payments')
    ).toBe(false);
  });

  it('does NOT flag the word "free" alone', () => {
    expect(detectSpam('Jane', 'jane@test.com', 'Is there a free trial?')).toBe(
      false
    );
  });
});

// ── CORS headers ─────────────────────────────────────────────────────────────

describe('CORS headers', () => {
  it('echoes back the origin', () => {
    const headers = corsHeaders('https://mysite.flowstarter.site');
    expect(headers['Access-Control-Allow-Origin']).toBe(
      'https://mysite.flowstarter.site'
    );
  });

  it('allows POST and OPTIONS', () => {
    const headers = corsHeaders('*');
    expect(headers['Access-Control-Allow-Methods']).toContain('POST');
    expect(headers['Access-Control-Allow-Methods']).toContain('OPTIONS');
  });

  it('allows Content-Type header', () => {
    const headers = corsHeaders('*');
    expect(headers['Access-Control-Allow-Headers']).toContain('Content-Type');
  });

  it('sets max-age for preflight caching', () => {
    const headers = corsHeaders('*');
    expect(headers['Access-Control-Max-Age']).toBe('86400');
  });
});

// ── Rate limiting ─────────────────────────────────────────────────────────────

describe('Rate limiting', () => {
  beforeAll(() => rateLimitMap.clear());

  it('allows first request', () => {
    expect(isRateLimited('1.2.3.4')).toBe(false);
  });

  it('allows up to 10 requests from same IP', () => {
    const ip = '10.0.0.1';
    for (let i = 0; i < 10; i++) {
      expect(isRateLimited(ip)).toBe(false);
    }
  });

  it('blocks the 11th request from same IP', () => {
    const ip = '10.0.0.2';
    for (let i = 0; i < 10; i++) isRateLimited(ip);
    expect(isRateLimited(ip)).toBe(true);
  });

  it('allows different IPs independently', () => {
    for (let i = 0; i < 11; i++) isRateLimited('a.a.a.a');
    expect(isRateLimited('b.b.b.b')).toBe(false);
  });

  it('resets after window expires', () => {
    const ip = '10.0.0.3';
    for (let i = 0; i < 11; i++) isRateLimited(ip);
    expect(isRateLimited(ip)).toBe(true);

    const entry = rateLimitMap.get(ip)!;
    entry.resetAt = Date.now() - 1;

    expect(isRateLimited(ip)).toBe(false);
  });
});

// ── Field extraction ──────────────────────────────────────────────────────────

describe('Lead data extraction', () => {
  it('separates known fields from extras', () => {
    const body = {
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Elena',
      email: 'elena@test.com',
      phone: '+40712345678',
      message: 'Hello',
      source: '/contact',
      company: 'Salon Elena',
      preferredDate: '2026-03-15',
    };

    const { name, email, phone, message, source, projectId, ...extra } = body;

    expect(name).toBe('Elena');
    expect(email).toBe('elena@test.com');
    expect(projectId).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(extra).toEqual({
      company: 'Salon Elena',
      preferredDate: '2026-03-15',
    });
  });

  it('produces empty extra object when no extra fields given', () => {
    const body = {
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      email: 'test@test.com',
    };
    const { name: _n, email: _e, projectId: _p, ...extra } = body;
    expect(Object.keys(extra)).toHaveLength(0);
  });
});
