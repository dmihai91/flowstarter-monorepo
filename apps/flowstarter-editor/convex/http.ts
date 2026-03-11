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

// ─── Files Save ─────────────────────────────────────────────────────
const filesSaveBatch = httpAction(async (ctx, request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Handoff-Secret' } });
  }

  const expectedSecret = process.env.HANDOFF_SECRET;
  const incomingSecret = request.headers.get('x-handoff-secret');
  if (!expectedSecret || incomingSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  let body: { supabaseProjectId: string; files: Array<{ path: string; content: string }> };
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }

  const { supabaseProjectId, files } = body;
  if (!supabaseProjectId || !files?.length) {
    return new Response(JSON.stringify({ error: 'Missing supabaseProjectId or files' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    // Find or create the Convex project
    let project = await ctx.runQuery(api.projects.getBySupabaseId, { supabaseProjectId }) as { _id: string } | null;
    if (!project) {
      // Create a minimal project
      const created = await ctx.runMutation(api.projects.createEmpty, {
        name: supabaseProjectId, description: '', supabaseProjectId,
      }) as { projectId: string };
      project = { _id: created.projectId };
    }

    // Save files
    const fileIds = await ctx.runMutation(api.files.saveBatch, {
      projectId: project._id as any,
      files: files.map((f) => ({ path: f.path, content: f.content, type: 'file' as const })),
    });

    return new Response(JSON.stringify({ saved: fileIds.length, projectId: project._id }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[files/save-batch]', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

http.route({ path: '/files/save-batch', method: 'POST', handler: filesSaveBatch });
http.route({ path: '/files/save-batch', method: 'OPTIONS', handler: filesSaveBatch });

// ─── Cost Logging ───────────────────────────────────────────────────
const costsLog = httpAction(async (ctx, request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Handoff-Secret' } });
  }

  const expectedSecret = process.env.HANDOFF_SECRET;
  const incomingSecret = request.headers.get('x-handoff-secret');
  if (!expectedSecret || incomingSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  let body: {
    supabaseProjectId: string;
    operation: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    costUSD: number;
    durationMs?: number;
  };
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }

  const { supabaseProjectId, operation, model, promptTokens, completionTokens, costUSD, durationMs } = body;
  if (!supabaseProjectId || !model) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    // Find the Convex project by Supabase ID
    const project = await ctx.runQuery(api.projects.getBySupabaseId, { supabaseProjectId }) as { _id: string } | null;

    // Log cost to Convex
    const costId = await ctx.runMutation(api.costs.logCost, {
      projectId: project?._id,
      operation: operation as any,
      model,
      promptTokens: promptTokens || 0,
      completionTokens: completionTokens || 0,
      totalTokens: (promptTokens || 0) + (completionTokens || 0),
      costUSD: costUSD || 0,
      durationMs,
    });

    // Get updated totals for this project
    let totalCostUSD = costUSD;
    let totalCredits = Math.ceil(costUSD / 0.01);
    if (project) {
      const projectCosts = await ctx.runQuery(api.costs.getProjectCosts, { projectId: project._id as any });
      totalCostUSD = projectCosts.summary.totalCostUSD;
      totalCredits = Math.ceil(totalCostUSD / 0.01);
    }

    return new Response(JSON.stringify({
      costId,
      totalCostUSD,
      totalCredits,
      projectId: project?._id,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[costs/log]', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

http.route({ path: '/costs/log', method: 'POST', handler: costsLog });
http.route({ path: '/costs/log', method: 'OPTIONS', handler: costsLog });

// ─── Cost Totals (for syncing to Supabase) ──────────────────────────
const costsTotals = httpAction(async (ctx, request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Handoff-Secret' } });
  }

  const expectedSecret = process.env.HANDOFF_SECRET;
  const incomingSecret = request.headers.get('x-handoff-secret');
  if (!expectedSecret || incomingSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const url = new URL(request.url);
  const supabaseProjectId = url.searchParams.get('supabaseProjectId');
  if (!supabaseProjectId) {
    return new Response(JSON.stringify({ error: 'Missing supabaseProjectId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const project = await ctx.runQuery(api.projects.getBySupabaseId, { supabaseProjectId }) as { _id: string } | null;
    if (!project) {
      return new Response(JSON.stringify({ totalCostUSD: 0, totalCredits: 0, operations: 0 }), { headers: { 'Content-Type': 'application/json' } });
    }

    const projectCosts = await ctx.runQuery(api.costs.getProjectCosts, { projectId: project._id as any });
    return new Response(JSON.stringify({
      totalCostUSD: projectCosts.summary.totalCostUSD,
      totalCredits: Math.ceil(projectCosts.summary.totalCostUSD / 0.01),
      totalTokens: projectCosts.summary.totalTokens,
      operations: projectCosts.summary.operationCount,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[costs/totals]', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

http.route({ path: '/costs/totals', method: 'GET', handler: costsTotals });
http.route({ path: '/costs/totals', method: 'OPTIONS', handler: costsTotals });
