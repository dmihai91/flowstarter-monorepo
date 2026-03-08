/**
 * Handoff Validation API (Editor)
 *
 * Validates HMAC-signed handoff tokens issued by the main platform.
 * Tokens are self-contained — no round-trip to the main platform needed.
 *
 * Format: base64url(json_payload) + "." + base64url(hmac_sha256)
 *
 * GET  /api/handoff/validate?token=xxx  → { valid, projectId, userId }
 * POST /api/handoff/validate            → body { token } → { valid, project, userId }
 */

import { createHmac } from 'crypto';
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node';

// Shared secret — must match HANDOFF_SECRET in the main platform
const HANDOFF_SECRET =
  process.env.HANDOFF_SECRET || process.env.VITE_HANDOFF_SECRET || 'dev-secret';

// ─── Token payload shape ──────────────────────────────────────────────────────

interface HandoffPayload {
  projectId: string;
  userId: string;
  iat: number;
  exp: number;
  project: {
    id: string;
    name: string;
    description: string;
    data: Record<string, unknown>;
  };
}

// ─── Verify helper ────────────────────────────────────────────────────────────

function verifyToken(token: string): HandoffPayload | null {
  try {
    const dotIdx = token.lastIndexOf('.');
    if (dotIdx === -1) return null;

    const data = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);

    const expectedSig = createHmac('sha256', HANDOFF_SECRET)
      .update(data)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    if (sig.length !== expectedSig.length) return null;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) {
      diff |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (diff !== 0) return null;

    const payload = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf8')
    ) as HandoffPayload;

    // Check expiry
    if (Math.floor(Date.now() / 1000) > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

// ─── GET /api/handoff/validate?token=xxx ─────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return json({ valid: false, error: 'Token required' }, { status: 400 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return json({ valid: false, error: 'Invalid or expired token' }, { status: 401 });
  }

  return json({
    valid: true,
    projectId: payload.projectId,
    userId: payload.userId,
  });
}

// ─── POST /api/handoff/validate ───────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json() as { token?: string };
  const token = body.token;

  if (!token) {
    return json({ valid: false, error: 'Token required' }, { status: 400 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return json({ valid: false, error: 'Invalid or expired token' }, { status: 401 });
  }

  return json({
    valid: true,
    projectId: payload.projectId,
    userId: payload.userId,
    project: payload.project,
  });
}
