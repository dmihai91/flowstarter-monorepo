/**
 * Deterministic integration injection — no LLM involved, no template file
 * left "unfinished" for the client. Mirrors docs/INTEGRATIONS-PLAN.md's
 * `injectIntegrations(files, projectConfig)` step: pure string manipulation
 * over the generated Astro file tree, run as post-processing after content
 * personalization and before (or independent of) `astro build`.
 *
 * Every base template under apps/flowstarter-templates ships a `book.astro`
 * (or, for wellness-therapy, a booking panel on that page) with either:
 *   - a `<div class="book-page__calendar">` containing a placeholder
 *     Calendly iframe and the comment "Replace the src below with your
 *     Calendly or Cal.com embed URL", or
 *   - no calendar embed at all (a "connect your Calendly or Cal.com link
 *     here" note pointing at a mailto CTA instead).
 *
 * Preview vs full site:
 *   - `injectCalComPreviewDemo` — funnel/preview only: a blurred static
 *     calendar mock. Never loads cal.com. Marker: data-flowstarter-cal-preview.
 *   - `injectCalCom` — full site only: the live Cal.com embed. Also replaces
 *     any prior preview demo so deposit→build upgrades the tease to the wire.
 */

/** A template's file tree: relative path (posix, no leading slash) → content. */
export type FileMap = Record<string, string>;

/**
 * "Everything up to the first `</div>`", written as an unrolled loop rather
 * than `[\s\S]*?<\/div>`. The lazy form has to retry from every offset when
 * the closing tag is missing, which is quadratic in the size of the page, and
 * these run over model-written and already-built HTML.
 */
const UNTIL_DIV_CLOSE = String.raw`[^<]*(?:<(?!\/div>)[^<]*)*<\/div>`;

const MANAGED_BLOCK_RE = new RegExp(
  String.raw`<div\b[^>]*\bdata-flowstarter-cal-embed="true"[^>]*>` +
    UNTIL_DIV_CLOSE,
);
const PREVIEW_DEMO_BLOCK_RE = new RegExp(
  String.raw`<div\b[^>]*\bdata-flowstarter-cal-preview="true"[^>]*>` +
    UNTIL_DIV_CLOSE,
);
const PLACEHOLDER_CALENDAR_RE = new RegExp(
  String.raw`<div class="book-page__calendar">` + UNTIL_DIV_CLOSE,
);
const LAST_MAIN_CLOSE_RE = /<\/main>(?![\s\S]*<\/main>)/;

/**
 * Files the injector will consider, in preference order — first hit wins.
 *
 * The `.astro` sources come first: injecting before `astro build` is how a
 * real full-site build gets its calendar, and the built HTML then carries it
 * for free. The `dist`-shaped HTML paths are the fallback for a tree that has
 * already been built (or was authored as plain HTML), so packaging a build
 * output can still upgrade a blurred preview demo to the live embed.
 */
const BOOKING_PAGE_CANDIDATES = [
  'src/pages/book.astro',
  'src/pages/contact.astro',
  'book/index.html',
  'contact/index.html',
  'book.html',
  'contact.html',
];

export interface CalComOptions {
  /** Cal.com embed layout. Default 'month_view'. */
  layout?: 'month_view' | 'week_view' | 'column_view';
  /** Cal.com embed theme. Default 'light' (matches the shared CalBookingBlock convention). */
  theme?: 'light' | 'dark';
  /** iframe title attribute. Default 'Book an appointment'. */
  title?: string;
}

/**
 * Normalizes a user-supplied Cal.com URL/handle into the link fragment Cal.com
 * expects after `cal.com/`, e.g. "yourname/30min" or "yourname".
 *
 * Accepts, and returns the same normalized fragment for:
 *   "yourname"                         → "yourname"
 *   "yourname/30min"                   → "yourname/30min"
 *   "cal.com/yourname"                 → "yourname"
 *   "https://cal.com/yourname/30min"   → "yourname/30min"
 *   "https://app.cal.com/yourname"     → "yourname"
 *
 * Returns null for empty input or a URL on a non-Cal.com host (this function
 * only ever produces Cal.com embeds — see docs/INTEGRATIONS-PLAN.md, which
 * prefers Cal.com for new integration code).
 */
export function normalizeCalLink(calUrl: string | null | undefined): string | null {
  if (!calUrl) return null;
  let rest = calUrl.trim();
  if (!rest) return null;

  rest = rest.replace(/^https?:\/\//i, '');

  const hostMatch = rest.match(/^([^/?#]+)/);
  const host = hostMatch?.[1]?.toLowerCase() ?? '';
  if (host.includes('.')) {
    if (!/^(www\.|app\.)?cal\.com$/.test(host)) return null;
    rest = rest.slice(host.length);
  }

  rest = rest.replace(/^\/+/, '');
  rest = rest.split(/[?#]/)[0] ?? '';
  // Trailing slashes are counted off by hand: `/\/+$/` has to backtrack from
  // every offset on a value that is nothing but slashes, and this one arrives
  // straight from a client's form field.
  let end = rest.length;
  while (end > 0 && rest[end - 1] === '/') end -= 1;
  rest = rest.slice(0, end);

  return rest || null;
}

/** Cal.com's documented no-JS embed route: cal.com/<link>/embed?layout=…&theme=… */
function calEmbedSrc(calLink: string, opts: CalComOptions): string {
  const layout = opts.layout ?? 'month_view';
  const theme = opts.theme ?? 'light';
  return `https://cal.com/${calLink}/embed?layout=${layout}&theme=${theme}`;
}

function renderManagedBlock(calLink: string, opts: CalComOptions, standalone: boolean): string {
  const title = opts.title ?? 'Book an appointment';
  const src = calEmbedSrc(calLink, opts);
  const wrapperOpen = standalone
    ? `<div class="flowstarter-cal-embed" data-flowstarter-cal-embed="true" style="margin:32px 0;border:1px solid var(--border-color, #e5e5e5);border-radius:var(--radius-lg, 12px);overflow:hidden;">`
    : `<div class="book-page__calendar" data-flowstarter-cal-embed="true">`;
  const iframeStyle = standalone ? ' style="display:block;width:100%;border:0;"' : '';
  return [
    wrapperOpen,
    `  <!-- flowstarter:cal-embed — injected by injectCalCom(); re-running the injector updates this block in place -->`,
    `  <iframe`,
    `    src="${src}"`,
    `    width="100%"`,
    `    height="700"`,
    `    frameborder="0"`,
    `    title="${title}"`,
    `    loading="lazy"${iframeStyle}`,
    `  ></iframe>`,
    `</div>`,
  ].join('\n');
}

/**
 * Static, blurred calendar mock for funnel previews. No network call to
 * cal.com — the live embed is reserved for the paid full-site build.
 */
function renderPreviewDemoBlock(standalone: boolean): string {
  const wrapperOpen = standalone
    ? `<div class="flowstarter-cal-preview" data-flowstarter-cal-preview="true" style="position:relative;margin:32px 0;border:1px solid var(--border-color, #e5e5e5);border-radius:var(--radius-lg, 12px);overflow:hidden;min-height:420px;background:var(--surface-base, #fafafa);">`
    : `<div class="book-page__calendar" data-flowstarter-cal-preview="true" style="position:relative;overflow:hidden;min-height:420px;">`;
  const days = Array.from({ length: 28 }, (_, i) => {
    const n = i + 1;
    const active = n === 12 || n === 19;
    return `<span style="display:flex;align-items:center;justify-content:center;aspect-ratio:1;border-radius:8px;font-size:13px;${
      active
        ? 'background:#111;color:#fff;font-weight:600;'
        : 'background:rgba(0,0,0,0.04);color:#333;'
    }">${n}</span>`;
  }).join('');
  return [
    wrapperOpen,
    `  <!-- flowstarter:cal-preview — blurred demo; injectCalCom() replaces this on the full site -->`,
    `  <div aria-hidden="true" style="filter:blur(7px);transform:scale(1.02);padding:28px 24px 40px;pointer-events:none;user-select:none;">`,
    `    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">`,
    `      <strong style="font-size:18px;letter-spacing:-0.02em;">Book a time</strong>`,
    `      <span style="font-size:13px;opacity:0.6;">Cal.com</span>`,
    `    </div>`,
    `    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;">${days}</div>`,
    `    <div style="margin-top:24px;display:grid;gap:10px;">`,
    `      <div style="height:44px;border-radius:10px;background:rgba(0,0,0,0.06);"></div>`,
    `      <div style="height:44px;border-radius:10px;background:rgba(0,0,0,0.06);"></div>`,
    `      <div style="height:48px;border-radius:10px;background:#111;opacity:0.85;"></div>`,
    `    </div>`,
    `  </div>`,
    `  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(255,255,255,0.28);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);">`,
    `    <p style="margin:0;max-width:16rem;text-align:center;font-size:14px;line-height:1.4;font-weight:600;color:#111;text-shadow:0 1px 0 rgba(255,255,255,0.8);">`,
    `      Your Cal.com calendar<br /><span style="font-weight:500;opacity:0.75;">Unlocks on the full site</span>`,
    `    </p>`,
    `  </div>`,
    `</div>`,
  ].join('\n');
}

function spliceBookingBlock(before: string, block: string): string | null {
  if (MANAGED_BLOCK_RE.test(before)) {
    return before.replace(MANAGED_BLOCK_RE, block);
  }
  if (PREVIEW_DEMO_BLOCK_RE.test(before)) {
    return before.replace(PREVIEW_DEMO_BLOCK_RE, block);
  }
  if (PLACEHOLDER_CALENDAR_RE.test(before)) {
    return before.replace(PLACEHOLDER_CALENDAR_RE, block);
  }
  if (LAST_MAIN_CLOSE_RE.test(before)) {
    return before.replace(LAST_MAIN_CLOSE_RE, `${block}\n</main>`);
  }
  return null;
}

function wantsStandalone(before: string): boolean {
  if (/class="flowstarter-cal-embed"/.test(before.match(MANAGED_BLOCK_RE)?.[0] ?? '')) {
    return true;
  }
  if (/class="flowstarter-cal-preview"/.test(before.match(PREVIEW_DEMO_BLOCK_RE)?.[0] ?? '')) {
    return true;
  }
  return (
    !PLACEHOLDER_CALENDAR_RE.test(before) &&
    !/class="book-page__calendar"/.test(before) &&
    !MANAGED_BLOCK_RE.test(before) &&
    !PREVIEW_DEMO_BLOCK_RE.test(before)
  );
}

/**
 * Funnel/preview only: replace the booking placeholder with a blurred static
 * calendar demo. Never loads cal.com. Idempotent via
 * `data-flowstarter-cal-preview`.
 */
export function injectCalComPreviewDemo(files: FileMap): FileMap {
  const targetPath = BOOKING_PAGE_CANDIDATES.find((path) => path in files);
  if (!targetPath) return files;

  const before = files[targetPath]!;
  const block = renderPreviewDemoBlock(wantsStandalone(before));
  const after = spliceBookingBlock(before, block);
  if (!after || after === before) return files;
  return { ...files, [targetPath]: after };
}

/**
 * Injects (or, on re-run, updates) a Cal.com booking embed into a template's
 * file tree. Pure and deterministic: same inputs → same output, no network,
 * no LLM. Fails open — an unrecognized `calUrl` or a file tree with neither
 * `src/pages/book.astro` nor `src/pages/contact.astro` returns `files`
 * unchanged rather than throwing.
 *
 * Also replaces a prior `injectCalComPreviewDemo` block so the full-site build
 * upgrades the blurred tease to the live embed.
 */
export function injectCalCom(
  files: FileMap,
  calUrl: string | null | undefined,
  opts: CalComOptions = {}
): FileMap {
  const calLink = normalizeCalLink(calUrl);
  if (!calLink) return files;

  const targetPath = BOOKING_PAGE_CANDIDATES.find((path) => path in files);
  if (!targetPath) return files;

  const before = files[targetPath]!;
  const block = renderManagedBlock(calLink, opts, wantsStandalone(before));
  const after = spliceBookingBlock(before, block);
  if (!after || after === before) return files;
  return { ...files, [targetPath]: after };
}

export interface IntegrationsConfig {
  booking?: {
    provider: 'cal.com';
    url: string;
    options?: CalComOptions;
  };
}

/**
 * The `injectIntegrations(files, projectConfig)` step from
 * docs/INTEGRATIONS-PLAN.md's architecture diagram. Currently runs
 * `injectCalCom`; future deterministic integrations (analytics, SEO) plug in
 * here without touching call sites.
 */
export function injectIntegrations(files: FileMap, config: IntegrationsConfig): FileMap {
  let next = files;
  if (config.booking?.provider === 'cal.com' && config.booking.url) {
    next = injectCalCom(next, config.booking.url, config.booking.options);
  }
  return next;
}

/**
 * Disk adapter for `runCodegen`'s real (non-in-memory) workspace: reads the
 * candidate booking pages out of `buildDir`, runs `injectIntegrations` over
 * them in memory, and writes back only the files that actually changed.
 * Never throws — a missing template file or an unrecognized `calUrl` is a
 * no-op, matching `injectCalCom`'s fail-open contract.
 */
export async function applyIntegrationsToWorkspace(
  buildDir: string,
  config: IntegrationsConfig
): Promise<{ applied: boolean; changedPaths: string[] }> {
  const { readFile, writeFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const { fileExists } = await import('./workspace');

  const before: FileMap = {};
  for (const rel of BOOKING_PAGE_CANDIDATES) {
    const abs = join(buildDir, rel);
    if (await fileExists(abs)) before[rel] = await readFile(abs, 'utf8');
  }
  if (Object.keys(before).length === 0) return { applied: false, changedPaths: [] };

  const after = injectIntegrations(before, config);
  const changedPaths: string[] = [];
  for (const rel of Object.keys(after)) {
    if (after[rel] !== before[rel]) {
      await writeFile(join(buildDir, rel), after[rel]!, 'utf8');
      changedPaths.push(rel);
    }
  }
  return { applied: changedPaths.length > 0, changedPaths };
}
