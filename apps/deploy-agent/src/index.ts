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
const VERSION = '0.1.0';

if (!SHARED_SECRET) {
  console.error(
    '[deploy-agent] DEPLOY_AGENT_SHARED_SECRET is not set. Refusing to start.'
  );
  process.exit(1);
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;

interface DeployBody {
  artifact_url: string;
  artifact_sha256?: string | null;
  primary_domain?: string | null;
  additional_domains?: string[];
}

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
  return `# Managed by flowstarter deploy-agent — site ${slug}\n${hosts.join(', ')} {\n  encode gzip zstd\n  root * ${rootDir}\n  try_files {path} {path}/ /index.html\n  file_server\n}\n`;
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

async function handleDeploy(slug: string, body: DeployBody): Promise<Response> {
  if (typeof body.artifact_url !== 'string' || !body.artifact_url) {
    return jsonResponse({ error: 'artifact_url required' }, 400);
  }
  await ensureDirs();

  let fetched;
  try {
    fetched = await fetchAndVerify(body.artifact_url, body.artifact_sha256 ?? null);
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : 'fetch failed' },
      502
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
  const snippet = buildCaddySnippet(
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
  const text = await req.text();
  if (!text) return { artifact_url: '' };
  try {
    return JSON.parse(text) as DeployBody;
  } catch {
    return { artifact_url: '' };
  }
}

const server = Bun.serve({
  port: PORT,
  hostname: '0.0.0.0',
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/health' && req.method === 'GET') {
      return jsonResponse({ ok: true, version: VERSION });
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

console.info(
  `[deploy-agent] v${VERSION} listening on :${server.port} (sites root ${SITES_ROOT}, caddy snippets ${CADDY_SITES_DIR})`
);
