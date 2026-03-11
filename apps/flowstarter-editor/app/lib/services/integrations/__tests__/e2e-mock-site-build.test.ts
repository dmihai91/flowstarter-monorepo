/**
 * E2E Integration Test: Build a site with mock data and verify integrations
 *
 * Simulates the full pipeline:
 * 1. Template generates site files (realistic coach-pro output)
 * 2. Mock Supabase project config has Calendly + GA4 settings
 * 3. Mock Vault returns Calendly API key
 * 4. Mock Calendly API returns event types
 * 5. injectIntegrations runs on the generated files
 * 6. Verify final HTML has correct Calendly widgets, GA4 tags, lead capture
 *
 * This tests the EXACT same flow as api.build.ts lines 380-415.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { injectIntegrations } from '../index';

// --- Mock Data: Supabase project config ---

const MOCK_PROJECT_ID = 'b18fa384-7c2f-4a1e-9d5b-3e8f12c45678';

const mockProjectConfig = {
  id: MOCK_PROJECT_ID,
  name: 'Elena Beauty Studio',
  domain: 'elena-beauty.flowstarter.site',
  calendly_url: 'https://calendly.com/elena-beauty',
  calendly_api_key_id: 'vault-secret-cal-001',
  ga_property_id: 'G-ELENA2026',
};

// --- Mock Data: Vault secrets ---

const MOCK_CALENDLY_API_KEY = 'cal_live_eLn4B3auTy_test_key_2026';

// --- Mock Data: Calendly API responses ---

const mockCalendlyUser = {
  resource: {
    uri: 'https://api.calendly.com/users/elena-beauty-usr-001',
    name: 'Elena Popescu',
    email: 'elena@elenabeauty.ro',
    scheduling_url: 'https://calendly.com/elena-beauty',
  },
};

const mockCalendlyEventTypes = {
  collection: [
    {
      uri: 'https://api.calendly.com/event_types/et-consult',
      name: 'Consultatie gratuita',
      slug: 'consultatie',
      duration: 15,
      scheduling_url: 'https://calendly.com/elena-beauty/consultatie',
      description_plain: 'Consultatie initiala gratuita',
      active: true,
    },
    {
      uri: 'https://api.calendly.com/event_types/et-facial',
      name: 'Tratament facial premium',
      slug: 'tratament-facial',
      duration: 60,
      scheduling_url: 'https://calendly.com/elena-beauty/tratament-facial',
      description_plain: 'Tratament complet cu produse premium',
      active: true,
    },
    {
      uri: 'https://api.calendly.com/event_types/et-masaj',
      name: 'Masaj de relaxare',
      slug: 'masaj-relaxare',
      duration: 90,
      scheduling_url: 'https://calendly.com/elena-beauty/masaj-relaxare',
      description_plain: 'Masaj complet corp',
      active: true,
    },
    {
      uri: 'https://api.calendly.com/event_types/et-old',
      name: 'Promo vara 2025 (expirat)',
      slug: 'promo-vara',
      duration: 30,
      scheduling_url: 'https://calendly.com/elena-beauty/promo-vara',
      active: false, // inactive, should be filtered
    },
  ],
};

// --- Mock Data: Generated site files (realistic template output) ---

const generatedSiteFiles = [
  {
    path: 'src/layouts/Layout.astro',
    content: `---
interface Props { title: string; description?: string; }
const { title, description = 'Elena Beauty Studio' } = Astro.props;
---
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} | Elena Beauty Studio</title>
  <link rel="stylesheet" href="/styles/global.css" />
</head>
<body class="bg-cream text-gray-900">
  <nav class="fixed top-0 w-full bg-white/90 backdrop-blur-sm z-50">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="/" class="text-2xl font-bold text-primary">Elena Beauty</a>
      <div class="hidden md:flex gap-8">
        <a href="/">Acasa</a>
        <a href="/servicii">Servicii</a>
        <a href="/despre">Despre noi</a>
        <a href="/contact">Contact</a>
      </div>
    </div>
  </nav>
  <main class="pt-16"><slot /></main>
  <footer class="bg-gray-900 text-gray-300 py-16">
    <div class="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8">
      <div><h3 class="text-white text-xl mb-4">Elena Beauty</h3></div>
      <div><p>Str. Victoriei 42, Bucuresti</p><p>+40 721 234 567</p></div>
    </div>
  </footer>
</body>
</html>`,
  },
  {
    path: 'src/pages/index.astro',
    content: `---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Acasa">
  <section class="h-[80vh] flex items-center">
    <h1 class="text-5xl font-bold">Frumusete naturala</h1>
    <a href="/contact" class="btn-primary">Programeaza-te</a>
  </section>
  <section class="py-20"><h2>Serviciile noastre</h2></section>
  <section class="py-20"><h2>Ce spun clientele noastre</h2></section>
</Layout>`,
  },
  {
    path: 'src/pages/servicii.astro',
    content: `---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Servicii">
  <section class="py-20">
    <h1>Serviciile noastre</h1>
    <div class="grid">
      <div><h3>Consultatie gratuita</h3><span>15 min</span></div>
      <div><h3>Tratament facial premium</h3><span>60 min</span></div>
      <div><h3>Masaj de relaxare</h3><span>90 min</span></div>
    </div>
  </section>
</Layout>`,
  },
  {
    path: 'src/pages/despre.astro',
    content: `---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Despre noi">
  <section class="py-20">
    <h1>Despre Elena Beauty</h1>
    <p>Cu peste 10 ani de experienta in industria frumusetii.</p>
  </section>
</Layout>`,
  },
  {
    path: 'src/pages/contact.astro',
    content: `---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Contact">
  <section class="py-20">
    <h1>Contacteaza-ne</h1>
    <div class="grid md:grid-cols-2 gap-12">
      <div>
        <h2>Trimite-ne un mesaj</h2>
        <form class="space-y-4">
          <div>
            <label for="name">Nume complet</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div>
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div>
            <label for="phone">Telefon</label>
            <input type="tel" id="phone" name="phone" />
          </div>
          <div>
            <label for="service">Serviciu dorit</label>
            <select id="service" name="service">
              <option value="">Selecteaza</option>
              <option value="consultatie">Consultatie</option>
              <option value="facial">Tratament facial</option>
              <option value="masaj">Masaj</option>
            </select>
          </div>
          <div>
            <label for="message">Mesaj</label>
            <textarea id="message" name="message" rows="4"></textarea>
          </div>
          <button type="submit" class="btn-primary">Trimite mesajul</button>
        </form>
      </div>
      <div class="space-y-8">
        <div><h3>Adresa</h3><p>Str. Victoriei 42, Bucuresti</p></div>
        <div><h3>Telefon</h3><p>+40 721 234 567</p></div>
        <div><h3>Email</h3><p>contact@elenabeauty.ro</p></div>
      </div>
    </div>
  </section>
</Layout>`,
  },
  {
    path: 'src/styles/global.css',
    content: ':root { --color-primary: #D4A574; } .btn-primary { background: var(--color-primary); }',
  },
  {
    path: 'astro.config.mjs',
    content: "import { defineConfig } from 'astro/config';\nexport default defineConfig({});",
  },
];

// --- Tests ---

describe('E2E: Build site with mock Calendly + GA4 + Lead Capture', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('Scenario 1: Full pipeline — API Calendly + GA4 + Lead Capture', async () => {
    // Mock Calendly API
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCalendlyUser) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCalendlyEventTypes) }),
    );

    // Build intConfig exactly like api.build.ts
    const intConfig: Record<string, unknown> = {};
    intConfig.calendly = { url: mockProjectConfig.calendly_url, apiKey: MOCK_CALENDLY_API_KEY };
    intConfig.analytics = { provider: 'ga4', id: mockProjectConfig.ga_property_id };
    intConfig.leadCapture = {
      projectId: MOCK_PROJECT_ID,
      apiUrl: 'https://flowstarter.dev/api/leads/capture',
    };

    const result = await injectIntegrations(generatedSiteFiles, intConfig as any);

    // --- Layout: GA4 + Calendly assets ---
    const layout = result.find((f) => f.path.includes('Layout.astro'))!;
    expect(layout.content).toContain('googletagmanager.com/gtag/js?id=G-ELENA2026');
    expect(layout.content).toContain("gtag('config','G-ELENA2026')");
    expect(layout.content).toContain('assets.calendly.com/assets/external/widget.css');
    expect(layout.content).toContain('assets.calendly.com/assets/external/widget.js');

    // Scripts inside <head>
    const head = layout.content.slice(layout.content.indexOf('<head>'), layout.content.indexOf('</head>'));
    expect(head).toContain('G-ELENA2026');
    expect(head).toContain('calendly');

    // Nav/footer preserved
    expect(layout.content).toContain('Elena Beauty');
    expect(layout.content).toContain('<nav');
    expect(layout.content).toContain('<footer');

    // --- Contact: Calendly popup buttons ---
    const contact = result.find((f) => f.path.includes('contact.astro'))!;
    expect(contact.content).toContain('Consultatie gratuita');
    expect(contact.content).toContain('15 min');
    expect(contact.content).toContain('Tratament facial premium');
    expect(contact.content).toContain('60 min');
    expect(contact.content).toContain('Masaj de relaxare');
    expect(contact.content).toContain('90 min');
    expect(contact.content).not.toContain('Promo vara 2025'); // inactive filtered
    expect(contact.content).toContain("url: 'https://calendly.com/elena-beauty/consultatie'");
    expect(contact.content).toContain("url: 'https://calendly.com/elena-beauty/tratament-facial'");
    expect(contact.content).toContain("url: 'https://calendly.com/elena-beauty/masaj-relaxare'");
    expect(contact.content).toContain('Calendly.initPopupWidget');

    // Contact info sidebar preserved
    expect(contact.content).toContain('+40 721 234 567');
    expect(contact.content).toContain('contact@elenabeauty.ro');

    // Calendly API called with correct key
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect((globalThis.fetch as any).mock.calls[0][1].headers.Authorization).toBe(`Bearer ${MOCK_CALENDLY_API_KEY}`);

    // --- Other pages untouched ---
    expect(result.find((f) => f.path.includes('index.astro'))!.content)
      .toBe(generatedSiteFiles.find((f) => f.path.includes('index.astro'))!.content);
    expect(result.find((f) => f.path.includes('servicii.astro'))!.content)
      .toBe(generatedSiteFiles.find((f) => f.path.includes('servicii.astro'))!.content);
    expect(result.find((f) => f.path.includes('despre.astro'))!.content)
      .toBe(generatedSiteFiles.find((f) => f.path.includes('despre.astro'))!.content);

    // CSS + config untouched
    expect(result.find((f) => f.path.includes('global.css'))!.content)
      .toBe(generatedSiteFiles.find((f) => f.path.includes('global.css'))!.content);
    expect(result.find((f) => f.path.includes('astro.config'))!.content)
      .toBe(generatedSiteFiles.find((f) => f.path.includes('astro.config'))!.content);

    expect(result).toHaveLength(generatedSiteFiles.length);
  });

  it('Scenario 2: Simple Calendly (no API key) + GA4', async () => {
    const result = await injectIntegrations(generatedSiteFiles, {
      calendly: { url: 'https://calendly.com/elena-beauty' },
      analytics: { provider: 'ga4', id: 'G-ELENA2026' },
      leadCapture: { projectId: MOCK_PROJECT_ID, apiUrl: 'https://flowstarter.dev/api/leads/capture' },
    });

    const contact = result.find((f) => f.path.includes('contact.astro'))!;

    // Simple inline widget (no API key)
    expect(contact.content).toContain('calendly-inline-widget');
    expect(contact.content).toContain('data-url="https://calendly.com/elena-beauty"');
    expect(contact.content).not.toContain('Calendly.initPopupWidget');

    // Form replaced by Calendly => lead capture has no form to attach to
    expect(contact.content).not.toContain('<form');

    const layout = result.find((f) => f.path.includes('Layout.astro'))!;
    expect(layout.content).toContain('G-ELENA2026');
  });

  it('Scenario 3: Only Lead Capture — form preserved with all fields', async () => {
    const result = await injectIntegrations(generatedSiteFiles, {
      leadCapture: { projectId: MOCK_PROJECT_ID, apiUrl: 'https://flowstarter.dev/api/leads/capture' },
    });

    const contact = result.find((f) => f.path.includes('contact.astro'))!;

    // Form still present with lead capture injected
    expect(contact.content).toContain('data-lead-capture');
    expect(contact.content).toContain(`value="${MOCK_PROJECT_ID}"`);
    expect(contact.content).toContain('flowstarter.dev/api/leads/capture');
    expect(contact.content).toContain("data.projectId = '" + MOCK_PROJECT_ID + "'");
    expect(contact.content).toContain('data.source = window.location.pathname');

    // Original form fields preserved
    expect(contact.content).toContain('name="name"');
    expect(contact.content).toContain('name="email"');
    expect(contact.content).toContain('name="phone"');
    expect(contact.content).toContain('name="service"');
    expect(contact.content).toContain('name="message"');
    expect(contact.content).toContain('Trimite mesajul');

    // No Calendly or GA
    const layout = result.find((f) => f.path.includes('Layout.astro'))!;
    expect(layout.content).not.toContain('calendly');
    expect(layout.content).not.toContain('gtag');
  });

  it('Scenario 4: Calendly API fails → graceful fallback to simple embed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false, status: 403,
      json: () => Promise.resolve({ message: 'Invalid API key' }),
    }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await injectIntegrations(generatedSiteFiles, {
      calendly: { url: 'https://calendly.com/elena-beauty', apiKey: 'cal_expired_key' },
      analytics: { provider: 'ga4', id: 'G-ELENA2026' },
    });

    const contact = result.find((f) => f.path.includes('contact.astro'))!;
    // Fallback: inline widget, not popup buttons
    expect(contact.content).toContain('calendly-inline-widget');
    expect(contact.content).not.toContain('Calendly.initPopupWidget');

    // GA4 still works despite Calendly failure
    const layout = result.find((f) => f.path.includes('Layout.astro'))!;
    expect(layout.content).toContain('G-ELENA2026');
  });

  it('Scenario 5: Plausible analytics + Lead Capture', async () => {
    const result = await injectIntegrations(generatedSiteFiles, {
      analytics: { provider: 'plausible', id: 'elenabeauty.ro' },
      leadCapture: { projectId: MOCK_PROJECT_ID, apiUrl: 'https://flowstarter.dev/api/leads/capture' },
    });

    const layout = result.find((f) => f.path.includes('Layout.astro'))!;
    expect(layout.content).toContain('plausible.io/js/script.js');
    expect(layout.content).toContain('data-domain="elenabeauty.ro"');
    expect(layout.content).not.toContain('googletagmanager');

    const contact = result.find((f) => f.path.includes('contact.astro'))!;
    expect(contact.content).toContain('data-lead-capture');
    expect(contact.content).toContain(MOCK_PROJECT_ID);
  });

  it('Scenario 6: All mock data values appear in correct HTML locations', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCalendlyUser) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCalendlyEventTypes) }),
    );

    const result = await injectIntegrations(generatedSiteFiles, {
      calendly: { url: mockProjectConfig.calendly_url, apiKey: MOCK_CALENDLY_API_KEY },
      analytics: { provider: 'ga4', id: mockProjectConfig.ga_property_id },
      leadCapture: { projectId: MOCK_PROJECT_ID, apiUrl: 'https://flowstarter.dev/api/leads/capture' },
    });

    const fullOutput = result.map((f) => f.content).join('\n');

    // GA measurement ID present
    expect(fullOutput).toContain(mockProjectConfig.ga_property_id);

    // Every active Calendly event type present
    for (const et of mockCalendlyEventTypes.collection.filter((e) => e.active)) {
      expect(fullOutput).toContain(et.name);
      expect(fullOutput).toContain(`${et.duration} min`);
      expect(fullOutput).toContain(et.scheduling_url);
    }

    // Inactive event excluded
    expect(fullOutput).not.toContain('Promo vara 2025');
  });

  it('Scenario 7: No integrations → site completely unchanged', async () => {
    const result = await injectIntegrations(generatedSiteFiles, {});

    for (let i = 0; i < generatedSiteFiles.length; i++) {
      expect(result[i].path).toBe(generatedSiteFiles[i].path);
      expect(result[i].content).toBe(generatedSiteFiles[i].content);
    }
  });

  it('Scenario 8: Fathom analytics variant', async () => {
    const result = await injectIntegrations(generatedSiteFiles, {
      analytics: { provider: 'fathom', id: 'FTHM_ELENA' },
    });

    const layout = result.find((f) => f.path.includes('Layout.astro'))!;
    expect(layout.content).toContain('usefathom.com/script.js');
    expect(layout.content).toContain('data-site="FTHM_ELENA"');
  });
});
