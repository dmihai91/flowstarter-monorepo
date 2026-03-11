/**
 * Unit tests for Calendly integration
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { injectCalendly, fetchCalendlyEventTypes } from './calendly';

describe('injectCalendly', () => {
  const baseFiles = [
    {
      path: 'src/layouts/Layout.astro',
      content: '<html><head><title>Test</title></head><body><slot /></body></html>',
    },
    {
      path: 'src/pages/contact.astro',
      content: `---
import Layout from '../layouts/Layout.astro';
---
<Layout>
  <section>
    <h1>Contact Us</h1>
    <form>
      <input name="name" />
      <input name="email" />
      <textarea name="message"></textarea>
      <button type="submit">Send</button>
    </form>
  </section>
</Layout>`,
    },
    {
      path: 'src/pages/about.astro',
      content: '<Layout><h1>About</h1></Layout>',
    },
  ];

  it('injects Calendly CSS+JS into Layout.astro <head>', () => {
    const result = injectCalendly(baseFiles, { url: 'https://calendly.com/test' });
    const layout = result.find((f) => f.path.includes('Layout.astro'))!;

    expect(layout.content).toContain('assets.calendly.com/assets/external/widget.css');
    expect(layout.content).toContain('assets.calendly.com/assets/external/widget.js');
    expect(layout.content).toContain('</head>');
  });

  it('replaces contact form with inline widget (simple mode)', () => {
    const result = injectCalendly(baseFiles, { url: 'https://calendly.com/elena' });
    const contact = result.find((f) => f.path.includes('contact.astro'))!;

    expect(contact.content).toContain('calendly-inline-widget');
    expect(contact.content).toContain('data-url="https://calendly.com/elena"');
    expect(contact.content).not.toContain('<form>');
  });

  it('generates popup buttons when event types provided (API mode)', () => {
    const result = injectCalendly(baseFiles, {
      url: 'https://calendly.com/elena',
      eventTypes: [
        { uri: 'u1', name: 'Consultation', slug: 'consult', duration: 30, scheduling_url: 'https://calendly.com/elena/consult', active: true },
        { uri: 'u2', name: 'Deep Dive', slug: 'deep', duration: 60, scheduling_url: 'https://calendly.com/elena/deep', active: true },
      ],
    });
    const contact = result.find((f) => f.path.includes('contact.astro'))!;

    expect(contact.content).toContain('Calendly.initPopupWidget');
    expect(contact.content).toContain('Consultation');
    expect(contact.content).toContain('30 min');
    expect(contact.content).toContain('Deep Dive');
    expect(contact.content).toContain('60 min');
    expect(contact.content).not.toContain('calendly-inline-widget');
  });

  it('does not modify non-layout, non-contact files', () => {
    const result = injectCalendly(baseFiles, { url: 'https://calendly.com/test' });
    const about = result.find((f) => f.path.includes('about.astro'))!;

    expect(about.content).toBe('<Layout><h1>About</h1></Layout>');
  });

  it('does not double-inject if already present', () => {
    const filesWithCalendly = [
      {
        path: 'src/layouts/Layout.astro',
        content: '<html><head><link href="https://assets.calendly.com/assets/external/widget.css" /></head><body></body></html>',
      },
    ];
    const result = injectCalendly(filesWithCalendly, { url: 'https://calendly.com/x' });

    const occurrences = (result[0].content.match(/calendly/g) || []).length;
    expect(occurrences).toBe(1); // Only the original one
  });

  it('handles contact page without form (appends before </section>)', () => {
    const noFormFiles = [
      {
        path: 'src/pages/contact.astro',
        content: '<Layout><section><h1>Contact</h1><p>Call us</p></section></Layout>',
      },
    ];
    const result = injectCalendly(noFormFiles, { url: 'https://calendly.com/test' });
    const contact = result[0];

    expect(contact.content).toContain('calendly-inline-widget');
  });
});

describe('fetchCalendlyEventTypes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches user URI then event types', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ resource: { uri: 'https://api.calendly.com/users/abc123' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          collection: [
            { uri: 'et1', name: '30min', slug: '30min', duration: 30, scheduling_url: 'https://calendly.com/x/30', active: true },
            { uri: 'et2', name: 'Inactive', slug: 'inactive', duration: 15, scheduling_url: 'https://calendly.com/x/15', active: false },
          ],
        }),
      });

    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchCalendlyEventTypes('fake_api_key');

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe('https://api.calendly.com/users/me');
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer fake_api_key');
    expect(result).toHaveLength(1); // Only active
    expect(result[0].name).toBe('30min');
  });

  it('throws on API error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    await expect(fetchCalendlyEventTypes('bad_key')).rejects.toThrow('Calendly API error: 401');
  });
});
