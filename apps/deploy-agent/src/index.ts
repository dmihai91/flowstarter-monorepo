/**
 * Flowstarter deploy-agent.
 *
 * Tiny Bun HTTP service that runs on each Hetzner Caddy host. Owned by
 * the host, called by flowstarter-main (or the operator service).
 *
 * Endpoints:
 *   POST   /sites/:slug/deploy      → fetch artifact, extract, write Caddy snippet, reload
 *   DELETE /sites/:slug              → remove site dir + Caddy snippet, reload
 *   GET    /health                   → liveness
 *
 * Auth: `Authorization: Bearer <DEPLOY_AGENT_SHARED_SECRET>` on all endpoints.
 *
 * Bootstrap: cloud-init drops a systemd unit pointing here.
 *
 * Idempotency: redeploys overwrite the same site dir + snippet. The agent
 * stages each artifact in a temp dir then atomically renames into place
 * so a partial download can't corrupt a live site.
 */

import { mkdir, readFile, writeFile, rename, rm, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';

const PORT = Number(process.env.DEPLOY_AGENT_PORT ?? 8443);
const SHARED_SECRET = process.env.DEPLOY_AGENT_SHARED_SECRET ?? '';
const SITES_ROOT = process.env.DEPLOY_AGENT_SITES_ROOT ?? '/var/www/sites';
const CADDY_SITES_DIR =
  process.env.DEPLOY_AGENT_CADDY_SITES_DIR ?? '/etc/caddy/sites';
const CADDY_RELOAD_CMD =
  process.env.DEPLOY_AGENT_CADDY_RELOAD_CMD ?? 'systemctl reload caddy';
const TEMP_ROOT = process.env.DEPLOY_AGENT_TEMP_ROOT ?? '/tmp/flowstarter-deploys';
const VERSION = '0.2.0';

/**
 * Which fleet this instance serves.
 *
 * `sites` (the default, and what every existing host runs) is the paid-site
 * agent: /var/www/sites, /etc/caddy/sites, port 8443, the editor reverse-proxy
 * in every snippet, `systemctl reload caddy`. Its behaviour is unchanged.
 *
 * `previews` is a SECOND instance of this same binary, started by a second
 * systemd unit from a second env file, serving anonymous funnel previews. It
 * writes to a different sites root and a different Caddy config directory,
 * loaded by a different Caddy process — so a snippet generated from an
 * LLM-authored preview that fails to parse takes down previews and leaves
 * every paying customer on the same box serving. Its snippets also carry
 * `X-Robots-Tag: noindex` and no editor proxy: a preview is a temporary
 * marketing artefact, not a workspace somebody edits.
 *
 * Everything that differs between the two comes from env. There is no code
 * path in which a previews-configured agent writes into /var/www/sites.
 */
const MODE = process.env.DEPLOY_AGENT_MODE === 'previews' ? 'previews' : 'sites';

/**
 * Port the previews Caddy listens on. TLS for the preview zone is terminated
 * by the front Caddy, which proxies here over loopback, so preview snippets
 * are plain `http://host:port` blocks.
 */
const SITE_PORT = Number(process.env.DEPLOY_AGENT_SITE_PORT ?? 9080);

/** The zone preview hostnames must end in. Guards the TLS ask endpoint. */
const PREVIEW_HOST_SUFFIX =
  process.env.DEPLOY_AGENT_PREVIEW_HOST_SUFFIX ?? 'preview.flowstarter.net';

/** Kept in step with NOINDEX_HEADER_VALUE in lib/hosting/site-archive.ts. */
const ROBOTS_HEADER = 'noindex, nofollow, noarchive';

if (!SHARED_SECRET) {
  console.error(
    '[deploy-agent] DEPLOY_AGENT_SHARED_SECRET is not set. Refusing to start.'
  );
  process.exit(1);
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;

interface DeployBody {
  /** Empty when the caller streamed the tarball instead of naming a URL. */
  artifact_url: string;
  artifact_sha256?: string | null;
  primary_domain?: string | null;
  additional_domains?: string[];
  /** Set when the artifact arrived as `application/octet-stream`. */
  artifact_bytes?: Uint8Array | null;
}

/**
 * Optional plain-HTTP static server for the extracted sites, keyed by path:
 * `http://<host>:<port>/<slug>/…` serves `<SITES_ROOT>/<slug>/…`.
 *
 * A real host does not need this — Caddy serves the same directories by
 * hostname with TLS, which is what the snippets this agent writes configure.
 * A laptop has no wildcard DNS, no certificate and (in dev) a Caddy reload
 * that is `echo reloaded`, so without this the deploy chain ends at "the files
 * are on disk somewhere" and nobody can open the site. Off unless
 * DEPLOY_AGENT_STATIC_PORT is set.
 */
const STATIC_PORT = process.env.DEPLOY_AGENT_STATIC_PORT
  ? Number(process.env.DEPLOY_AGENT_STATIC_PORT)
  : null;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function authorized(req: Request): boolean {
  const header = req.headers.get('authorization') ?? '';
  if (!header.startsWith('Bearer ')) return false;
  const token = header.slice('Bearer '.length).trim();
  if (token.length !== SHARED_SECRET.length) return false;
  // constant-time comparison
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ SHARED_SECRET.charCodeAt(i);
  }
  return diff === 0;
}

function siteSlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/sites\/([^/]+)(?:\/.*)?$/);
  if (!m) return null;
  const slug = decodeURIComponent(m[1]).toLowerCase();
  return SLUG_RE.test(slug) ? slug : null;
}

async function shellOk(cmd: string): Promise<{ ok: boolean; stderr: string }> {
  return new Promise((resolveSpawn) => {
    const child = spawn('sh', ['-c', cmd], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => (stderr += String(chunk)));
    child.on('close', (code) =>
      resolveSpawn({ ok: code === 0, stderr: stderr.trim() })
    );
  });
}

/**
 * Reverse-proxy upstream for the multitenant editor container. Each
 * Hetzner host runs ONE editor container; every site's Caddy snippet
 * sends `/editor*` requests there. Defaults to `http://editor:3773`
 * which matches the docker-compose service name; override via env when
 * the editor lives at a different address (e.g. systemd unit on
 * 127.0.0.1).
 */
const EDITOR_UPSTREAM =
  process.env.DEPLOY_AGENT_EDITOR_UPSTREAM ?? 'http://editor:3773';

function buildCaddySnippet(
  slug: string,
  rootDir: string,
  primary: string | null,
  additional: string[],
  previewHost: string | null
): string {
  const hosts = [primary, ...additional, previewHost].filter(
    (h): h is string => !!h && h.length > 0
  );
  if (hosts.length === 0) return '';

  // The site is split into two routes:
  //   /editor*  → multitenant editor container (path stripped before forward
  //               so the editor sees `/`, `/api/...`, etc. without prefix)
  //   /...      → static site files in `rootDir`
  //
  // Editor requests carry the workspace slug via the `Host` header, which
  // Caddy preserves automatically — the editor server (`clerkGate.ts`)
  // reads it to scope the auth check to that specific workspace.
  return [
    `# Managed by flowstarter deploy-agent — site ${slug}`,
    `${hosts.join(', ')} {`,
    `  encode gzip zstd`,
    ``,
    `  # Editor (multitenant) — Clerk-gated; auth derives workspace from Host.`,
    `  handle_path /editor/* {`,
    `    reverse_proxy ${EDITOR_UPSTREAM} {`,
    `      header_up X-Forwarded-Host {host}`,
    `      header_up X-Forwarded-Proto {scheme}`,
    `    }`,
    `  }`,
    `  # Editor health/short URL — `,
    `  handle /editor {`,
    `    redir /editor/ permanent`,
    `  }`,
    ``,
    `  # Static site (the deployed client artifact)`,
    `  handle {`,
    `    root * ${rootDir}`,
    `    try_files {path} {path}/ /index.html`,
    `    file_server`,
    `  }`,
    `}`,
    ``,
  ].join('\n');
}

/**
 * The previews snippet. Deliberately not a variant of `buildCaddySnippet`:
 * it has no editor route, no custom domains, and one job — serve static files
 * for exactly one unguessable hostname, telling every crawler not to index it.
 *
 * `http://` and an explicit port because the front Caddy already terminated
 * TLS and forwarded here on loopback; `auto_https off` in the previews
 * Caddyfile means this block is matched on the Host header alone.
 */
function buildPreviewCaddySnippet(
  slug: string,
  rootDir: string,
  hostname: string | null
): string {
  const host = hostname && hostname.length > 0 ? hostname : null;
  if (!host) return '';
  return [
    `# Managed by flowstarter deploy-agent (previews) — ${slug}`,
    `http://${host}:${SITE_PORT} {`,
    `  encode gzip zstd`,
    ``,
    `  # A preview carries a real business's name and copy nobody approved.`,
    `  # The manifest's HTML also carries <meta name="robots">; this is the`,
    `  # half that survives a crawler which only reads headers.`,
    `  header X-Robots-Tag "${ROBOTS_HEADER}"`,
    ``,
    `  root * ${rootDir}`,
    `  try_files {path} {path}/ /index.html`,
    `  file_server`,
    `}`,
    ``,
  ].join('\n');
}

/**
 * Does this agent currently serve `domain`?
 *
 * The front Caddy calls this before issuing an on-demand certificate. Without
 * it, anybody who points a DNS record at this box makes us ask Let's Encrypt
 * for a certificate on their behalf, which is both a rate-limit hazard and an
 * open cert-minting service. Answers 200 only for a hostname in our own
 * preview zone that has a snippet on disk.
 */
async function handleTlsAsk(domain: string | null): Promise<Response> {
  if (MODE !== 'previews') return jsonResponse({ error: 'not found' }, 404);
  const host = (domain ?? '').trim().toLowerCase();
  const suffix = `.${PREVIEW_HOST_SUFFIX}`;
  if (!host.endsWith(suffix)) {
    return jsonResponse({ error: 'not a preview host' }, 404);
  }
  const slug = host.slice(0, -suffix.length);
  if (!SLUG_RE.test(slug)) {
    return jsonResponse({ error: 'not a preview host' }, 404);
  }
  const snippet = join(CADDY_SITES_DIR, `${slug}.caddy`);
  if (!(await exists(snippet))) {
    return jsonResponse({ error: 'no such preview' }, 404);
  }
  return new Response('', { status: 200 });
}

async function ensureDirs(): Promise<void> {
  for (const d of [SITES_ROOT, CADDY_SITES_DIR, TEMP_ROOT]) {
    await mkdir(d, { recursive: true });
  }
}

async function fetchAndVerify(
  url: string,
  expectedSha256: string | null | undefined
): Promise<{ tarballPath: string; actualSha256: string; sizeBytes: number }> {
  const res = await fetch(url, {
    headers: { 'User-Agent': `flowstarter-deploy-agent/${VERSION}` },
  });
  if (!res.ok) {
    throw new Error(`Fetch failed ${res.status}: ${url}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  const hash = createHash('sha256').update(buf).digest('hex');
  if (expectedSha256 && expectedSha256.toLowerCase() !== hash) {
    throw new Error(
      `sha256 mismatch: expected ${expectedSha256}, got ${hash}`
    );
  }
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tarballPath = join(TEMP_ROOT, `${stamp}.tar.gz`);
  await writeFile(tarballPath, buf);
  return { tarballPath, actualSha256: hash, sizeBytes: buf.length };
}

async function extractTarball(tarballPath: string, destDir: string): Promise<void> {
  // Use `tar` from system. -x extract, -z gzip, -f file, -C cd, --strip-components=0 keep top-level.
  // We extract into a fresh staging dir, then rename to destDir atomically.
  const stagingDir = `${destDir}.staging-${Date.now()}`;
  await mkdir(stagingDir, { recursive: true });
  const cmd = `tar -xzf ${shellQuote(tarballPath)} -C ${shellQuote(stagingDir)}`;
  const { ok, stderr } = await shellOk(cmd);
  if (!ok) {
    await rm(stagingDir, { recursive: true, force: true }).catch(() => undefined);
    throw new Error(`tar extract failed: ${stderr}`);
  }

  // Atomically replace destDir with stagingDir.
  const backupDir = (await exists(destDir))
    ? `${destDir}.backup-${Date.now()}`
    : null;
  if (backupDir) {
    await rename(destDir, backupDir);
  }
  await rename(stagingDir, destDir);
  if (backupDir) {
    // Best-effort cleanup of the previous version.
    await rm(backupDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

function shellQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

async function writeCaddySnippet(slug: string, snippet: string): Promise<void> {
  const file = join(CADDY_SITES_DIR, `${slug}.caddy`);
  if (snippet.length === 0) {
    if (await exists(file)) await rm(file, { force: true });
    return;
  }
  const tmp = `${file}.tmp`;
  await writeFile(tmp, snippet, { mode: 0o644 });
  await rename(tmp, file);
}

async function reloadCaddy(): Promise<{ ok: boolean; stderr: string }> {
  return shellOk(CADDY_RELOAD_CMD);
}

/**
 * Stage a tarball the caller streamed to us. Same verification and same temp
 * file as the URL path, so `handleDeploy` cannot tell the two apart after this
 * point.
 */
async function stageUploadedArtifact(
  bytes: Uint8Array,
  expectedSha256: string | null | undefined
): Promise<{ tarballPath: string; actualSha256: string; sizeBytes: number }> {
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (expectedSha256 && expectedSha256.toLowerCase() !== hash) {
    throw new Error(`sha256 mismatch: expected ${expectedSha256}, got ${hash}`);
  }
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tarballPath = join(TEMP_ROOT, `${stamp}.tar.gz`);
  await writeFile(tarballPath, bytes);
  return { tarballPath, actualSha256: hash, sizeBytes: bytes.length };
}

async function handleDeploy(slug: string, body: DeployBody): Promise<Response> {
  const uploaded = body.artifact_bytes ?? null;
  if (!uploaded && (typeof body.artifact_url !== 'string' || !body.artifact_url)) {
    return jsonResponse(
      { error: 'artifact_url required (or POST the tarball as application/octet-stream)' },
      400
    );
  }
  await ensureDirs();

  let fetched;
  try {
    fetched = uploaded
      ? await stageUploadedArtifact(uploaded, body.artifact_sha256 ?? null)
      : await fetchAndVerify(body.artifact_url, body.artifact_sha256 ?? null);
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : 'fetch failed' },
      uploaded ? 400 : 502
    );
  }

  const siteDir = resolve(SITES_ROOT, slug);
  try {
    await extractTarball(fetched.tarballPath, siteDir);
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : 'extract failed' },
      500
    );
  } finally {
    await rm(fetched.tarballPath, { force: true }).catch(() => undefined);
  }

  const previewHost = process.env.DEPLOY_AGENT_PREVIEW_DOMAIN_TEMPLATE
    ? process.env.DEPLOY_AGENT_PREVIEW_DOMAIN_TEMPLATE.replace('{slug}', slug)
    : null;
  const snippet =
    MODE === 'previews'
      ? buildPreviewCaddySnippet(
          slug,
          siteDir,
          // The publisher sends the unguessable hostname as primary_domain.
          // Custom domains are meaningless for a preview and are ignored
          // rather than trusted.
          body.primary_domain ?? `${slug}.${PREVIEW_HOST_SUFFIX}`
        )
      : buildCaddySnippet(
          slug,
          siteDir,
          body.primary_domain ?? null,
          body.additional_domains ?? [],
          previewHost
        );
  try {
    await writeCaddySnippet(slug, snippet);
  } catch (e) {
    return jsonResponse(
      { error: `caddy snippet write failed: ${e instanceof Error ? e.message : 'unknown'}` },
      500
    );
  }

  const reload = await reloadCaddy();
  if (!reload.ok) {
    return jsonResponse(
      { error: `caddy reload failed: ${reload.stderr}` },
      500
    );
  }

  return jsonResponse({
    ok: true,
    slug,
    sha256: fetched.actualSha256,
    sizeBytes: fetched.sizeBytes,
    siteDir,
  });
}

async function handleRemove(slug: string): Promise<Response> {
  const siteDir = resolve(SITES_ROOT, slug);
  await rm(siteDir, { recursive: true, force: true }).catch(() => undefined);
  await writeCaddySnippet(slug, '');
  const reload = await reloadCaddy();
  if (!reload.ok) {
    return jsonResponse(
      { error: `caddy reload failed: ${reload.stderr}` },
      500
    );
  }
  return jsonResponse({ ok: true, slug });
}

async function readBody(req: Request): Promise<DeployBody> {
  // `HttpDeployAgentClient` supports both artifact shapes. Raw bytes carry the
  // domains in headers because there is no JSON envelope to put them in.
  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.startsWith('application/octet-stream')) {
    const bytes = new Uint8Array(await req.arrayBuffer());
    const additional = (req.headers.get('x-site-additional-domains') ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    return {
      artifact_url: '',
      artifact_bytes: bytes,
      artifact_sha256: req.headers.get('x-artifact-sha256'),
      primary_domain: req.headers.get('x-site-primary-domain') || null,
      additional_domains: additional,
    };
  }

  const text = await req.text();
  if (!text) return { artifact_url: '' };
  try {
    return JSON.parse(text) as DeployBody;
  } catch {
    return { artifact_url: '' };
  }
}

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
  txt: 'text/plain; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  webmanifest: 'application/manifest+json',
};

function contentTypeFor(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

/**
 * Serve `<SITES_ROOT>/<slug>/<rest>` with the try_files behaviour the Caddy
 * snippets use: exact file, then `<rest>/index.html`, then the site's own
 * `index.html` so a client-routed page still resolves.
 *
 * Every candidate is re-resolved and checked to be inside the site directory,
 * so a `..` in the request path cannot read the host's filesystem.
 */
async function serveStatic(url: URL): Promise<Response> {
  const segments = url.pathname.split('/').filter((s) => s.length > 0);
  const slug = decodeURIComponent(segments[0] ?? '').toLowerCase();
  if (!slug || !SLUG_RE.test(slug)) {
    return new Response('Not found', { status: 404 });
  }
  const siteDir = resolve(SITES_ROOT, slug);
  if (!(await exists(siteDir))) {
    return new Response(`No site deployed for "${slug}"`, { status: 404 });
  }

  // A bare `/slug` must become `/slug/` or every relative asset on the page
  // resolves one level too high.
  if (segments.length === 1 && !url.pathname.endsWith('/')) {
    return Response.redirect(`${url.origin}${url.pathname}/${url.search}`, 308);
  }

  const rest = segments
    .slice(1)
    .map((segment) => decodeURIComponent(segment))
    .join('/');
  const candidates = rest
    ? [rest, `${rest}/index.html`, 'index.html']
    : ['index.html'];

  for (const candidate of candidates) {
    const target = resolve(siteDir, candidate);
    if (target !== siteDir && !target.startsWith(`${siteDir}/`)) continue;
    try {
      if (!(await stat(target)).isFile()) continue;
    } catch {
      continue;
    }
    return new Response(await readFile(target), {
      headers: {
        'Content-Type': contentTypeFor(target),
        // Dev only: a cached build is the fastest way to be confused about
        // whether a redeploy actually landed.
        'Cache-Control': 'no-store',
      },
    });
  }
  return new Response('Not found', { status: 404 });
}

const server = Bun.serve({
  port: PORT,
  hostname: '0.0.0.0',
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/health' && req.method === 'GET') {
      return jsonResponse({ ok: true, version: VERSION, mode: MODE });
    }

    // Unauthenticated on purpose: Caddy's on-demand TLS ask has no way to
    // send a bearer token. It is bound to loopback by the firewall and it
    // only ever reveals whether a given preview hostname is being served.
    if (url.pathname === '/tls-ask' && req.method === 'GET') {
      return handleTlsAsk(url.searchParams.get('domain'));
    }

    if (!authorized(req)) {
      return jsonResponse({ error: 'unauthorized' }, 401);
    }

    if (url.pathname.startsWith('/sites/')) {
      const slug = siteSlugFromPath(url.pathname);
      if (!slug) {
        return jsonResponse({ error: 'invalid slug' }, 400);
      }
      if (req.method === 'POST' && url.pathname === `/sites/${slug}/deploy`) {
        const body = await readBody(req);
        return handleDeploy(slug, body);
      }
      if (req.method === 'DELETE' && url.pathname === `/sites/${slug}`) {
        return handleRemove(slug);
      }
    }

    return jsonResponse({ error: 'not found' }, 404);
  },
});

const staticServer =
  STATIC_PORT !== null && Number.isFinite(STATIC_PORT)
    ? Bun.serve({
        port: STATIC_PORT,
        hostname: '0.0.0.0',
        fetch: (req) => serveStatic(new URL(req.url)),
      })
    : null;

console.info(
  `[deploy-agent] v${VERSION} mode=${MODE} listening on :${server.port} ` +
    `(sites root ${SITES_ROOT}, caddy snippets ${CADDY_SITES_DIR})`
);
if (staticServer) {
  console.info(
    `[deploy-agent] serving extracted sites on http://localhost:${staticServer.port}/{slug}/`
  );
}
