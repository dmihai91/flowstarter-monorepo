/**
 * Shared plumbing for the showcase recording run.
 *
 * The rule this file exists to enforce: a clip is a recording of the running
 * system or it does not exist. There is no fixture data here, no stubbed route
 * and no fake latency — the only thing it does to the app is drive it the way a
 * person would, and read back what the app itself persisted.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

export const OUT = 'artifacts/showcase';
export const VID = join(OUT, 'video');
export const RAW = join(OUT, 'raw');
export const APP = process.env.APP_ORIGIN || 'http://localhost:3000';
export const DESKTOP = { width: 1280, height: 800 };
export const MOBILE = { width: 390, height: 844 };

export const ensureDirs = () => {
  for (const d of [OUT, VID, RAW]) mkdirSync(d, { recursive: true });
};

/** Env from the app's own files — never a second copy that can drift. */
export function loadEnv() {
  const of = (p) => (existsSync(p)
    ? Object.fromEntries(readFileSync(p, 'utf8').split('\n')
        .filter((l) => /^[A-Z]/.test(l))
        .map((l) => [l.split('=')[0], l.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '')]))
    : {});
  return { ...of('apps/flowstarter-main/.env'), ...of('apps/flowstarter-main/.env.local') };
}

/**
 * The two Clerk users the recorders film with.
 *
 * `retake-users.mjs mint` is the only thing that creates them and it writes
 * /tmp/retake-users.json, so that file is read first. The older
 * /tmp/showcase-users.json is still honoured when it is the only one there,
 * but nothing writes it any more: its accounts were minted once and then
 * deleted by a teardown, and the stale ids it kept serving failed the claim
 * with `sign_in_tokens -> 404` — a run that had filmed perfectly well.
 */
export const users = () => {
  for (const f of ['/tmp/retake-users.json', '/tmp/showcase-users.json']) {
    if (existsSync(f)) return JSON.parse(readFileSync(f, 'utf8'));
  }
  throw new Error('no filming users on disk — run: node e2e/support/retake-users.mjs mint');
};

const SUPABASE = 'http://127.0.0.1:54321';

/** Read-only helper for asserting what the server actually stored. */
export async function db(path) {
  const KEY = loadEnv().SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${SUPABASE}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

export const pause = (page, ms) =>
  page.evaluate((m) => new Promise((r) => setTimeout(r, m)), ms).catch(() => {});

/** Scrolls at a speed a viewer can actually read. */
export async function slowScroll(page, steps = 12, step = 480, wait = 300) {
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; }).catch(() => {});
  for (let i = 0; i < steps; i += 1) {
    await page.evaluate((y) => window.scrollBy(0, y), step).catch(() => {});
    await pause(page, wait);
  }
}

/**
 * A recorded clip: one context, one page, one video file.
 *
 * `video.saveAs` is used rather than renaming by directory listing — the
 * listing raced the muxer finishing and silently mixed two clips up once.
 */
export async function clip(browser, name, opts, fn) {
  const size = opts.size ?? DESKTOP;
  const ctx = await browser.newContext({
    viewport: size,
    recordVideo: { dir: RAW, size },
    deviceScaleFactor: 1,
    storageState: opts.storageState,
    ...(opts.contextOptions ?? {}),
  });
  const page = await ctx.newPage();
  const video = page.video();
  const started = Date.now();
  let error = null;
  try {
    await fn(page, ctx);
  } catch (err) {
    error = err;
    console.error(`  ! ${name}: ${err.message.split('\n')[0]}`);
    // The failure stays on screen for a beat so the clip shows it rather than
    // cutting to black — a failed step is still evidence.
    await pause(page, 2500);
  }
  const seconds = Math.round((Date.now() - started) / 1000);
  if (opts.saveState) await ctx.storageState({ path: opts.saveState }).catch(() => {});
  await ctx.close();
  if (video) await video.saveAs(join(VID, `${name}.webm`));
  console.log(`  recorded ${name} (${seconds}s)${error ? ' [with failure]' : ''}`);
  return { name, seconds, error: error ? error.message.split('\n')[0] : null };
}

/** ffmpeg, only if it actually loads — a broken install must not fail a run. */
export function ffmpegOk() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'pipe' });
    return true;
  } catch { return false; }
}

/**
 * Cuts one continuous take into chapters. Re-encodes rather than stream-copies:
 * a copy can only cut on a keyframe, which slid the boundaries by seconds and
 * put the end of one clip at the head of the next.
 */
export function cut(src, dest, startSec, endSec) {
  const args = ['-y', '-ss', String(startSec)];
  if (endSec != null) args.push('-to', String(endSec));
  // libvpx defaults to a very slow single-threaded encode; these settings cut
  // the assembly from minutes per clip to seconds without a visible quality
  // difference at this resolution.
  args.push('-i', src, '-c:v', 'libvpx', '-b:v', '1400k',
    '-deadline', 'good', '-cpu-used', '5', '-threads', '4', '-an', dest);
  execFileSync('ffmpeg', args, { stdio: 'pipe' });
}

/**
 * Joins segments into one clip.
 *
 * Some steps need two different browser contexts to be honest — an operator's
 * session cannot also be the client's — and each context produces its own
 * video. Rather than re-enact one side in the other's session, the two real
 * recordings are joined. Every input is scaled and padded to the same frame so
 * a phone-sized segment can sit next to a desktop one without stretching it.
 */
export function concat(sources, dest, size = DESKTOP) {
  const { width: w, height: h } = size;
  const norm = sources.map((src, i) => {
    const out = join(RAW, `norm-${i}-${Date.now()}.webm`);
    execFileSync('ffmpeg', ['-y', '-i', src,
      '-vf', `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black,fps=25,setsar=1`,
      '-c:v', 'libvpx', '-b:v', '1400k',
      '-deadline', 'good', '-cpu-used', '5', '-threads', '4', '-an', out], { stdio: 'pipe' });
    return out;
  });
  const list = join(RAW, `list-${Date.now()}.txt`);
  writeFileSync(list, norm.map((f) => `file '${process.cwd()}/${f}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', list,
    '-c:v', 'libvpx', '-b:v', '1400k',
    '-deadline', 'good', '-cpu-used', '5', '-threads', '4', '-an', dest], { stdio: 'pipe' });
}

export function writeManifest(patch) {
  const p = join(OUT, 'manifest.json');
  const cur = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
  const next = { ...cur, ...patch, clips: { ...(cur.clips ?? {}), ...(patch.clips ?? {}) } };
  writeFileSync(p, JSON.stringify(next, null, 2));
  return next;
}

/**
 * Signs a user in with a Clerk sign-in ticket.
 *
 * The visible password form cannot be driven here, and not for a reason worth
 * hiding: this Clerk instance answers `signIn.create` with
 * `needs_client_trust` — its bot protection — which a headless browser cannot
 * satisfy. (The app then reports "Incorrect email or password", which is a
 * genuine bug in its error mapping; the credentials verify fine against
 * Clerk's own `verify_password` endpoint.)
 *
 * So the session is created the way Clerk documents for automation: the
 * backend mints a short-lived, single-use sign-in token for that specific user
 * and the browser redeems it through Clerk's own client. The resulting session
 * is a real one — real user, real role, real cookies. What is NOT filmed is a
 * human typing a password, and the showcase page says so.
 */
export async function signInWithTicket(page, user, landing = '/login') {
  const SK = loadEnv().CLERK_SECRET_KEY;
  const res = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: { Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id, expires_in_seconds: 600 }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`sign_in_tokens -> ${res.status}`);

  await page.goto(`${APP}${landing}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.Clerk && window.Clerk.loaded, { timeout: 40000 });
  const out = await page.evaluate(async (ticket) => {
    try {
      const si = await window.Clerk.client.signIn.create({ strategy: 'ticket', ticket });
      if (si.status !== 'complete') return { status: si.status };
      await window.Clerk.setActive({ session: si.createdSessionId });
      return { status: 'complete' };
    } catch (e) { return { error: String(e).slice(0, 200) }; }
  }, body.token);
  if (out.status !== 'complete') {
    throw new Error(`clerk ticket sign-in: ${JSON.stringify(out)}`);
  }
  await pause(page, 1500);
}

export const signInAsOperator = (page, user) =>
  signInWithTicket(page, user, '/admin/login');
export const signInAsClient = (page, user) =>
  signInWithTicket(page, user, '/login');

/**
 * Redeems a ticket on the page already open, without navigating.
 *
 * The wizard's claim button is one control that reads "Sign in and claim my
 * site" while signed out and "Claim my site" once signed in. Navigating away
 * to sign in would destroy the generated preview held in React state, so the
 * session is established in place and the button is filmed changing — which is
 * the honest picture of what the visitor's click does.
 */
export async function signInInPlace(page, user) {
  const SK = loadEnv().CLERK_SECRET_KEY;
  const res = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: { Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id, expires_in_seconds: 600 }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`sign_in_tokens -> ${res.status}`);
  await page.waitForFunction(() => window.Clerk && window.Clerk.loaded, { timeout: 40000 });
  const out = await page.evaluate(async (ticket) => {
    try {
      const si = await window.Clerk.client.signIn.create({ strategy: 'ticket', ticket });
      if (si.status !== 'complete') return { status: si.status };
      await window.Clerk.setActive({ session: si.createdSessionId });
      return { status: 'complete' };
    } catch (e) { return { error: String(e).slice(0, 200) }; }
  }, body.token);
  if (out.status !== 'complete') throw new Error(`in-place sign-in: ${JSON.stringify(out)}`);
}
