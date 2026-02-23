/**
 * Magic Link Functions
 * 
 * Generate and validate magic links for client access.
 * Flow: Team creates link → Sends to client → Client clicks → Gets session
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';

// Generate a secure random token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Generate session token
function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get magic links for a project
 */
export const getForProject = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query('magicLinks')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();
    
    return links.map(link => ({
      ...link,
      // Don't expose full token in list view
      tokenPreview: link.token.slice(0, 8) + '...',
    }));
  },
});

/**
 * Get magic links for a client
 */
export const getForClient = query({
  args: {
    clientId: v.id('clients'),
  },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query('magicLinks')
      .withIndex('by_client', (q) => q.eq('clientId', args.clientId))
      .collect();
    
    // Get project info for each link
    const linksWithProjects = await Promise.all(
      links.map(async (link) => {
        const project = await ctx.db.get(link.projectId);
        return {
          ...link,
          tokenPreview: link.token.slice(0, 8) + '...',
          projectName: project?.name,
          projectUrlId: project?.urlId,
        };
      })
    );
    
    return linksWithProjects;
  },
});

/**
 * Validate a magic link token (without consuming it)
 */
export const validate = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query('magicLinks')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();
    
    if (!link) {
      return { valid: false, error: 'Link not found' };
    }
    
    if (link.isRevoked) {
      return { valid: false, error: 'Link has been revoked' };
    }
    
    if (link.expiresAt && link.expiresAt < Date.now()) {
      return { valid: false, error: 'Link has expired' };
    }
    
    if (link.maxUses && link.useCount >= link.maxUses) {
      return { valid: false, error: 'Link has reached maximum uses' };
    }
    
    // Get client and project info
    const client = await ctx.db.get(link.clientId);
    const project = await ctx.db.get(link.projectId);
    
    if (!client || !project) {
      return { valid: false, error: 'Associated data not found' };
    }
    
    return {
      valid: true,
      accessLevel: link.accessLevel,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
      },
      project: {
        id: project._id,
        name: project.name,
        urlId: project.urlId,
      },
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new magic link
 */
export const create = mutation({
  args: {
    clientId: v.id('clients'),
    projectId: v.id('projects'),
    accessLevel: v.optional(v.union(
      v.literal('view'),
      v.literal('customize'),
      v.literal('full')
    )),
    expiresInDays: v.optional(v.number()), // null = never expires
    maxUses: v.optional(v.number()),       // null = unlimited
    createdBy: v.optional(v.string()),     // Clerk user ID
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const token = generateToken();
    
    // Verify client and project exist
    const client = await ctx.db.get(args.clientId);
    const project = await ctx.db.get(args.projectId);
    
    if (!client) {
      return { success: false, error: 'Client not found' };
    }
    if (!project) {
      return { success: false, error: 'Project not found' };
    }
    
    // Calculate expiry
    const expiresAt = args.expiresInDays 
      ? now + args.expiresInDays * 24 * 60 * 60 * 1000
      : undefined;
    
    const linkId = await ctx.db.insert('magicLinks', {
      token,
      clientId: args.clientId,
      projectId: args.projectId,
      accessLevel: args.accessLevel || 'customize',
      expiresAt,
      useCount: 0,
      maxUses: args.maxUses,
      isRevoked: false,
      createdBy: args.createdBy,
      createdAt: now,
    });
    
    return {
      success: true,
      linkId,
      token,
      // Return the full URL for easy sharing
      url: `/access/${token}`,
    };
  },
});

/**
 * Use a magic link to create a session
 */
export const use = mutation({
  args: {
    token: v.string(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query('magicLinks')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();
    
    if (!link) {
      return { success: false, error: 'Link not found' };
    }
    
    if (link.isRevoked) {
      return { success: false, error: 'Link has been revoked' };
    }
    
    if (link.expiresAt && link.expiresAt < Date.now()) {
      return { success: false, error: 'Link has expired' };
    }
    
    if (link.maxUses && link.useCount >= link.maxUses) {
      return { success: false, error: 'Link has reached maximum uses' };
    }
    
    const now = Date.now();
    
    // Update link usage
    await ctx.db.patch(link._id, {
      useCount: link.useCount + 1,
      usedAt: link.usedAt || now, // Only set first use time
    });
    
    // Create client session
    const sessionToken = generateSessionToken();
    const sessionExpiry = now + 30 * 24 * 60 * 60 * 1000; // 30 days
    
    await ctx.db.insert('clientSessions', {
      token: sessionToken,
      clientId: link.clientId,
      magicLinkId: link._id,
      projectId: link.projectId,
      accessLevel: link.accessLevel,
      userAgent: args.userAgent,
      expiresAt: sessionExpiry,
      lastActiveAt: now,
      createdAt: now,
    });
    
    // Update client status if needed
    const client = await ctx.db.get(link.clientId);
    if (client && client.status === 'onboarding') {
      await ctx.db.patch(link.clientId, {
        status: 'review',
        updatedAt: now,
      });
    }
    
    // Get project for redirect
    const project = await ctx.db.get(link.projectId);
    
    return {
      success: true,
      sessionToken,
      accessLevel: link.accessLevel,
      redirectTo: project ? `/project/${project.urlId}` : '/',
    };
  },
});

/**
 * Revoke a magic link
 */
export const revoke = mutation({
  args: {
    id: v.id('magicLinks'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.id);
    if (!link) {
      return { success: false, error: 'Link not found' };
    }
    
    await ctx.db.patch(args.id, {
      isRevoked: true,
      revokedAt: Date.now(),
      revokedReason: args.reason,
    });
    
    return { success: true };
  },
});

/**
 * Delete expired magic links (cleanup job)
 */
export const cleanupExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let deletedCount = 0;
    
    // Find expired links
    const expiredLinks = await ctx.db
      .query('magicLinks')
      .filter((q) => 
        q.and(
          q.neq(q.field('expiresAt'), undefined),
          q.lt(q.field('expiresAt'), now)
        )
      )
      .collect();
    
    // Delete them
    for (const link of expiredLinks) {
      await ctx.db.delete(link._id);
      deletedCount++;
    }
    
    return { deletedCount };
  },
});
