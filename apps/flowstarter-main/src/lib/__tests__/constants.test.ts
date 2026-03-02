import { describe, expect, it } from 'vitest';
import { EXTERNAL_URLS, ROUTES } from '../constants';

describe('EXTERNAL_URLS', () => {
  it('has Calendly discovery URL', () => {
    expect(EXTERNAL_URLS.calendly.discovery).toContain('calendly.com');
    expect(EXTERNAL_URLS.calendly.discovery).toContain('discovery');
  });

  it('has Calendly check-in URL', () => {
    expect(EXTERNAL_URLS.calendly.checkIn).toContain('calendly.com');
    expect(EXTERNAL_URLS.calendly.checkIn).toContain('check-in');
  });

  it('URLs are https', () => {
    expect(EXTERNAL_URLS.calendly.discovery).toMatch(/^https:\/\//);
    expect(EXTERNAL_URLS.calendly.checkIn).toMatch(/^https:\/\//);
  });
});

describe('ROUTES', () => {
  it('all routes start with /', () => {
    Object.values(ROUTES).forEach(route => {
      expect(route).toMatch(/^\//);
    });
  });

  it('has required routes', () => {
    expect(ROUTES.dashboard).toBe('/dashboard');
    expect(ROUTES.teamDashboard).toBe('/team/dashboard');
    expect(ROUTES.login).toBe('/login');
  });
});
