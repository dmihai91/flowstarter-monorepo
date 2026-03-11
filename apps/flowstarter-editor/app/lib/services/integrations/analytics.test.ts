/**
 * Unit tests for Analytics integration
 */
import { describe, it, expect } from 'vitest';
import { injectAnalytics } from './analytics';

const layoutFile = {
  path: 'src/layouts/Layout.astro',
  content: '<html><head><title>Test</title></head><body><slot /></body></html>',
};

describe('injectAnalytics', () => {
  it('injects GA4 script with measurement ID', () => {
    const result = injectAnalytics([layoutFile], { provider: 'ga4', id: 'G-ABC123' });
    const layout = result[0];

    expect(layout.content).toContain('googletagmanager.com/gtag/js?id=G-ABC123');
    expect(layout.content).toContain("gtag('config','G-ABC123')");
    expect(layout.content).toContain('</head>');
  });

  it('injects Plausible script with domain', () => {
    const result = injectAnalytics([layoutFile], { provider: 'plausible', id: 'mysite.com' });

    expect(result[0].content).toContain('data-domain="mysite.com"');
    expect(result[0].content).toContain('plausible.io/js/script.js');
  });

  it('injects Fathom script with site ID', () => {
    const result = injectAnalytics([layoutFile], { provider: 'fathom', id: 'ABCDEF' });

    expect(result[0].content).toContain('data-site="ABCDEF"');
    expect(result[0].content).toContain('cdn.usefathom.com/script.js');
  });

  it('does not double-inject if ID already present', () => {
    const alreadyInjected = {
      path: 'src/layouts/Layout.astro',
      content: '<html><head><script data-domain="mysite.com"></script></head><body></body></html>',
    };
    const result = injectAnalytics([alreadyInjected], { provider: 'plausible', id: 'mysite.com' });

    const count = (result[0].content.match(/mysite\.com/g) || []).length;
    expect(count).toBe(1);
  });

  it('does not modify non-layout files', () => {
    const files = [
      layoutFile,
      { path: 'src/pages/index.astro', content: '<h1>Home</h1>' },
    ];
    const result = injectAnalytics(files, { provider: 'ga4', id: 'G-TEST' });

    expect(result[1].content).toBe('<h1>Home</h1>');
  });

  it('handles unknown provider gracefully', () => {
    const result = injectAnalytics([layoutFile], { provider: 'unknown' as any, id: 'test' });

    expect(result[0].content).toBe(layoutFile.content);
  });
});
