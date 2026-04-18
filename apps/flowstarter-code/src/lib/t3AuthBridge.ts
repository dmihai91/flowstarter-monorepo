/**
 * T3 Code auth bridge.
 *
 * Two-step bootstrap:
 *   1. Exchange the shared seed token (T3CODE_AUTH_TOKEN, also passed to T3
 *      at startup as `desktopBootstrapToken`) for a long-lived owner bearer
 *      session. Persisted to disk so Next.js restarts don't re-consume the
 *      single-use seed.
 *   2. For each Clerk-authenticated user, mint a fresh pairing credential
 *      using the owner bearer. The client posts that credential to the T3
 *      /api/auth/bootstrap endpoint which sets a scoped T3 session cookie.
 */

import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

interface OwnerBearer {
  readonly sessionToken: string;
  // ISO-8601 timestamp issued by T3.
  readonly expiresAt: string;
}

interface PairingCredential {
  readonly credential: string;
  readonly expiresAt: string;
}

interface T3BootstrapBearerResponse {
  readonly authenticated: true;
  readonly role: string;
  readonly sessionMethod: 'bearer-session-token';
  readonly expiresAt: string;
  readonly sessionToken: string;
}

interface T3PairingCredentialResponse {
  readonly id: string;
  readonly credential: string;
  readonly label?: string;
  readonly expiresAt: string;
}

interface T3ClientSession {
  readonly sessionId: string;
  readonly client: {
    readonly label?: string;
  };
}

// Refresh the bearer before it actually expires to avoid race windows.
const REFRESH_BUFFER_MS = 5 * 60_000;

function t3Host(): string {
  return process.env.T3_HOST ?? 'http://127.0.0.1:3774';
}

function bearerStatePath(): string {
  const base = process.env.T3CODE_HOME
    ? path.join(process.env.T3CODE_HOME, '.flowstarter-wrapper')
    : path.join(os.tmpdir(), 'flowstarter-wrapper');
  return path.join(base, 'owner-bearer.json');
}

async function readPersistedBearer(): Promise<OwnerBearer | null> {
  try {
    const raw = await fs.readFile(bearerStatePath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<OwnerBearer>;
    if (typeof parsed.sessionToken === 'string' && typeof parsed.expiresAt === 'string') {
      return { sessionToken: parsed.sessionToken, expiresAt: parsed.expiresAt };
    }
    return null;
  } catch {
    return null;
  }
}

async function writePersistedBearer(bearer: OwnerBearer): Promise<void> {
  const filePath = bearerStatePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(bearer), { mode: 0o600 });
}

function isBearerUsable(bearer: OwnerBearer | null): bearer is OwnerBearer {
  if (!bearer) return false;
  const expiresMs = Date.parse(bearer.expiresAt);
  if (!Number.isFinite(expiresMs)) return false;
  return expiresMs - Date.now() > REFRESH_BUFFER_MS;
}

let cachedBearer: OwnerBearer | null = null;
let bearerInFlight: Promise<OwnerBearer> | null = null;

async function exchangeSeedForBearer(): Promise<OwnerBearer> {
  const seed = process.env.T3CODE_AUTH_TOKEN;
  if (!seed) {
    throw new Error(
      'T3CODE_AUTH_TOKEN is not set — cannot bootstrap the T3 owner session.',
    );
  }
  const res = await fetch(`${t3Host()}/api/auth/bootstrap/bearer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: seed }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`T3 /api/auth/bootstrap/bearer failed: ${res.status} ${text}`);
  }
  const body = (await res.json()) as T3BootstrapBearerResponse;
  const bearer: OwnerBearer = {
    sessionToken: body.sessionToken,
    expiresAt: body.expiresAt,
  };
  await writePersistedBearer(bearer);
  return bearer;
}

async function loadOwnerBearer(forceRefresh = false): Promise<OwnerBearer> {
  if (!forceRefresh && isBearerUsable(cachedBearer)) return cachedBearer;

  if (!forceRefresh && cachedBearer === null) {
    const persisted = await readPersistedBearer();
    if (isBearerUsable(persisted)) {
      cachedBearer = persisted;
      return persisted;
    }
  }

  if (bearerInFlight) return bearerInFlight;

  bearerInFlight = exchangeSeedForBearer()
    .then((bearer) => {
      cachedBearer = bearer;
      return bearer;
    })
    .finally(() => {
      bearerInFlight = null;
    });

  return bearerInFlight;
}

async function requestPairingCredential(
  bearer: OwnerBearer,
  label: string,
): Promise<Response> {
  return fetch(`${t3Host()}/api/auth/pairing-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bearer.sessionToken}`,
    },
    body: JSON.stringify({ label }),
  });
}

export async function mintPairingCredential(label: string): Promise<PairingCredential> {
  let bearer = await loadOwnerBearer();
  let res = await requestPairingCredential(bearer, label);

  if (res.status === 401) {
    // Bearer was revoked or is stale — drop the cache and try once with a fresh seed exchange.
    cachedBearer = null;
    bearer = await loadOwnerBearer(true);
    res = await requestPairingCredential(bearer, label);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`T3 /api/auth/pairing-token failed: ${res.status} ${text}`);
  }

  const body = (await res.json()) as T3PairingCredentialResponse;
  return { credential: body.credential, expiresAt: body.expiresAt };
}

async function authorizedRequest(
  method: string,
  path: string,
  body: unknown,
): Promise<Response> {
  let bearer = await loadOwnerBearer();
  const request = () =>
    fetch(`${t3Host()}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearer.sessionToken}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  let res = await request();
  if (res.status === 401) {
    cachedBearer = null;
    bearer = await loadOwnerBearer(true);
    res = await request();
  }
  return res;
}

/**
 * Revoke every T3 client session whose client label matches `label`.
 *
 * Called on Clerk sign-out with `label: clerk:<userId>` so the T3 session that
 * backed the iframe is terminated server-side, not just cookie-cleared.
 */
export async function revokeClientSessionsByLabel(label: string): Promise<number> {
  const listRes = await authorizedRequest('GET', '/api/auth/clients', undefined);
  if (!listRes.ok) {
    const text = await listRes.text().catch(() => '');
    throw new Error(`T3 /api/auth/clients failed: ${listRes.status} ${text}`);
  }
  const sessions = (await listRes.json()) as ReadonlyArray<T3ClientSession>;
  const matches = sessions.filter((s) => s.client.label === label);

  let revoked = 0;
  for (const match of matches) {
    const revokeRes = await authorizedRequest('POST', '/api/auth/clients/revoke', {
      sessionId: match.sessionId,
    });
    if (revokeRes.ok) revoked += 1;
  }
  return revoked;
}
