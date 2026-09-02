import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  applyIntegrationsToWorkspace,
  injectCalCom,
  injectCalComPreviewDemo,
  injectIntegrations,
  normalizeCalLink,
  type FileMap,
} from '../src/integrations';

const TEMPLATES_DIR = join(__dirname, '../../../apps/flowstarter-templates');

function readTemplateFile(template: string, rel: string): string {
  return readFileSync(join(TEMPLATES_DIR, template, rel), 'utf8');
}

/** Every base template ships one of these — see workspace.ts's BASE_TEMPLATES. */
const ALL_TEMPLATES = [
  'wellness-therapy',
  'professional-services',
  'local-trade',
  'creative-portfolio',
  'dorin-portfolio',
];

describe('normalizeCalLink', () => {
  it('passes through a bare handle', () => {
    expect(normalizeCalLink('yourname')).toBe('yourname');
  });

  it('passes through a handle/event-type path', () => {
    expect(normalizeCalLink('yourname/30min')).toBe('yourname/30min');
  });

  it('strips the cal.com host', () => {
    expect(normalizeCalLink('cal.com/yourname')).toBe('yourname');
  });

  it('strips scheme + host for a full https URL', () => {
    expect(normalizeCalLink('https://cal.com/yourname/30min')).toBe('yourname/30min');
  });

  it('strips the app.cal.com host', () => {
    expect(normalizeCalLink('https://app.cal.com/yourname')).toBe('yourname');
  });

  it('drops query string, fragment and trailing slash', () => {
    expect(normalizeCalLink('https://cal.com/yourname/30min/?x=1#foo')).toBe('yourname/30min');
  });

  it('is null for empty / whitespace input', () => {
    expect(normalizeCalLink('')).toBeNull();
    expect(normalizeCalLink('   ')).toBeNull();
    expect(normalizeCalLink(undefined)).toBeNull();
    expect(normalizeCalLink(null)).toBeNull();
  });

  it('refuses a non-Cal.com host (this injector is Cal.com-only)', () => {
    expect(normalizeCalLink('https://calendly.com/yourname')).toBeNull();
    expect(normalizeCalLink('acme-studio.com/booking')).toBeNull();
  });
});

describe('injectCalCom — synthetic fixture (book-page__calendar placeholder shape)', () => {
  const placeholderFile = [
    '<main class="book-page">',
    '  <div class="book-page__calendar">',
    '    <!-- Replace the src below with your Calendly or Cal.com embed URL -->',
    '    <iframe',
    '      src="https://calendly.com/your-username/discovery-call"',
    '      width="100%"',
    '      height="700"',
    '      frameborder="0"',
    '      title="Book a discovery call"',
    '      loading="lazy"',
    '    ></iframe>',
    '  </div>',
    '</main>',
  ].join('\n');

  it('replaces the placeholder iframe src in place, keeping the container class', () => {
    const files: FileMap = { 'src/pages/book.astro': placeholderFile };
    const out = injectCalCom(files, 'acme/intro');
    const page = out['src/pages/book.astro']!;
    expect(page).toContain('class="book-page__calendar"');
    expect(page).toContain('src="https://cal.com/acme/intro/embed?layout=month_view&theme=light"');
    expect(page).not.toContain('calendly.com');
    expect(page).toContain('data-flowstarter-cal-embed="true"');
  });

  it('does not mutate the input map (pure function)', () => {
    const files: FileMap = { 'src/pages/book.astro': placeholderFile };
    const out = injectCalCom(files, 'acme/intro');
    expect(files['src/pages/book.astro']).toBe(placeholderFile);
    expect(out).not.toBe(files);
  });

  it('is a no-op for an unrecognized (non-Cal.com) URL', () => {
    const files: FileMap = { 'src/pages/book.astro': placeholderFile };
    const out = injectCalCom(files, 'https://calendly.com/your-username/discovery-call');
    expect(out).toEqual(files);
  });

  it('is a no-op for an empty or whitespace-only URL', () => {
    const files: FileMap = { 'src/pages/book.astro': placeholderFile };
    expect(injectCalCom(files, '')).toEqual(files);
    expect(injectCalCom(files, '   ')).toEqual(files);
    expect(injectCalCom(files, undefined)).toEqual(files);
  });

  it('is a no-op when neither book.astro nor contact.astro is present', () => {
    const files: FileMap = { 'src/pages/index.astro': '<main></main>' };
    const out = injectCalCom(files, 'acme/intro');
    expect(out).toEqual(files);
  });

  it('prefers book.astro over contact.astro when both exist', () => {
    const files: FileMap = {
      'src/pages/book.astro': placeholderFile,
      'src/pages/contact.astro': '<main class="contact"></main>',
    };
    const out = injectCalCom(files, 'acme/intro');
    expect(out['src/pages/book.astro']).toContain('cal.com/acme/intro');
    expect(out['src/pages/contact.astro']).toBe(files['src/pages/contact.astro']);
  });

  it('falls back to contact.astro when there is no book.astro', () => {
    const files: FileMap = {
      'src/pages/contact.astro': '<main class="contact-page"><h1>Contact</h1></main>',
    };
    const out = injectCalCom(files, 'acme/intro');
    const page = out['src/pages/contact.astro']!;
    expect(page).toContain('<h1>Contact</h1>');
    expect(page).toContain('cal.com/acme/intro');
    expect(page).toContain('</main>');
  });

  it('is idempotent: re-running with a new URL updates the same block, not a second one', () => {
    const files: FileMap = { 'src/pages/book.astro': placeholderFile };
    const first = injectCalCom(files, 'acme/intro');
    const second = injectCalCom(first, 'acme/other-event');

    const page = second['src/pages/book.astro']!;
    expect(page.match(/<iframe/g)).toHaveLength(1);
    expect(page.match(/data-flowstarter-cal-embed="true"/g)).toHaveLength(1);
    expect(page).toContain('cal.com/acme/other-event/embed');
    expect(page).not.toContain('acme/intro/embed');
  });

  it('re-running with the same URL is a true no-op (stable content)', () => {
    const files: FileMap = { 'src/pages/book.astro': placeholderFile };
    const first = injectCalCom(files, 'acme/intro');
    const second = injectCalCom(first, 'acme/intro');
    expect(second['src/pages/book.astro']).toBe(first['src/pages/book.astro']);
  });
});

describe('injectCalCom — no existing calendar placeholder (wellness-therapy shape)', () => {
  it('appends a self-contained embed before </main> without touching existing content', () => {
    const before = [
      '<main class="book-page">',
      '  <div class="book-page__copy"><h1>Book a free intro call</h1></div>',
      '  <aside class="book-page__panel">',
      '    <a class="book-page__panel-btn" href="mailto:hello@example.com">Email to arrange a call</a>',
      '  </aside>',
      '</main>',
      '<Footer />',
    ].join('\n');
    const files: FileMap = { 'src/pages/book.astro': before };
    const out = injectCalCom(files, 'acme/intro');
    const page = out['src/pages/book.astro']!;

    // Nothing pre-existing was removed.
    expect(page).toContain('Book a free intro call');
    expect(page).toContain('mailto:hello@example.com');
    // New embed was added, and only once, before the closing </main>.
    expect(page).toContain('data-flowstarter-cal-embed="true"');
    expect(page).toContain('cal.com/acme/intro/embed');
    expect(page.indexOf('data-flowstarter-cal-embed')).toBeLessThan(page.indexOf('</main>'));
    expect(page.indexOf('</main>')).toBeLessThan(page.indexOf('<Footer'));
  });

  it('is idempotent for the appended shape too', () => {
    const before = '<main class="book-page"><h1>Book</h1></main>';
    const first = injectCalCom({ 'src/pages/book.astro': before }, 'acme/intro');
    const second = injectCalCom(first, 'acme/other');
    const page = second['src/pages/book.astro']!;
    expect(page.match(/<iframe/g)).toHaveLength(1);
    expect(page).toContain('cal.com/acme/other/embed');
  });
});

describe('injectCalCom — real template fixtures under apps/flowstarter-templates', () => {
  for (const template of ALL_TEMPLATES) {
    it(`injects cleanly into ${template}'s book.astro`, () => {
      const before = readTemplateFile(template, 'src/pages/book.astro');
      const files: FileMap = { 'src/pages/book.astro': before };
      const out = injectCalCom(files, 'flowstarter-demo/intro-call');
      const page = out['src/pages/book.astro']!;

      expect(page).not.toBe(before);
      expect(page).toContain('cal.com/flowstarter-demo/intro-call/embed');
      expect(page.match(/<iframe/g)?.length).toBe(1);
      // The template's structural landmarks survive the injection.
      expect(page).toContain('<Layout');
      expect(page).toContain('<Footer />');

      // Re-running is idempotent for every real template shape.
      const again = injectCalCom(out, 'flowstarter-demo/intro-call');
      expect(again[targetKey(again)]).toBe(page);
    });
  }
});

function targetKey(files: FileMap): string {
  return 'src/pages/book.astro' in files ? 'src/pages/book.astro' : 'src/pages/contact.astro';
}

describe('injectCalComPreviewDemo — blurred funnel tease', () => {
  it('replaces the placeholder with a blurred demo that never loads cal.com', () => {
    const files: FileMap = {
      'src/pages/book.astro':
        '<main><div class="book-page__calendar"><iframe src="https://calendly.com/x"></iframe></div></main>',
    };
    const out = injectCalComPreviewDemo(files);
    const page = out['src/pages/book.astro']!;
    expect(page).toContain('data-flowstarter-cal-preview="true"');
    expect(page).toContain('filter:blur');
    expect(page).toContain('Unlocks on the full site');
    expect(page).not.toContain('https://cal.com/');
    expect(page).not.toContain('data-flowstarter-cal-embed');
  });

  it('is upgraded to a live embed by injectCalCom on the full site', () => {
    const preview = injectCalComPreviewDemo({
      'src/pages/book.astro':
        '<main><div class="book-page__calendar"><iframe src="https://calendly.com/x"></iframe></div></main>',
    });
    const live = injectCalCom(preview, 'acme/intro');
    const page = live['src/pages/book.astro']!;
    expect(page).toContain('data-flowstarter-cal-embed="true"');
    expect(page).toContain('cal.com/acme/intro/embed');
    expect(page).not.toContain('data-flowstarter-cal-preview');
  });
});

describe('injectIntegrations', () => {
  it('delegates to injectCalCom for a cal.com booking config', () => {
    const files: FileMap = {
      'src/pages/book.astro': '<main class="book-page"><h1>Book</h1></main>',
    };
    const out = injectIntegrations(files, { booking: { provider: 'cal.com', url: 'acme/intro' } });
    expect(out['src/pages/book.astro']).toContain('cal.com/acme/intro/embed');
  });

  it('is a no-op with no booking config', () => {
    const files: FileMap = {
      'src/pages/book.astro': '<main class="book-page"><h1>Book</h1></main>',
    };
    expect(injectIntegrations(files, {})).toEqual(files);
  });

  it('is a no-op with an empty booking url', () => {
    const files: FileMap = {
      'src/pages/book.astro': '<main class="book-page"><h1>Book</h1></main>',
    };
    expect(injectIntegrations(files, { booking: { provider: 'cal.com', url: '' } })).toEqual(
      files
    );
  });
});

describe('built HTML output', () => {
  it('upgrades a built booking page, so packaging a dist/ still wires the live embed', () => {
    const files: FileMap = {
      'index.html': '<main><h1>Home</h1></main>',
      'book/index.html':
        '<main><div class="book-page__calendar"><iframe src="https://calendly.com/x"></iframe></div></main>',
    };
    const out = injectCalCom(files, 'https://cal.com/acme/intro');

    expect(out['book/index.html']).toContain('cal.com/acme/intro/embed');
    // Only the booking page is touched; the home page is left alone.
    expect(out['index.html']).toBe(files['index.html']);
  });

  it('replaces the blurred preview demo in built output rather than stacking a second calendar', () => {
    const previewed = injectCalComPreviewDemo({
      'contact/index.html':
        '<main><div class="book-page__calendar">placeholder</div></main>',
    });
    expect(previewed['contact/index.html']).toContain(
      'data-flowstarter-cal-preview="true"'
    );

    const live = injectCalCom(previewed, 'acme/intro');
    expect(live['contact/index.html']).toContain('data-flowstarter-cal-embed="true"');
    expect(live['contact/index.html']).not.toContain('data-flowstarter-cal-preview');
    expect(
      (live['contact/index.html']!.match(/<iframe/g) ?? []).length
    ).toBe(1);
  });

  it('prefers the Astro source over built HTML when both are present', () => {
    const out = injectCalCom(
      {
        'src/pages/book.astro': '<main><h1>Book</h1></main>',
        'book/index.html': '<main><h1>Book</h1></main>',
      },
      'acme/intro'
    );
    expect(out['src/pages/book.astro']).toContain('cal.com/acme/intro/embed');
    expect(out['book/index.html']).not.toContain('cal.com');
  });
});
