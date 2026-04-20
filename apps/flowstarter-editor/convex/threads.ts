import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Thread registry.
 *
 * T3 owns the real thread content (messages, tool calls, plans) in its
 * SQLite projection tables. Convex keeps a pointer row so the team dashboard
 * and client editor can list threads across projects without talking to T3
 * directly.
 */

const modeValidator = v.union(
  v.literal('team'),
  v.literal('client'),
  v.literal('platform'),
);

const createdByKindValidator = v.union(
  v.literal('clerk'),
  v.literal('client'),
  v.literal('system'),
);

export const listByProject = query({
  args: {
    projectId: v.id('projects'),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, { projectId, includeArchived }) => {
    const rows = await ctx.db
      .query('threads')
      .withIndex('by_project_updated', (q) => q.eq('projectId', projectId))
      .order('desc')
      .collect();
    if (includeArchived) return rows;
    return rows.filter((row) => !row.archivedAt);
  },
});

export const getByT3Id = query({
  args: { t3ThreadId: v.string() },
  handler: async (ctx, { t3ThreadId }) => {
    return await ctx.db
      .query('threads')
      .withIndex('by_t3Id', (q) => q.eq('t3ThreadId', t3ThreadId))
      .first();
  },
});

export const registerThread = mutation({
  args: {
    projectId: v.id('projects'),
    t3ThreadId: v.string(),
    title: v.optional(v.string()),
    mode: v.optional(modeValidator),
    createdByKind: v.optional(createdByKindValidator),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query('threads')
      .withIndex('by_t3Id', (q) => q.eq('t3ThreadId', args.t3ThreadId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title ?? existing.title,
        mode: args.mode ?? existing.mode,
        lastActivityAt: now,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert('threads', {
      projectId: args.projectId,
      t3ThreadId: args.t3ThreadId,
      title: args.title,
      mode: args.mode,
      createdByKind: args.createdByKind,
      createdBy: args.createdBy,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const touchThread = mutation({
  args: { t3ThreadId: v.string(), title: v.optional(v.string()) },
  handler: async (ctx, { t3ThreadId, title }) => {
    const row = await ctx.db
      .query('threads')
      .withIndex('by_t3Id', (q) => q.eq('t3ThreadId', t3ThreadId))
      .first();
    if (!row) return null;
    const now = Date.now();
    await ctx.db.patch(row._id, {
      title: title ?? row.title,
      lastActivityAt: now,
      updatedAt: now,
    });
    return row._id;
  },
});

export const archiveThread = mutation({
  args: { t3ThreadId: v.string() },
  handler: async (ctx, { t3ThreadId }) => {
    const row = await ctx.db
      .query('threads')
      .withIndex('by_t3Id', (q) => q.eq('t3ThreadId', t3ThreadId))
      .first();
    if (!row) return null;
    const now = Date.now();
    await ctx.db.patch(row._id, { archivedAt: now, updatedAt: now });
    return row._id;
  },
});
