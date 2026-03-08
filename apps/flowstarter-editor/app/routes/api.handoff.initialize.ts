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
  const convexAdminKey = env.CONVEX_ADMIN_KEY || process.env.CONVEX_ADMIN_KEY || '';

  if (!convexUrl || !convexAdminKey) {
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
    // 1. Check if Convex project already exists for this Supabase UUID
    const existing = await convexQuery(convexUrl, convexAdminKey, 'projects:getBySupabaseId', { supabaseProjectId }) as { _id: string } | null;

    let convexProjectId: string;
    let urlId: string;

    if (existing) {
      convexProjectId = existing._id;
      // Find existing active conversation
      const convos = await convexQuery(convexUrl, convexAdminKey, 'conversations:getBySessionId', { sessionId: `project-${convexProjectId}` }) as Array<{ _id: string }>;
      if (convos?.length > 0) {
        return json({ conversationId: convos[0]._id });
      }
      urlId = convexProjectId; // fallback
    } else {
      // 2. Create Convex project
      const created = await convexMutation(convexUrl, convexAdminKey, 'projects:createEmpty', {
        name: projectName,
        description: projectDescription,
        supabaseProjectId,
        businessDetails: businessInfo ? { businessName: projectName, description: (businessInfo as { description?: string }).description || projectDescription, ...businessInfo } : { businessName: projectName, description: projectDescription },
      }) as { projectId: string; urlId: string };
      convexProjectId = created.projectId;
      urlId = created.urlId;
    }

    // 3. Create conversation
    const sessionId = `project-${convexProjectId}`;
    const step = hasBusinessData ? 'welcome' : (projectName && projectName !== 'Untitled Project' ? 'describe' : 'welcome');
    const conversationId = await convexMutation(convexUrl, convexAdminKey, 'conversations:createWithProject', {
      sessionId,
      projectId: convexProjectId,
      projectUrlId: urlId,
      projectName,
      projectDescription,
      step,
      businessInfo: businessInfo ? {
        description: (businessInfo as { description?: string }).description || projectDescription,
        uvp: (businessInfo as { uvp?: string }).uvp,
        targetAudience: (businessInfo as { targetAudience?: string }).targetAudience,
        industry: (businessInfo as { industry?: string }).industry,
        businessGoals: (businessInfo as { goal?: string }).goal ? [(businessInfo as { goal: string }).goal] : undefined,
        businessType: (businessInfo as { offerType?: string }).offerType,
      } : undefined,
    }) as string;

    return json({ conversationId });
  } catch (err) {
    console.error('[api.handoff.initialize] Error:', err);
    return json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
