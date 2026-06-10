import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const upsert = mutation({
  args: {
    buildId: v.string(),
    projectId: v.string(),
    status: v.string(),
    progress: v.number(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('builds')
      .withIndex('by_buildId', (q) => q.eq('buildId', args.buildId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        progress: args.progress,
        error: args.error,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert('builds', { ...args, updatedAt: Date.now() });
    }
  },
});

export const appendEvent = mutation({
  args: { buildId: v.string(), seq: v.number(), event: v.any() },
  handler: async (ctx, args) => {
    await ctx.db.insert('buildEvents', args);
  },
});

export const get = query({
  args: { buildId: v.string() },
  handler: async (ctx, { buildId }) => {
    return ctx.db
      .query('builds')
      .withIndex('by_buildId', (q) => q.eq('buildId', buildId))
      .unique();
  },
});

export const events = query({
  args: { buildId: v.string() },
  handler: async (ctx, { buildId }) => {
    const rows = await ctx.db
      .query('buildEvents')
      .withIndex('by_buildId_seq', (q) => q.eq('buildId', buildId))
      .collect();
    return rows.map((r) => r.event);
  },
});
