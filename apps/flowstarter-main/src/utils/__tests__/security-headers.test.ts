import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next-secure-headers and next/server before importing
vi.mock('next-secure-headers', () => ({
  createSecureHeaders: () => ({
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
  }),
}));

vi.mock('next/server', () => ({
  NextResponse: class {
    headers = new Map<string, string>();
  },
}));

import { buildCSPHeader, getStaticCSPHeader } from '../security-headers';

describe('security-headers', () => {
  describe('buildCSPHeader', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    it('returns a string', () => {
      expect(typeof buildCSPHeader()).toBe('string');
    });

    it('includes default-src self', () => {
      expect(buildCSPHeader()).toContain("default-src 'self'");
    });

    it('includes script-src', () => {
      expect(buildCSPHeader()).toContain('script-src');
    });

    it('includes style-src', () => {
      expect(buildCSPHeader()).toContain('style-src');
    });

    it('includes img-src', () => {
      expect(buildCSPHeader()).toContain('img-src');
    });

    it('includes frame-ancestors none', () => {
      expect(buildCSPHeader()).toContain("frame-ancestors 'none'");
    });

    it('includes object-src none', () => {
      expect(buildCSPHeader()).toContain("object-src 'none'");
    });

    it('includes upgrade-insecure-requests in production', () => {
      expect(buildCSPHeader()).toContain('upgrade-insecure-requests');
    });

    it('includes nonce when provided', () => {
      const csp = buildCSPHeader('test-nonce-123');
      expect(csp).toContain("'nonce-test-nonce-123'");
      expect(csp).toContain("'strict-dynamic'");
    });

    it('uses unsafe-inline without nonce in production', () => {
      const csp = buildCSPHeader();
      expect(csp).toContain("'unsafe-inline'");
    });

    describe('development mode', () => {
      beforeEach(() => {
        vi.stubEnv('NODE_ENV', 'development');
      });

      it('includes unsafe-eval in dev', () => {
        const csp = buildCSPHeader();
        expect(csp).toContain("'unsafe-eval'");
      });

      it('includes localhost connect-src in dev', () => {
        const csp = buildCSPHeader();
        expect(csp).toContain('ws://localhost:*');
      });

      it('does not include upgrade-insecure-requests in dev', () => {
        const csp = buildCSPHeader();
        expect(csp).not.toContain('upgrade-insecure-requests');
      });
    });
  });

  describe('getStaticCSPHeader', () => {
    it('returns a string', () => {
      expect(typeof getStaticCSPHeader()).toBe('string');
    });

    it('returns CSP without nonce', () => {
      const csp = getStaticCSPHeader();
      expect(csp).not.toContain('nonce-');
    });
  });
});
