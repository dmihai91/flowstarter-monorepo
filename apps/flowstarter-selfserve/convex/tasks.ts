import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const upsert = mutation({
  args: {
    buildId: v.string(),
    taskId: v.string(),
    description: v.string(),
    agentRole: v.string(),
    capability: v.string(),
    status: v.string(),
    dependsOn: v.array(v.string()),
    output: v.optional(v.string()),
    error: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('agentTasks')
      .withIndex('by_buildId_taskId', (q) => q.eq('buildId', args.buildId).eq('taskId', args.taskId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert('agentTasks', args);
    }
  },
});

export const listByBuild = query({
  args: { buildId: v.string() },
  handler: async (ctx, { buildId }) => {
    return ctx.db
      .query('agentTasks')
      .withIndex('by_buildId', (q) => q.eq('buildId', buildId))
      .collect();
  },
});
