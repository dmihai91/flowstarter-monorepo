import { describe, expect, it } from 'vitest';
import {
  injectCalComIntoScaffoldFiles,
  injectCalComPreviewDemoIntoScaffoldFiles,
  resolveTenantCalComUrl,
  isValidCalComInput,
} from '../cal-com';

describe('resolveTenantCalComUrl', () => {
  it('normalizes a dedicated Cal.com URL onto https://cal.com/…', () => {
    expect(
      resolveTenantCalComUrl({ calComUrl: 'cal.com/acme/intro' })
    ).toBe('https://cal.com/acme/intro');
  });

  it('falls back to customIntegrations when dedicated field is empty', () => {
    expect(
      resolveTenantCalComUrl({
        calComUrl: '',
        customIntegrations: 'we use https://app.cal.com/studio/30min',
      })
    ).toBe('https://cal.com/studio/30min');
  });

  it('returns null for non-Cal hosts', () => {
    expect(
      resolveTenantCalComUrl({ calComUrl: 'https://calendly.com/acme' })
    ).toBeNull();
  });
});

describe('isValidCalComInput', () => {
  it('allows empty and Cal.com links', () => {
    expect(isValidCalComInput('')).toBe(true);
    expect(isValidCalComInput('acme/intro')).toBe(true);
    expect(isValidCalComInput('https://calendly.com/x')).toBe(false);
  });
});

describe('injectCalComPreviewDemoIntoScaffoldFiles', () => {
  it('injects a blurred demo without loading cal.com', () => {
    const files = [
      {
        path: 'src/pages/book.astro',
        content:
          '<main><div class="book-page__calendar"><iframe src="https://calendly.com/x"></iframe></div></main>',
      },
    ];
    const out = injectCalComPreviewDemoIntoScaffoldFiles(files);
    expect(out[0]!.content).toContain('data-flowstarter-cal-preview="true"');
    expect(out[0]!.content).toContain('filter:blur');
    expect(out[0]!.content).not.toContain('cal.com/');
    expect(out[0]!.content).not.toContain('data-flowstarter-cal-embed');
  });
});

describe('injectCalComIntoScaffoldFiles', () => {
  it('injects a live embed for the full site', () => {
    const files = [
      {
        path: 'src/pages/book.astro',
        content:
          '<main><div class="book-page__calendar"><iframe src="https://calendly.com/x"></iframe></div></main>',
      },
    ];
    const out = injectCalComIntoScaffoldFiles(files, 'https://cal.com/acme/intro');
    expect(out[0]!.content).toContain('data-flowstarter-cal-embed="true"');
    expect(out[0]!.content).toContain('cal.com/acme/intro/embed');
  });

  it('upgrades a preview demo to the live embed', () => {
    const previewed = injectCalComPreviewDemoIntoScaffoldFiles([
      {
        path: 'src/pages/book.astro',
        content:
          '<main><div class="book-page__calendar"><iframe src="https://calendly.com/x"></iframe></div></main>',
      },
    ]);
    const live = injectCalComIntoScaffoldFiles(
      previewed,
      'https://cal.com/acme/intro'
    );
    expect(live[0]!.content).toContain('data-flowstarter-cal-embed="true"');
    expect(live[0]!.content).not.toContain('data-flowstarter-cal-preview');
  });
});
