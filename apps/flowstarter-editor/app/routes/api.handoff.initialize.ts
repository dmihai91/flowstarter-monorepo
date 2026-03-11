/**
 * POST /api/handoff/initialize
 *
 * Server-side handoff initialization. Validates the HMAC token and uses the
 * Convex admin key to create / find the project + conversation — so the
 * browser never needs an authenticated Convex WS connection.
 *
 * Request:  { token: string }
 * Response: { conversationId: string } | { error: string }
 */
import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';

// Re-export verifyToken from api.handoff.validate
async function verifyToken(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [dataPart, sigPart] = parts;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
  const sigBytes = Uint8Array.from(atob(sigPart.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const dataBytes = new TextEncoder().encode(dataPart);
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, dataBytes);
  if (!valid) return null;
  const payload = JSON.parse(atob(dataPart.replace(/-/g, '+').replace(/_/g, '/')));
  if (payload.exp && Date.now() / 1000 > payload.exp) return null;
  return payload;
}

interface CloudflareEnv {
  HANDOFF_SECRET?: string;
  CONVEX_URL?: string;
  CONVEX_ADMIN_KEY?: string;
}

async function convexMutation(convexUrl: string, adminKey: string, path: string, args: Record<string, unknown>) {
  const res = await fetch(`${convexUrl}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Convex ${adminKey}` },
    body: JSON.stringify({ path, args, format: 'json' }),
  });
  const data = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (data.status !== 'success') throw new Error(data.errorMessage || `Convex mutation ${path} failed`);
  return data.value;
}

async function convexQuery(convexUrl: string, adminKey: string, path: string, args: Record<string, unknown>) {
  const res = await fetch(`${convexUrl}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Convex ${adminKey}` },
    body: JSON.stringify({ path, args, format: 'json' }),
  });
  const data = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (data.status !== 'success') throw new Error(data.errorMessage || `Convex query ${path} failed`);
  return data.value;
}

function getSessionId(): string {
  // Generate a deterministic session ID for server-side use
  return `server-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  const env = (context?.cloudflare?.env || context?.env || {}) as CloudflareEnv;
  const secret = env.HANDOFF_SECRET || process.env.HANDOFF_SECRET || process.env.VITE_HANDOFF_SECRET || 'dev-secret';
  const convexUrl = env.CONVEX_URL || process.env.VITE_CONVEX_URL || '';
  // Convex site URL (for HTTP Actions) — different from the deployment URL
  const convexSiteUrl = (env as Record<string,string>).CONVEX_SITE_URL || process.env.CONVEX_SITE_URL || convexUrl.replace('.convex.cloud', '.convex.site');

  if (!convexUrl) {
    return json({ error: 'Convex not configured' }, { status: 503 });
  }

  let token: string;
  try {
    const body = await request.json() as { token?: string };
    token = body.token || '';
  } catch {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!token) return json({ error: 'Missing token' }, { status: 400 });

  // Verify token
  const payload = await verifyToken(token, secret);
  if (!payload) return json({ error: 'Invalid or expired token' }, { status: 401 });

  const supabaseProjectId = payload.projectId as string;
  const projectData = payload.project as { name?: string; description?: string; data?: Record<string, unknown> } | undefined;
  const projectName = projectData?.name || 'Untitled Project';
  const projectDescription = projectData?.description || '';
  const data = projectData?.data as Record<string, unknown> | undefined;
  const businessInfo = data?.businessInfo as Record<string, unknown> | undefined;
  const hasBusinessData = !!(
    (businessInfo as { description?: string })?.description ||
    projectDescription.length > 10
  );

  try {
    // Call Convex HTTP Action (no admin key needed — secured by HANDOFF_SECRET)
    const convexActionUrl = `${convexSiteUrl}/handoff/initialize`;
    const convexRes = await fetch(convexActionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-handoff-secret': secret,
      },
      body: JSON.stringify({
        supabaseProjectId,
        projectName,
        projectDescription,
        businessInfo,
        step: hasBusinessData ? 'template' : (projectName && projectName !== 'Untitled Project' ? 'describe' : 'welcome'),
      }),
    });

    if (!convexRes.ok) {
      const errBody = await convexRes.json().catch(() => ({})) as { error?: string };
      throw new Error(`Convex action failed: ${errBody.error || convexRes.status}`);
    }

    const { conversationId } = await convexRes.json() as { conversationId: string };
    return json({ conversationId })
  } catch (err) {
    console.error('[api.handoff.initialize] Error:', err);
    return json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
