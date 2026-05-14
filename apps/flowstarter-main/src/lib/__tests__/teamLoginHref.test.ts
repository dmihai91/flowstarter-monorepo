import { describe, expect, it } from 'vitest';

import { buildTeamLoginHref } from '../teamLoginHref';

describe('buildTeamLoginHref', () => {
  it('returns bare path when no forwards', () => {
    const sp = new URLSearchParams();
    expect(buildTeamLoginHref(sp)).toBe('/admin/login');
  });

  it('forwards redirect_url and next', () => {
    const sp = new URLSearchParams();
    sp.set('redirect_url', 'https://code.example.com/p/1');
    sp.set('next', '/admin/dashboard');
    expect(buildTeamLoginHref(sp)).toBe(
      '/admin/login?redirect_url=https%3A%2F%2Fcode.example.com%2Fp%2F1&next=%2Fadmin%2Fdashboard'
    );
  });
});
