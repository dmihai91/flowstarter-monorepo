/**
 * Editor Sessions - Convex mutations and queries
 *
 * Manages persistent editor state for session restore.
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Get the active editor session for a project.
 */
export const getByProject = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, { projectId }) => {
    const sessions = await ctx.db
      .query('editorSessions')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect();

    // Return the most recently active non-expired session
    const active = sessions
      .filter((s) => s.status !== 'expired')
      .sort((a, b) => b.lastActiveAt - a.lastActiveAt);

    return active[0] || null;
  },
});

/**
 * Create or update an editor session.
 */
export const createOrUpdate = mutation({
  args: {
    projectId: v.id('projects'),
    conversationId: v.optional(v.id('conversations')),
    daytonaWorkspaceId: v.optional(v.string()),
    sandboxId: v.optional(v.string()),
    previewUrl: v.optional(v.string()),
    status: v.union(
      v.literal('idle'),
      v.literal('active'),
      v.literal('generating'),
      v.literal('paused'),
      v.literal('expired'),
    ),
    lastPrompt: v.optional(v.string()),
    locale: v.optional(v.string()),
    sessionData: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find existing session for this project
    const existing = await ctx.db
      .query('editorSessions')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        lastActiveAt: now,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new session
    return await ctx.db.insert('editorSessions', {
      ...args,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Mark a session as active (heartbeat).
 */
export const markActive = mutation({
  args: {
    sessionId: v.id('editorSessions'),
  },
  handler: async (ctx, { sessionId }) => {
    const now = Date.now();
    await ctx.db.patch(sessionId, {
      status: 'active',
      lastActiveAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Mark a session as expired.
 */
export const markExpired = mutation({
  args: {
    sessionId: v.id('editorSessions'),
  },
  handler: async (ctx, { sessionId }) => {
    const now = Date.now();
    await ctx.db.patch(sessionId, {
      status: 'expired',
      updatedAt: now,
    });
  },
});

/**
 * Update session with workspace info.
 */
export const updateWorkspaceInfo = mutation({
  args: {
    sessionId: v.id('editorSessions'),
    daytonaWorkspaceId: v.optional(v.string()),
    sandboxId: v.optional(v.string()),
    previewUrl: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, ...updates }) => {
    const now = Date.now();
    await ctx.db.patch(sessionId, {
      ...updates,
      lastActiveAt: now,
      updatedAt: now,
    });
  },
});
