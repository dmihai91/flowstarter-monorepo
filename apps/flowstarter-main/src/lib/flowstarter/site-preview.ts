import 'server-only';
/**
 * Serving one workspace's site back to its owner, so they can point at a bit
 * of it and say "change that".
 *
 * TWO KINDS OF SITE. A manifest that already holds built HTML (`index.html`,
 * `dist/index.html`) is served as it is — that is the real site. A manifest of
 * Astro sources, which is what a delivered project holds, cannot be rendered
 * without running a build, so `renderContentPreview` produces an honest
 * *content* view instead: every editable block, in document order, in its
 * section, with its picture. It is labelled as such in the UI rather than
 * dressed up as the finished page, because a client who thinks they are
 * looking at their live site and is not would rightly stop trusting the rest.
 *
 * PATHS ARE NEVER FILESYSTEM PATHS. Everything served comes out of the stored
 * manifest by exact key, after `resolveManifestFile` rejects `..`, backslashes,
 * absolute paths and NUL bytes. There is no `readFile` here at all, so a
 * traversal attempt has nothing to traverse; the check exists so a request for
 * `../../.env` fails as a 404 rather than matching some future disk-backed
 * shortcut.
 *
 * THE FRAME IS SANDBOXED. The document is a client's own site content, but it
 * is served from our origin, so it is returned under
 * `Content-Security-Policy: sandbox allow-scripts` and framed with the same
 * sandbox attribute. That puts it in an opaque origin with no access to the
 * dashboard's cookies or storage, which is why the selection bridge below
 * posts to `*` and the parent authenticates the message by `event.source`
 * instead of by origin — an opaque origin has no origin to check.
 */
import type { EditableTarget, SiteFile } from './site-editor';

/** Message envelope both sides of the iframe bridge agree on. */
export const PREVIEW_MESSAGE_SOURCE = 'flowstarter-site-preview';
export const EDITOR_MESSAGE_SOURCE = 'flowstarter-site-editor';

const CONTENT_TYPES: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  txt: 'text/plain; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  md: 'text/plain; charset=utf-8',
};

export function contentTypeForPath(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  return CONTENT_TYPES[extension] ?? 'application/octet-stream';
}

/** True for a path a client could have crafted to escape the manifest. */
export function isUnsafePreviewPath(segments: readonly string[]): boolean {
  if (segments.length > 24) return true;
  return segments.some(
    (segment) =>
      segment === '' ||
      segment === '.' ||
      segment === '..' ||
      segment.includes('\\') ||
      segment.includes('\u0000') ||
      segment.startsWith('/')
  );
}

/**
 * Finds the manifest entry a request path names, or null.
 *
 * A site's own markup asks for `/styles/site.css`; the manifest stores that as
 * `public/styles/site.css` (source) or `dist/styles/site.css` (build output),
 * so all three spellings are tried — but only ever as exact keys of the
 * manifest, never as anything resolved against a directory.
 */
export function resolveManifestFile(
  files: readonly SiteFile[],
  segments: readonly string[]
): SiteFile | null {
  if (isUnsafePreviewPath(segments)) return null;
  const joined = segments.join('/');
  if (joined.length === 0) return null;
  const candidates = [joined, `public/${joined}`, `dist/${joined}`];
  for (const candidate of candidates) {
    const hit = files.find((file) => file.path === candidate);
    if (hit) return hit;
  }
  return null;
}

/** The built document a manifest may already contain, if it has one. */
export function findBuiltIndex(files: readonly SiteFile[]): SiteFile | null {
  return (
    files.find((file) => file.path === 'dist/index.html') ??
    files.find((file) => file.path === 'index.html') ??
    files.find((file) => file.path === 'public/index.html') ??
    null
  );
}

// ── The selection bridge ───────────────────────────────────────────────────

/**
 * Click-to-select, in the frame. Walks up from the clicked node to the nearest
 * `data-flowstarter-id` — the attribute the full-build agent stamps on every
 * client-editable block, and the one `renderContentPreview` stamps itself —
 * and posts that id out. Anchors are neutered: a client exploring their own
 * site inside the editor should not navigate the frame away from it.
 */
export const SELECTION_BRIDGE_SCRIPT = `
(function () {
  var SOURCE = ${JSON.stringify(PREVIEW_MESSAGE_SOURCE)};
  var INBOUND = ${JSON.stringify(EDITOR_MESSAGE_SOURCE)};
  var selected = null;

  function targetOf(node) {
    while (node && node !== document.documentElement) {
      if (node.getAttribute && node.getAttribute('data-flowstarter-id')) return node;
      node = node.parentNode;
    }
    return null;
  }

  function select(node, announce) {
    if (selected) selected.removeAttribute('data-fs-selected');
    selected = node;
    if (!node) return;
    node.setAttribute('data-fs-selected', '');
    if (node.scrollIntoView) node.scrollIntoView({ block: 'center' });
    if (!announce) return;
    parent.postMessage({
      source: SOURCE,
      type: 'select',
      targetId: node.getAttribute('data-flowstarter-id'),
      text: (node.textContent || '').trim().slice(0, 5000)
    }, '*');
  }

  document.addEventListener('click', function (event) {
    var anchor = event.target && event.target.closest ? event.target.closest('a') : null;
    if (anchor) event.preventDefault();
    var node = targetOf(event.target);
    if (!node) return;
    event.preventDefault();
    event.stopPropagation();
    select(node, true);
  }, true);

  document.addEventListener('submit', function (event) { event.preventDefault(); }, true);

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.source !== INBOUND) return;
    if (data.type === 'select') {
      select(document.querySelector('[data-flowstarter-id="' + String(data.targetId).replace(/["\\\\]/g, '') + '"]'), false);
    }
  });

  parent.postMessage({
    source: SOURCE,
    type: 'ready',
    editable: document.querySelectorAll('[data-flowstarter-id]').length
  }, '*');
})();
`;

const SELECTION_BRIDGE_STYLE = `
[data-flowstarter-id] { cursor: pointer; outline-offset: 2px; transition: outline-color 120ms ease; }
[data-flowstarter-id]:hover { outline: 2px dashed rgba(99, 91, 255, 0.65); }
[data-fs-selected] { outline: 2px solid rgb(99, 91, 255) !important; background: rgba(99, 91, 255, 0.06); }
`;

/** Adds the bridge to a document the site already built for itself. */
export function injectSelectionBridge(html: string): string {
  const injection = `<style>${SELECTION_BRIDGE_STYLE}</style><script>${SELECTION_BRIDGE_SCRIPT}</script>`;
  return html.includes('</body>')
    ? html.replace('</body>', `${injection}</body>`)
    : `${html}${injection}`;
}

// ── The content view ───────────────────────────────────────────────────────

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Image references, for display only. The authoritative, editable slot list is
 * `listSiteImageSlots` in the codegen package — this exists so the content
 * view can show the picture that sits next to a headline, and deliberately
 * does not decide anything.
 */
const DISPLAY_IMAGE_LINE =
  /^\s*-?\s*(?:image|imageSrc|authorImage|logo|avatar):\s*(["'])(\/[\w\-./]+\.(?:png|jpe?g|webp|gif|avif|svg))\1\s*$/i;

interface DisplayImage {
  file: string;
  line: number;
  path: string;
}

function listDisplayImages(files: readonly SiteFile[]): DisplayImage[] {
  const images: DisplayImage[] = [];
  for (const file of files) {
    if (!/^src\/content\//.test(file.path)) continue;
    file.content.split('\n').forEach((line, index) => {
      const match = DISPLAY_IMAGE_LINE.exec(line);
      if (match) {
        images.push({
          file: file.path,
          line: index + 1,
          path: match[2] as string,
        });
      }
    });
  }
  return images;
}

function humanise(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

export interface ContentPreviewInput {
  files: readonly SiteFile[];
  targets: readonly EditableTarget[];
  siteName: string;
  templateSlug: string | null;
  version: number;
}

/**
 * A readable rendering of everything on the site that a client may change,
 * with each block carrying the `data-flowstarter-id` the bridge reports and
 * the edit routes accept.
 */
export function renderContentPreview(input: ContentPreviewInput): string {
  const images = listDisplayImages(input.files);
  const sections = new Map<string, EditableTarget[]>();
  for (const target of input.targets) {
    const list = sections.get(target.section);
    if (list) list.push(target);
    else sections.set(target.section, [target]);
  }

  const body = Array.from(sections.entries())
    .map(([section, targets]) => {
      const first = targets[0];
      const last = targets[targets.length - 1];
      const sectionImages =
        first && last
          ? images.filter(
              (image) =>
                image.file === first.file &&
                image.line >= first.line &&
                image.line <= last.line + 8
            )
          : [];
      const blocks = targets
        .map(
          (target) => `
        <div class="block">
          <p class="key">${escapeHtml(humanise(target.key))}</p>
          <div class="value" data-flowstarter-id="${escapeHtml(
            target.id
          )}">${escapeHtml(target.content).split('\n').join('<br />')}</div>
        </div>`
        )
        .join('');
      const gallery = sectionImages
        .map(
          (image) =>
            `<img src="${escapeHtml(image.path)}" alt="" loading="lazy" />`
        )
        .join('');
      return `
      <section class="section">
        <h2>${escapeHtml(humanise(section))}</h2>
        ${gallery ? `<div class="gallery">${gallery}</div>` : ''}
        ${blocks}
      </section>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${escapeHtml(input.siteName)} — content preview</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px 20px 64px; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: #1b1b23; background: #fbfaff; line-height: 1.55; }
  header.banner { margin: 0 auto 28px; max-width: 720px; border: 1px solid rgba(27,27,35,0.12); border-radius: 16px; padding: 14px 18px; background: #fff; }
  header.banner p { margin: 0; font-size: 13px; color: rgba(27,27,35,0.65); }
  header.banner strong { color: #1b1b23; }
  .section { margin: 0 auto 28px; max-width: 720px; border: 1px solid rgba(27,27,35,0.1); border-radius: 16px; padding: 20px 22px; background: #fff; }
  .section h2 { margin: 0 0 14px; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(27,27,35,0.5); }
  .gallery { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .gallery img { width: 108px; height: 76px; object-fit: cover; border-radius: 8px; background: rgba(27,27,35,0.06); }
  .block { margin-bottom: 14px; }
  .key { margin: 0 0 3px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(27,27,35,0.42); }
  .value { font-size: 16px; border-radius: 8px; padding: 4px 6px; margin-left: -6px; white-space: pre-wrap; }
  .empty { margin: 64px auto; max-width: 520px; text-align: center; color: rgba(27,27,35,0.6); }
${SELECTION_BRIDGE_STYLE}
</style>
</head>
<body>
<header class="banner">
  <p><strong>Content preview</strong> — version ${input.version || 1}${
    input.templateSlug
      ? `, rendered through the <strong>${escapeHtml(
          input.templateSlug
        )}</strong> template on your live site`
      : ''
  }. Click any line to edit it.</p>
</header>
${body || '<p class="empty">There is nothing editable in this site yet.</p>'}
<script>${SELECTION_BRIDGE_SCRIPT}</script>
</body>
</html>`;
}

/** Headers every preview response carries, whatever it is serving. */
export function previewHeaders(contentType: string): Record<string, string> {
  return {
    'Content-Type': contentType,
    'Content-Security-Policy': "sandbox allow-scripts; frame-ancestors 'self'",
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, no-store',
  };
}
