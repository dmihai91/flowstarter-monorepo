/**
 * Integration tests: Calendly booking flow
 *
 * Verifies that:
 * 1. Generated site embeds valid Calendly booking URLs
 * 2. API mode fetches real event types and creates correct popup buttons
 * 3. Booking URLs are properly formed for Calendly's widget to handle
 * 4. The end-to-end flow: operator config → site injection → visitor booking
 *
 * Note: Actual booking creation happens on Calendly's side via their widget.
 * We test that our injection produces valid embeds that Calendly's JS will handle.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { injectCalendly, fetchCalendlyEventTypes } from '../calendly';
import { injectIntegrations } from '../index';

const contactPage = {
  path: 'src/pages/contact.astro',
  content: `<Layout>
  <section>
    <h1>Contact</h1>
    <form>
      <input name="name" required />
      <input name="email" type="email" required />
      <input name="phone" type="tel" />
      <textarea name="message"></textarea>
      <button type="submit">Send</button>
    </form>
  </section>
</Layout>`,
};

const layoutPage = {
  path: 'src/layouts/Layout.astro',
  content: '<html><head><title>Test</title></head><body><slot /></body></html>',
};

describe('Calendly booking integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Simple embed mode', () => {
    it('produces a valid Calendly inline widget with correct URL', () => {
      const result = injectCalendly([layoutPage, contactPage], {
        url: 'https://calendly.com/elena-beauty/consultatie',
      });

      const contact = result.find((f) => f.path.includes('contact'))!;

      // Widget div with correct data-url
      expect(contact.content).toContain('class="calendly-inline-widget"');
      expect(contact.content).toContain('data-url="https://calendly.com/elena-beauty/consultatie"');

      // Widget has proper dimensions for usability
      expect(contact.content).toContain('min-width:320px');
      expect(contact.content).toContain('height:700px');

      // Original form is replaced (not duplicated)
      expect(contact.content).not.toContain('<form>');
      expect(contact.content).not.toContain('type="submit"');
    });

    it('loads Calendly widget assets in layout head', () => {
      const result = injectCalendly([layoutPage, contactPage], {
        url: 'https://calendly.com/elena-beauty',
      });

      const layout = result.find((f) => f.path.includes('Layout'))!;

      // CSS loaded for styling
      expect(layout.content).toContain('assets.calendly.com/assets/external/widget.css');

      // JS loaded async for widget initialization
      expect(layout.content).toContain('assets.calendly.com/assets/external/widget.js');
      expect(layout.content).toContain('async');
    });

    it('preserves the scheduling page path in the URL', () => {
      const urls = [
        'https://calendly.com/elena-beauty',
        'https://calendly.com/elena-beauty/30min',
        'https://calendly.com/elena-beauty/consultatie-initiala',
      ];

      urls.forEach((url) => {
        const result = injectCalendly([{ ...contactPage }], { url });
        const contact = result[0];
        expect(contact.content).toContain(`data-url="${url}"`);
      });
    });
  });

  describe('API mode (event types → popup buttons)', () => {
    it('creates individual booking buttons for each active event type', () => {
      const eventTypes = [
        {
          uri: 'https://api.calendly.com/event_types/et1',
          name: 'Consultatie initiala',
          slug: 'consultatie',
          duration: 30,
          scheduling_url: 'https://calendly.com/elena/consultatie',
          active: true,
        },
        {
          uri: 'https://api.calendly.com/event_types/et2',
          name: 'Tratament facial complet',
          slug: 'facial',
          duration: 60,
          scheduling_url: 'https://calendly.com/elena/facial',
          active: true,
        },
        {
          uri: 'https://api.calendly.com/event_types/et3',
          name: 'Masaj relaxare',
          slug: 'masaj',
          duration: 90,
          scheduling_url: 'https://calendly.com/elena/masaj',
          active: true,
        },
      ];

      const result = injectCalendly([contactPage], {
        url: 'https://calendly.com/elena',
        eventTypes,
      });

      const contact = result[0];

      // Each event type gets its own button
      expect(contact.content).toContain('Consultatie initiala');
      expect(contact.content).toContain('30 min');
      expect(contact.content).toContain('Tratament facial complet');
      expect(contact.content).toContain('60 min');
      expect(contact.content).toContain('Masaj relaxare');
      expect(contact.content).toContain('90 min');

      // Each button triggers Calendly popup with correct URL
      expect(contact.content).toContain("url: 'https://calendly.com/elena/consultatie'");
      expect(contact.content).toContain("url: 'https://calendly.com/elena/facial'");
      expect(contact.content).toContain("url: 'https://calendly.com/elena/masaj'");

      // Uses popup widget (not inline)
      expect(contact.content).toContain('Calendly.initPopupWidget');
      expect(contact.content).not.toContain('calendly-inline-widget');

      // Has "Book an Appointment" heading
      expect(contact.content).toContain('Book an Appointment');
    });

    it('fetches event types from Calendly API and filters inactive ones', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            resource: { uri: 'https://api.calendly.com/users/elena123' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            collection: [
              { uri: 'e1', name: 'Active Event', slug: 'active', duration: 30, scheduling_url: 'https://calendly.com/elena/active', active: true },
              { uri: 'e2', name: 'Paused Event', slug: 'paused', duration: 45, scheduling_url: 'https://calendly.com/elena/paused', active: false },
              { uri: 'e3', name: 'Another Active', slug: 'another', duration: 60, scheduling_url: 'https://calendly.com/elena/another', active: true },
            ],
          }),
        });

      vi.stubGlobal('fetch', mockFetch);

      const eventTypes = await fetchCalendlyEventTypes('cal_test_api_key');

      // Only active events returned
      expect(eventTypes).toHaveLength(2);
      expect(eventTypes[0].name).toBe('Active Event');
      expect(eventTypes[1].name).toBe('Another Active');

      // API called with correct auth
      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer cal_test_api_key');
    });

    it('full flow: API key → fetch events → inject popup buttons', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            resource: { uri: 'https://api.calendly.com/users/u1' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            collection: [
              { uri: 'e1', name: 'Discovery Call', slug: 'discovery', duration: 45, scheduling_url: 'https://calendly.com/elena/discovery', active: true },
            ],
          }),
        });

      vi.stubGlobal('fetch', mockFetch);

      const result = await injectIntegrations([layoutPage, contactPage], {
        calendly: {
          url: 'https://calendly.com/elena',
          apiKey: 'cal_live_test_key_123',
        },
      });

      const contact = result.find((f) => f.path.includes('contact'))!;

      // API was called to fetch event types
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Popup button generated for the discovered event
      expect(contact.content).toContain('Discovery Call');
      expect(contact.content).toContain('45 min');
      expect(contact.content).toContain('Calendly.initPopupWidget');
    });
  });

  describe('Booking URL validation', () => {
    it('rejects non-Calendly URLs to prevent phishing', () => {
      const result = injectCalendly([contactPage], {
        url: 'https://evil-calendly.com/phishing',
      });

      const contact = result[0];
      expect(contact.content).toContain('Invalid Calendly URL');
      expect(contact.content).not.toContain('evil-calendly');
    });

    it('rejects HTTP (non-HTTPS) Calendly URLs', () => {
      const result = injectCalendly([contactPage], {
        url: 'http://calendly.com/elena',
      });

      const contact = result[0];
      expect(contact.content).toContain('Invalid Calendly URL');
    });

    it('accepts valid Calendly subdomains', () => {
      const result = injectCalendly([contactPage], {
        url: 'https://calendly.com/elena-beauty/consultation',
      });

      const contact = result[0];
      expect(contact.content).toContain('calendly-inline-widget');
      expect(contact.content).not.toContain('Invalid');
    });
  });

  describe('End-to-end: operator → site → visitor', () => {
    it('simulates full flow: config saved → build injects → form replaced', async () => {
      // Step 1: Operator saves Calendly config (simulated)
      const operatorConfig = {
        calendlyUrl: 'https://calendly.com/elena-beauty',
        calendlyApiKey: undefined, // Simple mode, no API key
      };

      // Step 2: Build pipeline reads config and injects
      const siteFiles = [layoutPage, contactPage];
      const injectedFiles = await injectIntegrations(siteFiles, {
        calendly: { url: operatorConfig.calendlyUrl },
      });

      // Step 3: Verify what the visitor sees
      const contact = injectedFiles.find((f) => f.path.includes('contact'))!;
      const layout = injectedFiles.find((f) => f.path.includes('Layout'))!;

      // Visitor sees Calendly widget instead of form
      expect(contact.content).toContain('calendly-inline-widget');
      expect(contact.content).not.toContain('<form>');

      // Widget scripts loaded
      expect(layout.content).toContain('widget.js');
      expect(layout.content).toContain('widget.css');

      // When visitor clicks a time slot in the widget:
      // → Calendly handles the entire booking flow
      // → Booking is created on Calendly's platform
      // → Operator gets notified via Calendly email/webhook
      // → We can fetch it via GET /api/calendly/events
    });

    it('simulates API mode: operator has API key → visitors see service buttons', async () => {
      // Mock Calendly API for event type fetching
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            resource: { uri: 'https://api.calendly.com/users/u1' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            collection: [
              { uri: 'e1', name: 'Quick Consultation', slug: 'quick', duration: 15, scheduling_url: 'https://calendly.com/elena/quick', active: true },
              { uri: 'e2', name: 'Full Treatment', slug: 'full', duration: 60, scheduling_url: 'https://calendly.com/elena/full', active: true },
            ],
          }),
        }),
      );

      const injectedFiles = await injectIntegrations([layoutPage, contactPage], {
        calendly: {
          url: 'https://calendly.com/elena',
          apiKey: 'cal_live_operator_key',
        },
      });

      const contact = injectedFiles.find((f) => f.path.includes('contact'))!;

      // Visitor sees per-service booking buttons
      expect(contact.content).toContain('Quick Consultation');
      expect(contact.content).toContain('15 min');
      expect(contact.content).toContain('Full Treatment');
      expect(contact.content).toContain('60 min');

      // Each button opens Calendly popup for that specific service
      expect(contact.content).toContain("url: 'https://calendly.com/elena/quick'");
      expect(contact.content).toContain("url: 'https://calendly.com/elena/full'");
    });
  });
});
