import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Simplified File Functions
 * CRUD operations for project files
 */

// Save or update a file
export const save = mutation({
  args: {
    projectId: v.id('projects'),
    path: v.string(),
    content: v.string(),
    type: v.union(v.literal('file'), v.literal('folder')),
    isBinary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if file already exists
    const existing = await ctx.db
      .query('files')
      .withIndex('by_project_path', (q) => q.eq('projectId', args.projectId).eq('path', args.path))
      .first();

    if (existing) {
      // Update existing file
      await ctx.db.patch(existing._id, {
        content: args.content,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new file
      const fileId = await ctx.db.insert('files', {
        projectId: args.projectId,
        path: args.path,
        content: args.content,
        type: args.type,
        isBinary: args.isBinary || false,
        updatedAt: Date.now(),
      });
      return fileId;
    }
  },
});

// Get a single file
export const get = query({
  args: {
    projectId: v.id('projects'),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('files')
      .withIndex('by_project_path', (q) => q.eq('projectId', args.projectId).eq('path', args.path))
      .first();
  },
});

// Get all files for a project
export const list = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('files')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();
  },
});

// Batch save multiple files
export const saveBatch = mutation({
  args: {
    projectId: v.id('projects'),
    files: v.array(
      v.object({
        path: v.string(),
        content: v.string(),
        type: v.union(v.literal('file'), v.literal('folder')),
        isBinary: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const fileIds = [];

    for (const file of args.files) {
      // Check if file already exists
      const existing = await ctx.db
        .query('files')
        .withIndex('by_project_path', (q) => q.eq('projectId', args.projectId).eq('path', file.path))
        .first();

      if (existing) {
        // Update existing
        await ctx.db.patch(existing._id, {
          content: file.content,
          updatedAt: Date.now(),
        });
        fileIds.push(existing._id);
      } else {
        // Create new
        const fileId = await ctx.db.insert('files', {
          projectId: args.projectId,
          path: file.path,
          content: file.content,
          type: file.type,
          isBinary: file.isBinary || false,
          updatedAt: Date.now(),
        });
        fileIds.push(fileId);
      }
    }

    return fileIds;
  },
});

// Delete a file
export const remove = mutation({
  args: {
    projectId: v.id('projects'),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query('files')
      .withIndex('by_project_path', (q) => q.eq('projectId', args.projectId).eq('path', args.path))
      .first();

    if (file) {
      await ctx.db.delete(file._id);
      return { success: true };
    }

    return { success: false };
  },
});

// Delete all files for a project
export const removeAll = mutation({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query('files')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();

    for (const file of files) {
      await ctx.db.delete(file._id);
    }

    return { success: true, count: files.length };
  },
});

// Alias for list - get all project files
export const getProjectFiles = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('files')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();
  },
});

// Alias for save - update file content
export const updateContent = mutation({
  args: {
    projectId: v.id('projects'),
    path: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('files')
      .withIndex('by_project_path', (q) => q.eq('projectId', args.projectId).eq('path', args.path))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return null;
  },
});

// Sync files - batch sync files with the project
export const syncFiles = mutation({
  args: {
    projectId: v.id('projects'),
    files: v.array(
      v.object({
        path: v.string(),
        content: v.string(),
        type: v.union(v.literal('file'), v.literal('folder')),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const file of args.files) {
      const existing = await ctx.db
        .query('files')
        .withIndex('by_project_path', (q) => q.eq('projectId', args.projectId).eq('path', file.path))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          content: file.content,
          updatedAt: Date.now(),
        });
        results.push({ path: file.path, id: existing._id, action: 'updated' });
      } else {
        const fileId = await ctx.db.insert('files', {
          projectId: args.projectId,
          path: file.path,
          content: file.content,
          type: file.type,
          isBinary: false,
          updatedAt: Date.now(),
        });
        results.push({ path: file.path, id: fileId, action: 'created' });
      }
    }

    return results;
  },
});

