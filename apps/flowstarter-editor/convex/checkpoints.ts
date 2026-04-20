import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Checkpoint registry.
 *
 * T3 owns the checkpoint blobs (diff content, workspace snapshot) in its
 * projection tables. Convex stores a pointer so clients can browse
 * checkpoints across devices.
 */

const createdByKindValidator = v.union(
  v.literal('clerk'),
  v.literal('client'),
  v.literal('system'),
);

export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query('checkpoints')
      .withIndex('by_project_created', (q) => q.eq('projectId', projectId))
      .order('desc')
      .collect();
  },
});

export const listByThread = query({
  args: { threadId: v.id('threads') },
  handler: async (ctx, { threadId }) => {
    return await ctx.db
      .query('checkpoints')
      .withIndex('by_thread', (q) => q.eq('threadId', threadId))
      .order('desc')
      .collect();
  },
});

export const registerCheckpoint = mutation({
  args: {
    projectId: v.id('projects'),
    threadId: v.optional(v.id('threads')),
    t3CheckpointId: v.string(),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    createdByKind: v.optional(createdByKindValidator),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('checkpoints')
      .withIndex('by_t3Id', (q) => q.eq('t3CheckpointId', args.t3CheckpointId))
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert('checkpoints', {
      projectId: args.projectId,
      threadId: args.threadId,
      t3CheckpointId: args.t3CheckpointId,
      label: args.label,
      description: args.description,
      createdByKind: args.createdByKind,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });
  },
});
