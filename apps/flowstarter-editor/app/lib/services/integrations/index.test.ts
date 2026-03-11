/**
 * Integration tests for the injection pipeline
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { injectIntegrations } from './index';

const siteFiles = [
  {
    path: 'src/layouts/Layout.astro',
    content: '<html><head><title>Test Site</title></head><body><slot /></body></html>',
  },
  {
    path: 'src/pages/contact.astro',
    content: `<Layout>
  <section>
    <form>
      <input name="name" /><input name="email" /><textarea name="message"></textarea>
      <button type="submit">Send</button>
    </form>
  </section>
</Layout>`,
  },
  { path: 'src/pages/index.astro', content: '<Layout><h1>Home</h1></Layout>' },
  { path: 'src/pages/about.astro', content: '<Layout><h1>About</h1></Layout>' },
];

describe('injectIntegrations pipeline', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('injects nothing when config is empty', async () => {
    const result = await injectIntegrations(siteFiles, {});
    expect(result).toEqual(siteFiles);
  });

  it('injects all three integrations simultaneously', async () => {
    const result = await injectIntegrations(siteFiles, {
      calendly: { url: 'https://calendly.com/test' },
      analytics: { provider: 'plausible', id: 'test.com' },
      leadCapture: { projectId: 'proj-1', apiUrl: 'https://example.com/api/leads/capture' },
    });

    const layout = result.find((f) => f.path.includes('Layout.astro'))!;
    const contact = result.find((f) => f.path.includes('contact.astro'))!;

    // Layout has both Calendly + Plausible
    expect(layout.content).toContain('calendly.com/assets/external/widget.css');
    expect(layout.content).toContain('plausible.io/js/script.js');
    expect(layout.content).toContain('data-domain="test.com"');

    // Contact has Calendly widget (replaced form) but lead capture still works
    // Calendly replaces the form, so lead capture script is still injected
    expect(contact.content).toContain('calendly-inline-widget');

    // Non-contact/layout files unchanged
    const home = result.find((f) => f.path.includes('index.astro'))!;
    expect(home.content).toBe('<Layout><h1>Home</h1></Layout>');
  });

  it('fetches Calendly event types when API key provided', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ resource: { uri: 'https://api.calendly.com/users/u1' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          collection: [
            { uri: 'e1', name: 'Call', slug: 'call', duration: 30, scheduling_url: 'https://calendly.com/x/call', active: true },
          ],
        }),
      });

    vi.stubGlobal('fetch', mockFetch);

    const result = await injectIntegrations(siteFiles, {
      calendly: { url: 'https://calendly.com/test', apiKey: 'cal_key_123' },
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const contact = result.find((f) => f.path.includes('contact.astro'))!;
    expect(contact.content).toContain('Calendly.initPopupWidget');
    expect(contact.content).toContain('Call');
  });

  it('falls back to simple embed when Calendly API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));

    const result = await injectIntegrations(siteFiles, {
      calendly: { url: 'https://calendly.com/test', apiKey: 'bad_key' },
    });

    const contact = result.find((f) => f.path.includes('contact.astro'))!;
    expect(contact.content).toContain('calendly-inline-widget');
    expect(contact.content).not.toContain('initPopupWidget');
  });

  it('preserves file count (no files added or removed)', async () => {
    const result = await injectIntegrations(siteFiles, {
      calendly: { url: 'https://calendly.com/x' },
      analytics: { provider: 'ga4', id: 'G-TEST' },
      leadCapture: { projectId: 'p1', apiUrl: 'https://x.com/api' },
    });

    expect(result).toHaveLength(siteFiles.length);
  });
});
