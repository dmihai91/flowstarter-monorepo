import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Snapshot Functions
 * Save and restore project state at key milestones
 */

// Create a new snapshot
export const create = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.string(),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    blobUrl: v.optional(v.string()),
    storageId: v.optional(v.id('_storage')),
    compressedSize: v.optional(v.number()),
    uncompressedSize: v.optional(v.number()),
    fileCount: v.optional(v.number()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    let blobUrl = args.blobUrl;

    // If storageId is provided, get the URL
    if (args.storageId) {
      blobUrl = (await ctx.storage.getUrl(args.storageId)) || undefined;
    }

    const snapshotId = await ctx.db.insert('snapshots', {
      projectId: args.projectId,
      name: args.name,
      label: args.label,
      description: args.description,
      blobUrl: blobUrl,
      storageId: args.storageId,
      compressedSize: args.compressedSize,
      uncompressedSize: args.uncompressedSize,
      fileCount: args.fileCount,
      data: args.data,
      createdAt: Date.now(),
    });

    return snapshotId;
  },
});

// Get a snapshot by ID
export const get = query({
  args: { snapshotId: v.id('snapshots') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.snapshotId);
  },
});

// Get latest snapshot for a project
export const getLatest = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('snapshots')
      .withIndex('by_project_created', (q) => q.eq('projectId', args.projectId))
      .order('desc')
      .first();
  },
});

// List all snapshots for a project
export const list = query({
  args: {
    projectId: v.id('projects'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    return await ctx.db
      .query('snapshots')
      .withIndex('by_project_created', (q) => q.eq('projectId', args.projectId))
      .order('desc')
      .take(limit);
  },
});

// Delete a snapshot
export const remove = mutation({
  args: { snapshotId: v.id('snapshots') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.snapshotId);
    return { success: true };
  },
});

// Delete all snapshots for a project
export const removeAll = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query('snapshots')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();

    for (const snapshot of snapshots) {
      await ctx.db.delete(snapshot._id);
    }

    return { success: true, count: snapshots.length };
  },
});

// Generate upload URL for blob storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

