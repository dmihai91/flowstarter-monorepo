import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

    it('allows assets.flowstarter.dev in img-src', () => {
      expect(buildCSPHeader()).toContain('https://assets.flowstarter.dev');
    });

    it('includes frame-ancestors none', () => {
      expect(buildCSPHeader()).toContain("frame-ancestors 'none'");
    });

    it('allows Daytona sandbox previews in frame-src (concierge funnel)', () => {
      // The discovery wizard step-7 live preview frames the generated
      // site running in its Daytona sandbox; without this the browser
      // blocks it under our own CSP and the preview stays blank.
      const frameSrc = buildCSPHeader()
        .split(';')
        .map((d) => d.trim())
        .find((d) => d.startsWith('frame-src'));
      expect(frameSrc).toContain('https://*.daytonaproxy01.net');
    });

    it('includes object-src none', () => {
      expect(buildCSPHeader()).toContain("object-src 'none'");
    });

    it('includes upgrade-insecure-requests in production when the site URL is https', () => {
      // `buildCSPHeader` only emits this directive when production AND
      // `NEXT_PUBLIC_SITE_URL` is https — otherwise staging / LAN HTTP
      // access silently breaks (see `utils/security-headers.ts`).
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://flowstarter.net');
      expect(buildCSPHeader()).toContain('upgrade-insecure-requests');
    });

    it('does NOT emit a per-request nonce in script-src (caching mismatch)', () => {
      // The site is statically rendered + CDN-cached, so a per-request CSP
      // nonce never matches the cached HTML's build-time <script> nonce and
      // blocks every inline script (blank page). buildCSPHeader therefore
      // ignores the nonce for script-src and relies on 'unsafe-inline' + the
      // host allowlist. See the comment in `security-headers.ts`.
      const csp = buildCSPHeader('test-nonce-123');
      expect(csp).not.toContain("'nonce-test-nonce-123'");
      expect(csp).toContain("'unsafe-inline'");
      // `'strict-dynamic'` is intentionally NOT emitted — it would override
      // the host allowlist and break Clerk's external script load.
      expect(csp).not.toContain("'strict-dynamic'");
    });

    it('uses unsafe-inline without nonce in production', () => {
      const csp = buildCSPHeader();
      expect(csp).toContain("'unsafe-inline'");
    });

    describe('development mode', () => {
      beforeEach(() => {
        vi.stubEnv('NODE_ENV', 'development');
      });

      afterEach(() => {
        delete process.env.NEXT_PUBLIC_SITE_URL;
        delete process.env.NEXT_PUBLIC_EDITOR_URL;
      });

      it('includes unsafe-eval in dev', () => {
        const csp = buildCSPHeader();
        expect(csp).toContain("'unsafe-eval'");
      });

      it('includes localhost connect-src in dev', () => {
        const csp = buildCSPHeader();
        expect(csp).toContain('ws://localhost:*');
      });

      it('includes NEXT_PUBLIC_SITE_URL http and ws in dev connect-src', () => {
        process.env.NEXT_PUBLIC_SITE_URL = 'http://192.168.55.2:3000';
        const csp = buildCSPHeader();
        expect(csp).toContain('http://192.168.55.2:3000');
        expect(csp).toContain('ws://192.168.55.2:3000');
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
