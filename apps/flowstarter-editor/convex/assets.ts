import { v } from 'convex/values';
import { mutation, query, action } from './_generated/server';
import type { Id } from './_generated/dataModel';

/**
 * Assets Functions
 * Manage AI-generated images and media for projects
 */

// Asset types for validation
const assetTypeValidator = v.union(
  v.literal('hero'),
  v.literal('product'),
  v.literal('team'),
  v.literal('background'),
  v.literal('logo'),
  v.literal('custom')
);

const assetStatusValidator = v.union(
  v.literal('pending'),
  v.literal('generating'),
  v.literal('ready'),
  v.literal('error')
);

// Create a new asset record (pending generation)
export const create = mutation({
  args: {
    projectId: v.id('projects'),
    type: assetTypeValidator,
    name: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const assetId = await ctx.db.insert('assets', {
      projectId: args.projectId,
      type: args.type,
      name: args.name,
      prompt: args.prompt,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
    return assetId;
  },
});

// Update asset status and URL after generation
export const updateStatus = mutation({
  args: {
    assetId: v.id('assets'),
    status: assetStatusValidator,
    url: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    storageId: v.optional(v.id('_storage')),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        model: v.optional(v.string()),
        seed: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { assetId, ...updates } = args;
    await ctx.db.patch(assetId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Get a single asset
export const get = query({
  args: {
    assetId: v.id('assets'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.assetId);
  },
});

// Get all assets for a project
export const listByProject = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('assets')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();
  },
});

// Get assets by type for a project
export const listByType = query({
  args: {
    projectId: v.id('projects'),
    type: assetTypeValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('assets')
      .withIndex('by_project_type', (q) => 
        q.eq('projectId', args.projectId).eq('type', args.type)
      )
      .collect();
  },
});

// Get pending assets (for processing queue)
export const listPending = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('assets')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .collect();
  },
});

// Delete an asset
export const remove = mutation({
  args: {
    assetId: v.id('assets'),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (asset?.storageId) {
      await ctx.storage.delete(asset.storageId);
    }
    await ctx.db.delete(args.assetId);
  },
});

// Delete all assets for a project
export const removeByProject = mutation({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query('assets')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();

    for (const asset of assets) {
      if (asset.storageId) {
        await ctx.storage.delete(asset.storageId);
      }
      await ctx.db.delete(asset._id);
    }

    return { deleted: assets.length };
  },
});

// Batch create multiple assets
export const createBatch = mutation({
  args: {
    projectId: v.id('projects'),
    assets: v.array(
      v.object({
        type: assetTypeValidator,
        name: v.string(),
        prompt: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const assetIds = [];

    for (const asset of args.assets) {
      const assetId = await ctx.db.insert('assets', {
        projectId: args.projectId,
        type: asset.type,
        name: asset.name,
        prompt: asset.prompt,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
      assetIds.push(assetId);
    }

    return assetIds;
  },
});

// Get upload URL for storing generated image
export const getUploadUrl = mutation({
  args: {},
  handler: async (ctx): Promise<string> => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Store image from external URL (for downloading fal.ai results)
// Note: This is a standalone action - use internal functions to avoid circular deps
export const storeFromUrl = action({
  args: {
    assetId: v.id('assets'),
    imageUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ storageId: string; url: string | null }> => {
    // Fetch the image
    const response = await fetch(args.imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();

    // Upload to Convex storage using internal mutation
    const uploadUrl: string = await ctx.runMutation(
      'assets:getUploadUrl' as any,
      {}
    );
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': blob.type },
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload image: ${uploadResponse.status}`);
    }

    const result = await uploadResponse.json() as { storageId: string };
    const storageId = result.storageId;

    // Get the URL for the stored file
    const url = await ctx.storage.getUrl(storageId as any);

    // Update the asset record using internal mutation
    await ctx.runMutation(
      'assets:updateStatus' as any,
      {
        assetId: args.assetId,
        status: 'ready',
        storageId,
        url: url || undefined,
      }
    );

    return { storageId, url };
  },
});

