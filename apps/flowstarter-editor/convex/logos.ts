import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Logo Storage Functions
 * Handle logo uploads and retrieval for projects
 */

// Generate upload URL for logo
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Save logo metadata after upload
export const saveLogo = mutation({
  args: {
    projectId: v.string(),
    storageId: v.id('_storage'),
    type: v.union(v.literal('uploaded'), v.literal('generated')),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the URL for the stored file
    const url = await ctx.storage.getUrl(args.storageId);
    
    return {
      success: true,
      url,
      storageId: args.storageId,
      type: args.type,
      prompt: args.prompt,
    };
  },
});

// Get logo for a project
export const getLogo = query({
  args: {
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Delete logo
export const deleteLogo = mutation({
  args: {
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
    return { success: true };
  },
});

