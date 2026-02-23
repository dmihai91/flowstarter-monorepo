/**
 * Client Management Functions
 * 
 * Handle client accounts and their projects.
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';

// ═══════════════════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List all clients (for team view)
 */
export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal('lead'),
      v.literal('onboarding'),
      v.literal('review'),
      v.literal('active'),
      v.literal('churned')
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query('clients');
    
    if (args.status) {
      query = query.withIndex('by_status', (q) => q.eq('status', args.status!));
    }
    
    const clients = await query.order('desc').collect();
    
    // Get project counts for each client
    const clientsWithProjects = await Promise.all(
      clients.map(async (client) => {
        const projects = await ctx.db
          .query('projects')
          .withIndex('by_client', (q) => q.eq('clientId', client._id))
          .collect();
        
        return {
          ...client,
          projectCount: projects.length,
        };
      })
    );
    
    return clientsWithProjects;
  },
});

/**
 * Get a single client by ID
 */
export const get = query({
  args: {
    id: v.id('clients'),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.id);
    if (!client) return null;
    
    // Get client's projects
    const projects = await ctx.db
      .query('projects')
      .withIndex('by_client', (q) => q.eq('clientId', client._id))
      .collect();
    
    return {
      ...client,
      projects,
    };
  },
});

/**
 * Get client by email
 */
export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('clients')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase()))
      .first();
  },
});

/**
 * Get client by Clerk user ID (after they've signed up)
 */
export const getByClerkUserId = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db
      .query('clients')
      .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', args.clerkUserId))
      .first();
    
    if (!client) return null;
    
    // Get their projects
    const projects = await ctx.db
      .query('projects')
      .withIndex('by_client', (q) => q.eq('clientId', client._id))
      .collect();
    
    return {
      ...client,
      projects,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new client
 */
export const create = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    discoveryNotes: v.optional(v.string()),
    createdBy: v.optional(v.string()), // Clerk user ID
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if client already exists
    const existing = await ctx.db
      .query('clients')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase()))
      .first();
    
    if (existing) {
      return { success: false, error: 'Client with this email already exists', clientId: existing._id };
    }
    
    const clientId = await ctx.db.insert('clients', {
      email: args.email.toLowerCase(),
      name: args.name,
      phone: args.phone,
      company: args.company,
      discoveryNotes: args.discoveryNotes,
      status: 'invited', // Will change to 'onboarding' when they sign up via magic link
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    
    return { success: true, clientId };
  },
});

/**
 * Update client
 */
export const update = mutation({
  args: {
    id: v.id('clients'),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    discoveryNotes: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal('lead'),
      v.literal('onboarding'),
      v.literal('review'),
      v.literal('active'),
      v.literal('churned')
    )),
    plan: v.optional(v.union(
      v.literal('trial'),
      v.literal('starter'),
      v.literal('professional'),
      v.literal('enterprise')
    )),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const client = await ctx.db.get(id);
    if (!client) {
      return { success: false, error: 'Client not found' };
    }
    
    const patchData: any = {
      ...updates,
      updatedAt: Date.now(),
    };
    
    // Handle email lowercase
    if (updates.email) {
      patchData.email = updates.email.toLowerCase();
    }
    
    // Set plan start date if plan is being set
    if (updates.plan && updates.plan !== client.plan) {
      patchData.planStartedAt = Date.now();
    }
    
    await ctx.db.patch(id, patchData);
    
    return { success: true };
  },
});

/**
 * Delete client (soft delete - set status to churned)
 */
export const archive = mutation({
  args: {
    id: v.id('clients'),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.id);
    if (!client) {
      return { success: false, error: 'Client not found' };
    }
    
    await ctx.db.patch(args.id, {
      status: 'churned',
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});
