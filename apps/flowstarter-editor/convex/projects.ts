import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

/**
 * Project functions for the T3-backed editor.
 *
 * Convex projects are a thin durable pointer that both editors + the team
 * dashboard agree on: {urlId, supabaseProjectId, clientId, Daytona sandbox
 * pointer, publish state}. Code lives in the Daytona sandbox; runtime state
 * lives in T3 SQLite. Onboarding blobs used to live here; now they live in
 * the Supabase `projects.data` column (team dashboard owns them).
 */

const paletteSchema = v.object({
  id: v.string(),
  name: v.string(),
  colors: v.object({
    primary: v.string(),
    secondary: v.string(),
    accent: v.string(),
    background: v.string(),
    text: v.string(),
  }),
});

const fontSchema = v.object({
  id: v.string(),
  name: v.string(),
  heading: v.object({ family: v.string(), weight: v.optional(v.number()) }),
  body: v.object({ family: v.string(), weight: v.optional(v.number()) }),
});

function slugifyName(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

async function uniqueUrlId(
  ctx: { db: { query: (t: 'projects') => any } },
  base: string,
): Promise<string> {
  let candidate = base || 'project';
  let attempt = 0;
  while (attempt < 25) {
    const existing = await ctx.db
      .query('projects')
      .withIndex('by_urlId', (q: any) => q.eq('urlId', candidate))
      .first();
    if (!existing) return candidate;
    attempt += 1;
    candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

// ─── Reads ────────────────────────────────────────────────────────────────

export const getByUrlId = query({
  args: { urlId: v.string() },
  handler: async (ctx, { urlId }) => {
    return await ctx.db
      .query('projects')
      .withIndex('by_urlId', (q) => q.eq('urlId', urlId))
      .first();
  },
});

export const getBySupabaseId = query({
  args: { supabaseProjectId: v.string() },
  handler: async (ctx, { supabaseProjectId }) => {
    return await ctx.db
      .query('projects')
      .withIndex('by_supabaseProjectId', (q) =>
        q.eq('supabaseProjectId', supabaseProjectId),
      )
      .first();
  },
});

export const getById = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    return await ctx.db.get(projectId);
  },
});

export const listByClient = query({
  args: { clientId: v.id('clients') },
  handler: async (ctx, { clientId }) => {
    return await ctx.db
      .query('projects')
      .withIndex('by_client', (q) => q.eq('clientId', clientId))
      .order('desc')
      .collect();
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    return await ctx.db
      .query('projects')
      .withIndex('by_updatedAt')
      .order('desc')
      .take(limit ?? 50);
  },
});

// ─── Writes ───────────────────────────────────────────────────────────────

/**
 * Upsert a project record from flowstarter-main during editor handoff.
 * Used by the /handoff/initialize HTTP action. Keeps the payload slim — the
 * Remix-era onboarding bundle (businessInfo / brandProfile / flowstarter
 * engine output) stays in Supabase `projects.data`.
 */
export const upsertFromMain = mutation({
  args: {
    supabaseProjectId: v.string(),
    projectName: v.string(),
    projectDescription: v.optional(v.string()),
    templateId: v.optional(v.string()),
    templateName: v.optional(v.string()),
    selectedPalette: v.optional(paletteSchema),
    selectedFont: v.optional(fontSchema),
    createdBy: v.optional(v.string()),
    clientId: v.optional(v.id('clients')),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query('projects')
      .withIndex('by_supabaseProjectId', (q) =>
        q.eq('supabaseProjectId', args.supabaseProjectId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.projectName,
        description: args.projectDescription ?? existing.description,
        templateId: args.templateId ?? existing.templateId,
        templateName: args.templateName ?? existing.templateName,
        selectedPalette: args.selectedPalette ?? existing.selectedPalette,
        selectedFont: args.selectedFont ?? existing.selectedFont,
        clientId: args.clientId ?? existing.clientId,
        updatedAt: now,
      });
      return { projectId: existing._id as string, urlId: existing.urlId, skipped: true };
    }

    const base = slugifyName(args.projectName) || `p-${now.toString(36)}`;
    const urlId = await uniqueUrlId(ctx, base);

    const projectId = await ctx.db.insert('projects', {
      urlId,
      name: args.projectName,
      description: args.projectDescription ?? '',
      supabaseProjectId: args.supabaseProjectId,
      clientId: args.clientId,
      createdBy: args.createdBy,
      status: 'draft',
      templateId: args.templateId,
      templateName: args.templateName,
      selectedPalette: args.selectedPalette,
      selectedFont: args.selectedFont,
      createdAt: now,
      updatedAt: now,
    });

    return { projectId: projectId as string, urlId, skipped: false };
  },
});

/**
 * Record a Daytona sandbox allocation. Called by flowstarter-main's
 * /api/daytona/provision after spinning up a sandbox for a project.
 */
export const setActiveSandbox = mutation({
  args: {
    projectId: v.id('projects'),
    sandboxId: v.string(),
    sandboxUrl: v.optional(v.string()),
    previewUrl: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('provisioning'),
        v.literal('ready'),
        v.literal('building'),
        v.literal('running'),
        v.literal('error'),
        v.literal('stopped'),
      ),
    ),
    provisionedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.projectId, {
      currentSandboxId: args.sandboxId,
      currentSandboxUrl: args.sandboxUrl,
      currentSandboxPreviewUrl: args.previewUrl,
      currentSandboxStatus: args.status ?? 'ready',
      sandboxProvisionedAt: now,
      sandboxProvisionedBy: args.provisionedBy,
      updatedAt: now,
    });
    return null;
  },
});

export const updateSandboxStatus = mutation({
  args: {
    projectId: v.id('projects'),
    status: v.union(
      v.literal('provisioning'),
      v.literal('ready'),
      v.literal('building'),
      v.literal('running'),
      v.literal('error'),
      v.literal('stopped'),
    ),
    previewUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {
      currentSandboxStatus: args.status,
      updatedAt: Date.now(),
    };
    if (args.previewUrl !== undefined) {
      patch.currentSandboxPreviewUrl = args.previewUrl;
    }
    await ctx.db.patch(args.projectId, patch);
    return null;
  },
});

export const setPublished = mutation({
  args: {
    projectId: v.id('projects'),
    publishedUrl: v.string(),
    customDomain: v.optional(v.string()),
    publishedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.projectId, {
      status: 'published',
      publishedUrl: args.publishedUrl,
      customDomain: args.customDomain,
      publishedAt: now,
      lastPublishedBy: args.publishedBy,
      updatedAt: now,
    });
    return null;
  },
});

export const setStatus = mutation({
  args: {
    projectId: v.id('projects'),
    status: v.union(
      v.literal('draft'),
      v.literal('review'),
      v.literal('approved'),
      v.literal('published'),
      v.literal('archived'),
    ),
  },
  handler: async (ctx, { projectId, status }) => {
    await ctx.db.patch(projectId, { status, updatedAt: Date.now() });
    return null;
  },
});

/**
 * Delete a project and all its registry rows. Called by the
 * flowstarter-main DELETE /api/projects/:id cascade.
 */
export const deleteBySupabaseId = mutation({
  args: { supabaseProjectId: v.string() },
  handler: async (ctx, { supabaseProjectId }) => {
    const project = await ctx.db
      .query('projects')
      .withIndex('by_supabaseProjectId', (q) =>
        q.eq('supabaseProjectId', supabaseProjectId),
      )
      .first();
    if (!project) {
      return { deleted: 0 };
    }
    const projectId = project._id as Id<'projects'>;

    const related: Array<Promise<unknown>> = [];

    for (const threadRow of await ctx.db
      .query('threads')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect()) {
      related.push(ctx.db.delete(threadRow._id));
    }
    for (const checkpoint of await ctx.db
      .query('checkpoints')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect()) {
      related.push(ctx.db.delete(checkpoint._id));
    }
    for (const asset of await ctx.db
      .query('assets')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect()) {
      related.push(ctx.db.delete(asset._id));
    }
    for (const link of await ctx.db
      .query('magicLinks')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect()) {
      related.push(ctx.db.delete(link._id));
    }
    for (const sess of await ctx.db
      .query('clientSessions')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect()) {
      related.push(ctx.db.delete(sess._id));
    }

    await Promise.all(related);
    await ctx.db.delete(projectId);
    return { deleted: 1 };
  },
});
