import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  collectDevRedirectOriginsFromEnv,
  getAllowedRedirectOrigins,
  isSafeRedirectUrl,
} from '@flowstarter/platform-config';

describe('collectDevRedirectOriginsFromEnv', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('parses NEXT_PUBLIC_SITE_URL and comma-separated extras', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://192.168.2.10:3000/');
    vi.stubEnv(
      'NEXT_PUBLIC_EXTRA_REDIRECT_ORIGINS',
      'http://192.168.2.10:5733, http://192.168.2.10:5773'
    );

    expect(collectDevRedirectOriginsFromEnv()).toEqual(
      expect.arrayContaining([
        'http://192.168.2.10:3000',
        'http://192.168.2.10:5733',
        'http://192.168.2.10:5773',
      ])
    );
  });

  it('merges env origins into getAllowedRedirectOrigins', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://10.0.0.5:3000');
    expect(getAllowedRedirectOrigins()).toContain('http://10.0.0.5:3000');
  });

  it('treats redirect URLs on configured LAN origins as safe', () => {
    vi.stubEnv('NEXT_PUBLIC_EDITOR_URL', 'http://192.168.4.1:5733');
    expect(isSafeRedirectUrl('http://192.168.4.1:5733/projects/abc')).toBe(
      true
    );
  });
});
