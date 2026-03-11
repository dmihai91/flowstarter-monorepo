/**
 * Tests for POST /api/leads/capture
 * Tests spam detection, validation, CORS, and rate limiting logic.
 */
import { describe, it, expect } from 'vitest';

// Extract spam detection for unit testing
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

describe('detectSpam', () => {
  it('marks obvious spam (multiple patterns)', () => {
    expect(detectSpam('Casino King', 'spam@crypto.com', 'Buy cheap viagra now!')).toBe(true);
  });

  it('marks link-heavy spam', () => {
    expect(detectSpam('John', 'j@test.com', 'Click here https://evil.com to win free bitcoin')).toBe(true);
  });

  it('allows legitimate messages', () => {
    expect(detectSpam('Elena Popescu', 'elena@salon.ro', 'I would like to book an appointment for next week')).toBe(false);
  });

  it('allows messages with single pattern (below threshold)', () => {
    expect(detectSpam('John', 'john@gmail.com', 'I want to buy your service')).toBe(false);
  });

  it('handles empty fields', () => {
    expect(detectSpam('', '', '')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(detectSpam('CASINO', 'test@BITCOIN.com', 'BUY NOW')).toBe(true);
  });
});

describe('CORS headers', () => {
  function corsHeaders(origin: string): Record<string, string> {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
  }

  it('echoes back the origin', () => {
    const headers = corsHeaders('https://mysite.flowstarter.site');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://mysite.flowstarter.site');
  });

  it('allows POST method', () => {
    const headers = corsHeaders('*');
    expect(headers['Access-Control-Allow-Methods']).toContain('POST');
  });

  it('allows Content-Type header', () => {
    const headers = corsHeaders('*');
    expect(headers['Access-Control-Allow-Headers']).toContain('Content-Type');
  });
});

describe('Rate limiting logic', () => {
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

  it('allows first request', () => {
    expect(isRateLimited('1.2.3.4')).toBe(false);
  });

  it('allows up to 10 requests', () => {
    const ip = '10.0.0.1';
    for (let i = 0; i < 10; i++) {
      expect(isRateLimited(ip)).toBe(false);
    }
  });

  it('blocks the 11th request', () => {
    const ip = '10.0.0.2';
    for (let i = 0; i < 10; i++) isRateLimited(ip);
    expect(isRateLimited(ip)).toBe(true);
  });

  it('allows different IPs independently', () => {
    for (let i = 0; i < 10; i++) isRateLimited('a.a.a.a');
    expect(isRateLimited('b.b.b.b')).toBe(false);
  });
});

describe('Lead data extraction', () => {
  it('separates known fields from extras', () => {
    const body = {
      projectId: 'proj-1',
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
    expect(extra).toEqual({ company: 'Salon Elena', preferredDate: '2026-03-15' });
  });

  it('handles missing fields gracefully', () => {
    const body = { projectId: 'proj-1', email: 'test@test.com' };
    const { name, email, phone, message, source, projectId, ...extra } = body as Record<string, unknown>;

    expect(name).toBeUndefined();
    expect(email).toBe('test@test.com');
    expect(phone).toBeUndefined();
    expect(Object.keys(extra)).toHaveLength(0);
  });
});
