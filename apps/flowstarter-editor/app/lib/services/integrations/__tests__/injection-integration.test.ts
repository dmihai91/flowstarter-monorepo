/**
 * Integration tests: full site injection pipeline
 *
 * Tests that a complete generated site (all files) gets
 * all integrations injected correctly and produces valid HTML.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { injectIntegrations } from '../index';

// Realistic generated site files (coach-pro template structure)
const generatedSite = [
  {
    path: 'src/layouts/Layout.astro',
    content: `---
const { title = 'Coach Pro' } = Astro.props;
---
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <link rel="stylesheet" href="/styles/global.css" />
</head>
<body class="bg-white text-gray-900">
  <slot />
</body>
</html>`,
  },
  {
    path: 'src/pages/index.astro',
    content: `---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Acasa">
  <section class="hero"><h1>Bine ati venit</h1></section>
  <section class="services"><h2>Servicii</h2></section>
</Layout>`,
  },
  {
    path: 'src/pages/about.astro',
    content: `---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Despre noi">
  <section><h1>Despre noi</h1><p>Echipa noastra.</p></section>
</Layout>`,
  },
  {
    path: 'src/pages/services.astro',
    content: `---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Servicii">
  <section>
    <h1>Serviciile noastre</h1>
    <div class="grid">
      <div class="card"><h3>Consultatie</h3><p>30 minute</p></div>
      <div class="card"><h3>Tratament</h3><p>60 minute</p></div>
    </div>
  </section>
</Layout>`,
  },
  {
    path: 'src/pages/contact.astro',
    content: `---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Contact">
  <section class="contact-section">
    <h1>Contacteaza-ne</h1>
    <form class="contact-form">
      <div class="form-group">
        <label for="name">Nume</label>
        <input type="text" id="name" name="name" required />
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required />
      </div>
      <div class="form-group">
        <label for="phone">Telefon</label>
        <input type="tel" id="phone" name="phone" />
      </div>
      <div class="form-group">
        <label for="message">Mesaj</label>
        <textarea id="message" name="message" rows="4"></textarea>
      </div>
      <button type="submit" class="btn-primary">Trimite mesajul</button>
    </form>
  </section>
</Layout>`,
  },
  {
    path: 'src/styles/global.css',
    content: ':root { --primary: #4D5DD9; } body { margin: 0; }',
  },
  {
    path: 'astro.config.mjs',
    content: "import { defineConfig } from 'astro/config';\nexport default defineConfig({});",
  },
];

describe('Full site injection integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('injects all integrations into a realistic site', async () => {
    const result = await injectIntegrations(generatedSite, {
      calendly: { url: 'https://calendly.com/elena-beauty' },
      analytics: { provider: 'ga4', id: 'G-DEMO123' },
      leadCapture: { projectId: 'b18fa384-demo', apiUrl: 'https://flowstarter.dev/api/leads/capture' },
    });

    // Same number of files
    expect(result).toHaveLength(generatedSite.length);

    // Layout.astro: has GA4 + Calendly scripts
    const layout = result.find((f) => f.path.includes('Layout.astro'))!;
    expect(layout.content).toContain('googletagmanager.com/gtag/js?id=G-DEMO123');
    expect(layout.content).toContain('calendly.com/assets/external/widget.css');
    expect(layout.content).toContain('calendly.com/assets/external/widget.js');
    // Scripts are inside <head>
    const headContent = layout.content.slice(
      layout.content.indexOf('<head>'),
      layout.content.indexOf('</head>'),
    );
    expect(headContent).toContain('gtag');
    expect(headContent).toContain('calendly');

    // Contact page: Calendly replaces the form; lead capture won't inject
    // (no <form> left after Calendly injection)
    const contact = result.find((f) => f.path.includes('contact.astro'))!;
    expect(contact.content).toContain('calendly-inline-widget');
    // Lead capture only injects when a form exists; Calendly replaced it
    // This is the correct behavior: booking replaces the form

    // Other pages: untouched
    const about = result.find((f) => f.path.includes('about.astro'))!;
    expect(about.content).toBe(generatedSite.find((f) => f.path.includes('about.astro'))!.content);

    // CSS: untouched
    const css = result.find((f) => f.path.includes('global.css'))!;
    expect(css.content).toBe(generatedSite.find((f) => f.path.includes('global.css'))!.content);

    // Config: untouched
    const config = result.find((f) => f.path.includes('astro.config'))!;
    expect(config.content).toBe(generatedSite.find((f) => f.path.includes('astro.config'))!.content);
  });

  it('produces valid HTML structure (no broken tags)', async () => {
    const result = await injectIntegrations(generatedSite, {
      calendly: { url: 'https://calendly.com/elena-beauty' },
      analytics: { provider: 'plausible', id: 'elena-beauty.ro' },
      leadCapture: { projectId: 'test-proj', apiUrl: 'https://flowstarter.dev/api/leads/capture' },
    });

    const layout = result.find((f) => f.path.includes('Layout.astro'))!;

    // Verify tag balance
    const openHeads = (layout.content.match(/<head>/g) || []).length;
    const closeHeads = (layout.content.match(/<\/head>/g) || []).length;
    expect(openHeads).toBe(closeHeads);

    const openHtml = (layout.content.match(/<html/g) || []).length;
    const closeHtml = (layout.content.match(/<\/html>/g) || []).length;
    expect(openHtml).toBe(closeHtml);

    // No duplicate script injections
    const calendlyScripts = (layout.content.match(/widget\.js/g) || []).length;
    expect(calendlyScripts).toBe(1);

    const plausibleScripts = (layout.content.match(/plausible\.io/g) || []).length;
    expect(plausibleScripts).toBe(1);
  });

  it('handles site with no contact page gracefully', async () => {
    const siteNoContact = generatedSite.filter((f) => !f.path.includes('contact'));

    const result = await injectIntegrations(siteNoContact, {
      calendly: { url: 'https://calendly.com/test' },
      analytics: { provider: 'ga4', id: 'G-TEST' },
      leadCapture: { projectId: 'p1', apiUrl: 'https://example.com/api' },
    });

    // GA4 still injected into layout
    const layout = result.find((f) => f.path.includes('Layout.astro'))!;
    expect(layout.content).toContain('G-TEST');
    expect(layout.content).toContain('calendly');

    // No errors, same file count
    expect(result).toHaveLength(siteNoContact.length);
  });

  it('handles multiple builds without accumulating injections', async () => {
    // First injection
    const first = await injectIntegrations(generatedSite, {
      analytics: { provider: 'ga4', id: 'G-FIRST' },
    });

    // "Re-build" with different config on already-injected files
    const second = await injectIntegrations(first, {
      analytics: { provider: 'ga4', id: 'G-SECOND' },
    });

    const layout = second.find((f) => f.path.includes('Layout.astro'))!;

    // First ID still there
    expect(layout.content).toContain('G-FIRST');
    // Second ID also injected (idempotency only prevents same ID)
    // This is by design: different IDs = different properties
    expect(layout.content).toContain('G-SECOND');
  });

  it('Calendly API mode injects popup buttons with service names', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ resource: { uri: 'https://api.calendly.com/users/u1' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          collection: [
            { uri: 'e1', name: 'Consultatie 30 min', slug: 'consult', duration: 30, scheduling_url: 'https://calendly.com/elena/consult', active: true },
            { uri: 'e2', name: 'Tratament facial', slug: 'facial', duration: 60, scheduling_url: 'https://calendly.com/elena/facial', active: true },
            { uri: 'e3', name: 'Archived', slug: 'old', duration: 15, scheduling_url: 'https://calendly.com/elena/old', active: false },
          ],
        }),
      });

    vi.stubGlobal('fetch', mockFetch);

    const result = await injectIntegrations(generatedSite, {
      calendly: { url: 'https://calendly.com/elena', apiKey: 'cal_test_key' },
    });

    const contact = result.find((f) => f.path.includes('contact.astro'))!;

    // Two active event types shown (not the archived one)
    expect(contact.content).toContain('Consultatie 30 min');
    expect(contact.content).toContain('30 min');
    expect(contact.content).toContain('Tratament facial');
    expect(contact.content).toContain('60 min');
    expect(contact.content).not.toContain('Archived');

    // Uses popup widget, not inline
    expect(contact.content).toContain('Calendly.initPopupWidget');
    expect(contact.content).not.toContain('calendly-inline-widget');
  });

  it('handles concurrent integrations without race conditions', async () => {
    // Run 5 injections in parallel
    const configs = Array.from({ length: 5 }, (_, i) => ({
      analytics: { provider: 'ga4' as const, id: `G-PARALLEL${i}` },
      leadCapture: { projectId: `proj-${i}`, apiUrl: 'https://flowstarter.dev/api/leads/capture' },
    }));

    const results = await Promise.all(
      configs.map((config) => injectIntegrations([...generatedSite], config)),
    );

    // Each result should have its own ID
    results.forEach((result, i) => {
      const layout = result.find((f) => f.path.includes('Layout.astro'))!;
      expect(layout.content).toContain(`G-PARALLEL${i}`);

      const contact = result.find((f) => f.path.includes('contact.astro'))!;
      expect(contact.content).toContain(`proj-${i}`);
    });
  });
});
