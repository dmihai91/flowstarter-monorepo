import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';

const http = httpRouter();

const handoffInitialize = httpAction(async (ctx, request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Handoff-Secret',
      },
    });
  }

  const expectedSecret = process.env.HANDOFF_SECRET;
  const incomingSecret = request.headers.get('x-handoff-secret');
  if (!expectedSecret || incomingSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { supabaseProjectId: string; projectName: string; projectDescription?: string; businessInfo?: Record<string, unknown>; step?: string };
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }

  const { supabaseProjectId, projectName, projectDescription = '', businessInfo, step = 'welcome' } = body;
  if (!supabaseProjectId) return new Response(JSON.stringify({ error: 'Missing supabaseProjectId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  try {
    const existing = await ctx.runQuery(api.projects.getBySupabaseId, { supabaseProjectId }) as { _id: string; urlId?: string } | null;
    let convexProjectId: string;
    let urlId: string;

    if (existing) {
      convexProjectId = existing._id;
      urlId = existing.urlId || convexProjectId;
      const convos = await ctx.runQuery(api.conversations.getByProject, { projectId: existing._id as never }) as Array<{ _id: string }> | null;
      if (convos && convos.length > 0) {
        return new Response(JSON.stringify({ conversationId: convos[0]._id }), { headers: { 'Content-Type': 'application/json' } });
      }
    } else {
      const created = await ctx.runMutation(api.projects.createEmpty, {
        name: projectName, description: projectDescription, supabaseProjectId,
        // createEmpty has strict businessDetails schema — only pass allowed fields
        businessDetails: {
          businessName: projectName,
          description: (businessInfo as { description?: string })?.description || projectDescription,
          targetAudience: (businessInfo as { targetAudience?: string })?.targetAudience,
          goals: (businessInfo as { goal?: string })?.goal ? [(businessInfo as { goal: string }).goal] : undefined,
        },
      }) as { projectId: string; urlId: string };
      convexProjectId = created.projectId;
      urlId = created.urlId;
    }

    const bi = businessInfo as { description?: string; uvp?: string; targetAudience?: string; industry?: string; goal?: string; offerType?: string } | undefined;
    const conversationId = await ctx.runMutation(api.conversations.createWithProject, {
      sessionId: `project-${convexProjectId}`,
      projectId: convexProjectId as never,
      projectUrlId: urlId,
      projectName, projectDescription, step,
      businessInfo: bi ? { description: bi.description || projectDescription, uvp: bi.uvp, targetAudience: bi.targetAudience, industry: bi.industry, businessGoals: bi.goal ? [bi.goal] : undefined, businessType: bi.offerType } : undefined,
    }) as string;

    return new Response(JSON.stringify({ conversationId }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[handoff/initialize]', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

http.route({ path: '/handoff/initialize', method: 'POST', handler: handoffInitialize });
http.route({ path: '/handoff/initialize', method: 'OPTIONS', handler: handoffInitialize });

export default http;
