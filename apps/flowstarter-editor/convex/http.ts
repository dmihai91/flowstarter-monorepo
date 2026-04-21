import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';
import type { Id } from './_generated/dataModel';

/**
 * Convex HTTP actions.
 *
 * These are the only entrypoints flowstarter-main calls to talk to the
 * Convex deployment (alongside the regular Convex HTTP client used by the
 * editor wrappers). Secured by a shared HANDOFF_SECRET header.
 *
 * Routes:
 *   - POST /handoff/initialize  — Create/refresh a Convex project row when
 *                                 flowstarter-main hands a project off to
 *                                 the editor.
 *   - POST /magicLinks/create   — Mint a magic link + ensure the client row
 *                                 exists. Used by send-to-client.
 *   - POST /costs/log           — Append an LLM cost entry for billing.
 *   - GET  /costs/totals        — Get rolled-up cost totals for a project.
 *   - POST /reviewArtifacts/upsert — Store generation/review blobs for a Supabase project.
 *   - GET  /reviewArtifacts     — Fetch generation/review blobs by supabaseProjectId.
 */

const http = httpRouter();

const corsPreflight = (allowedMethods: string) =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': `${allowedMethods}, OPTIONS`,
      'Access-Control-Allow-Headers': 'Content-Type, X-Handoff-Secret',
    },
  });

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function requireHandoffSecret(request: Request): Response | null {
  const expected = process.env.HANDOFF_SECRET;
  const incoming = request.headers.get('x-handoff-secret');
  if (!expected || incoming !== expected) {
    return jsonResponse(401, { error: 'Unauthorized' });
  }
  return null;
}

// ─── /handoff/initialize ──────────────────────────────────────────────────

const handoffInitialize = httpAction(async (ctx, request) => {
  if (request.method === 'OPTIONS') return corsPreflight('POST');

  const denied = requireHandoffSecret(request);
  if (denied) return denied;

  let body: {
    supabaseProjectId: string;
    projectName: string;
    projectDescription?: string;
    templateId?: string;
    templateName?: string;
    selectedPalette?: unknown;
    selectedFont?: unknown;
    createdBy?: string;
    clientId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON' });
  }

  if (!body.supabaseProjectId || !body.projectName) {
    return jsonResponse(400, {
      error: 'supabaseProjectId and projectName are required',
    });
  }

  try {
    const result = (await ctx.runMutation(api.projects.upsertFromMain, {
      supabaseProjectId: body.supabaseProjectId,
      projectName: body.projectName,
      projectDescription: body.projectDescription,
      templateId: body.templateId,
      templateName: body.templateName,
      selectedPalette: body.selectedPalette as never,
      selectedFont: body.selectedFont as never,
      createdBy: body.createdBy,
      clientId: body.clientId as never,
    })) as { projectId: string; urlId: string; skipped?: boolean };

    return jsonResponse(200, {
      projectId: result.projectId,
      urlId: result.urlId,
      existed: !!result.skipped,
    });
  } catch (err) {
    console.error('[handoff/initialize]', err);
    return jsonResponse(500, {
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
});

http.route({ path: '/handoff/initialize', method: 'POST', handler: handoffInitialize });
http.route({ path: '/handoff/initialize', method: 'OPTIONS', handler: handoffInitialize });

// ─── /magicLinks/create ───────────────────────────────────────────────────

const magicLinksCreate = httpAction(async (ctx, request) => {
  if (request.method === 'OPTIONS') return corsPreflight('POST');

  const denied = requireHandoffSecret(request);
  if (denied) return denied;

  let body: {
    supabaseProjectId?: string;
    convexProjectId?: string;
    clientEmail: string;
    clientName: string;
    accessLevel?: 'view' | 'customize' | 'full';
    expiresInDays?: number;
    maxUses?: number;
    createdBy?: string;
  };

  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON' });
  }

  if (!body.clientEmail || !body.clientName) {
    return jsonResponse(400, {
      error: 'clientEmail and clientName are required',
    });
  }

  try {
    // Resolve Convex project
    let projectId: Id<'projects'> | undefined;
    if (body.convexProjectId) {
      projectId = body.convexProjectId as Id<'projects'>;
    } else if (body.supabaseProjectId) {
      const project = (await ctx.runQuery(api.projects.getBySupabaseId, {
        supabaseProjectId: body.supabaseProjectId,
      })) as { _id: Id<'projects'> } | null;
      projectId = project?._id;
    }

    if (!projectId) {
      return jsonResponse(404, {
        error: 'Project not found in Convex — run handoff/initialize first',
      });
    }

    // Upsert client
    let client = (await ctx.runQuery(api.clients.getByEmail, {
      email: body.clientEmail,
    })) as { _id: Id<'clients'> } | null;

    if (!client) {
      const created = (await ctx.runMutation(api.clients.create, {
        email: body.clientEmail,
        name: body.clientName,
      })) as { success: boolean; clientId: Id<'clients'>; error?: string };
      if (!created.clientId) {
        return jsonResponse(500, {
          error: created.error ?? 'Failed to create client',
        });
      }
      client = { _id: created.clientId };
    }

    const linkResult = (await ctx.runMutation(api.magicLinks.create, {
      clientId: client._id,
      projectId,
      accessLevel: body.accessLevel ?? 'customize',
      expiresInDays: body.expiresInDays,
      maxUses: body.maxUses,
      createdBy: body.createdBy,
    })) as { success: boolean; token?: string; linkId?: string; error?: string };

    if (!linkResult.success) {
      return jsonResponse(400, { error: linkResult.error ?? 'Link creation failed' });
    }

    return jsonResponse(200, {
      token: linkResult.token,
      linkId: linkResult.linkId,
      projectId: projectId,
      clientId: client._id,
    });
  } catch (err) {
    console.error('[magicLinks/create]', err);
    return jsonResponse(500, {
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
});

http.route({ path: '/magicLinks/create', method: 'POST', handler: magicLinksCreate });
http.route({ path: '/magicLinks/create', method: 'OPTIONS', handler: magicLinksCreate });

// ─── /costs/log ───────────────────────────────────────────────────────────

const costsLog = httpAction(async (ctx, request) => {
  if (request.method === 'OPTIONS') return corsPreflight('POST');

  const denied = requireHandoffSecret(request);
  if (denied) return denied;

  let body: {
    supabaseProjectId?: string;
    convexProjectId?: string;
    operation: string;
    model: string;
    promptTokens?: number;
    completionTokens?: number;
    costUSD?: number;
    durationMs?: number;
  };

  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON' });
  }

  if (!body.model || !body.operation) {
    return jsonResponse(400, { error: 'operation and model are required' });
  }

  try {
    let projectId: Id<'projects'> | undefined;
    if (body.convexProjectId) {
      projectId = body.convexProjectId as Id<'projects'>;
    } else if (body.supabaseProjectId) {
      const p = (await ctx.runQuery(api.projects.getBySupabaseId, {
        supabaseProjectId: body.supabaseProjectId,
      })) as { _id: Id<'projects'> } | null;
      projectId = p?._id;
    }

    const promptTokens = body.promptTokens ?? 0;
    const completionTokens = body.completionTokens ?? 0;
    const costUSD = body.costUSD ?? 0;

    const costId = await ctx.runMutation(api.costs.logCost, {
      projectId,
      operation: body.operation as never,
      model: body.model,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      costUSD,
      durationMs: body.durationMs,
    });

    let totals = { totalCostUSD: costUSD };
    if (projectId) {
      const projectCosts = (await ctx.runQuery(api.costs.getProjectCosts, {
        projectId,
      })) as { summary: { totalCostUSD: number; totalTokens: number; operationCount: number } };
      totals = { totalCostUSD: projectCosts.summary.totalCostUSD };
    }

    return jsonResponse(200, {
      costId,
      projectId,
      totalCostUSD: totals.totalCostUSD,
      totalCredits: Math.ceil(totals.totalCostUSD / 0.01),
    });
  } catch (err) {
    console.error('[costs/log]', err);
    return jsonResponse(500, {
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
});

http.route({ path: '/costs/log', method: 'POST', handler: costsLog });
http.route({ path: '/costs/log', method: 'OPTIONS', handler: costsLog });

// ─── /costs/totals ────────────────────────────────────────────────────────

const costsTotals = httpAction(async (ctx, request) => {
  if (request.method === 'OPTIONS') return corsPreflight('GET');

  const denied = requireHandoffSecret(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const supabaseProjectId = url.searchParams.get('supabaseProjectId');

  if (!supabaseProjectId) {
    return jsonResponse(400, { error: 'Missing supabaseProjectId' });
  }

  try {
    const project = (await ctx.runQuery(api.projects.getBySupabaseId, {
      supabaseProjectId,
    })) as { _id: Id<'projects'> } | null;

    if (!project) {
      return jsonResponse(200, {
        totalCostUSD: 0,
        totalCredits: 0,
        totalTokens: 0,
        operations: 0,
      });
    }

    const projectCosts = (await ctx.runQuery(api.costs.getProjectCosts, {
      projectId: project._id,
    })) as {
      summary: {
        totalCostUSD: number;
        totalTokens: number;
        operationCount: number;
      };
    };

    return jsonResponse(200, {
      totalCostUSD: projectCosts.summary.totalCostUSD,
      totalCredits: Math.ceil(projectCosts.summary.totalCostUSD / 0.01),
      totalTokens: projectCosts.summary.totalTokens,
      operations: projectCosts.summary.operationCount,
    });
  } catch (err) {
    console.error('[costs/totals]', err);
    return jsonResponse(500, {
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
});

http.route({ path: '/costs/totals', method: 'GET', handler: costsTotals });
http.route({ path: '/costs/totals', method: 'OPTIONS', handler: costsTotals });

// ─── /reviewArtifacts (GET + POST upsert) ─────────────────────────────────

const reviewArtifactsUpsert = httpAction(async (ctx, request) => {
  if (request.method === 'OPTIONS') return corsPreflight('POST');

  const denied = requireHandoffSecret(request);
  if (denied) return denied;

  let body: {
    supabaseProjectId: string;
    generatedCode?: string;
    previewHtml?: string;
    generatedFiles?: Array<{ path: string; content: string }>;
    qualityMetrics?: unknown;
    generationCompletedAt?: number;
  };

  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON' });
  }

  if (!body.supabaseProjectId) {
    return jsonResponse(400, { error: 'supabaseProjectId is required' });
  }

  try {
    let qualityMetricsJson: string | undefined;
    if (body.qualityMetrics !== undefined) {
      qualityMetricsJson =
        typeof body.qualityMetrics === 'string'
          ? body.qualityMetrics
          : JSON.stringify(body.qualityMetrics);
    }

    const id = await ctx.runMutation(api.supabaseReviewArtifacts.upsert, {
      supabaseProjectId: body.supabaseProjectId,
      generatedCode: body.generatedCode,
      previewHtml: body.previewHtml,
      generatedFiles: body.generatedFiles,
      qualityMetricsJson,
      generationCompletedAt: body.generationCompletedAt,
    });

    return jsonResponse(200, { id });
  } catch (err) {
    console.error('[reviewArtifacts/upsert]', err);
    return jsonResponse(500, {
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
});

http.route({
  path: '/reviewArtifacts/upsert',
  method: 'POST',
  handler: reviewArtifactsUpsert,
});
http.route({
  path: '/reviewArtifacts/upsert',
  method: 'OPTIONS',
  handler: reviewArtifactsUpsert,
});

const reviewArtifactsGet = httpAction(async (ctx, request) => {
  if (request.method === 'OPTIONS') return corsPreflight('GET');

  const denied = requireHandoffSecret(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const supabaseProjectId = url.searchParams.get('supabaseProjectId');
  if (!supabaseProjectId) {
    return jsonResponse(400, { error: 'Missing supabaseProjectId' });
  }

  try {
    const row = (await ctx.runQuery(api.supabaseReviewArtifacts.getBySupabaseId, {
      supabaseProjectId,
    })) as {
      generatedCode?: string;
      previewHtml?: string;
      generatedFiles?: Array<{ path: string; content: string }>;
      qualityMetricsJson?: string;
      generationCompletedAt?: number;
    } | null;

    if (!row) {
      return jsonResponse(200, { artifact: null });
    }

    let qualityMetrics: unknown = null;
    if (row.qualityMetricsJson) {
      try {
        qualityMetrics = JSON.parse(row.qualityMetricsJson);
      } catch {
        qualityMetrics = row.qualityMetricsJson;
      }
    }

    return jsonResponse(200, {
      artifact: {
        generated_code: row.generatedCode ?? null,
        preview_html: row.previewHtml ?? null,
        generated_files: row.generatedFiles ?? null,
        quality_metrics: qualityMetrics,
        generation_completed_at: row.generationCompletedAt ?? null,
      },
    });
  } catch (err) {
    console.error('[reviewArtifacts GET]', err);
    return jsonResponse(500, {
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
});

http.route({ path: '/reviewArtifacts', method: 'GET', handler: reviewArtifactsGet });
http.route({ path: '/reviewArtifacts', method: 'OPTIONS', handler: reviewArtifactsGet });

export default http;
