import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Simplified Project Functions
 * CRUD operations for the new simplified projects schema
 */

// Integration schemas for validation
const bookingIntegrationSchema = v.object({
  enabled: v.boolean(),
  provider: v.union(
    v.literal('calendly'),
    v.literal('calcom'),
    v.literal('custom'),
    v.literal('none')
  ),
  calendlyUrl: v.optional(v.string()),
  calcomUrl: v.optional(v.string()),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  phone: v.optional(v.string()),
});

const newsletterIntegrationSchema = v.object({
  enabled: v.boolean(),
  provider: v.union(
    v.literal('mailchimp'),
    v.literal('convertkit'),
    v.literal('buttondown'),
    v.literal('custom'),
    v.literal('none')
  ),
  mailchimpUrl: v.optional(v.string()),
  convertkitFormId: v.optional(v.string()),
  buttondownUsername: v.optional(v.string()),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
});

const integrationsSchema = v.object({
  booking: v.optional(bookingIntegrationSchema),
  newsletter: v.optional(newsletterIntegrationSchema),
});

// Contact details schema
const contactDetailsSchema = v.object({
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  // Social links
  website: v.optional(v.string()),
  facebook: v.optional(v.string()),
  instagram: v.optional(v.string()),
  twitter: v.optional(v.string()),
  linkedin: v.optional(v.string()),
  youtube: v.optional(v.string()),
  tiktok: v.optional(v.string()),
});

// Helper: generate a URL-friendly slug from text
function slugifyName(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

// NOTE: Projects should be created from dashboard handoff, not directly.
// Create a new project
export const create = mutation({
  args: {
    urlId: v.string(),
    name: v.string(),
    description: v.string(),
    businessDetails: v.object({
      businessName: v.string(),
      description: v.string(),
      targetAudience: v.optional(v.string()),
      features: v.optional(v.array(v.string())),
      goals: v.optional(v.array(v.string())),
    }),
    tags: v.array(v.string()),
    templateId: v.string(),
    templateName: v.optional(v.string()),
    integrations: v.optional(integrationsSchema),
    contactDetails: v.optional(contactDetailsSchema),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const projectId = await ctx.db.insert('projects', {
      urlId: args.urlId,
      name: args.name,
      description: args.description,
      businessDetails: args.businessDetails,
      tags: args.tags,
      templateId: args.templateId,
      templateName: args.templateName,
      integrations: args.integrations,
      contactDetails: args.contactDetails,
      createdAt: now,
      updatedAt: now,
    });

    return projectId;
  },
});

// Get project by ID
export const get = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

// Get project by URL ID
export const getByUrlId = query({
  args: { urlId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('projects')
      .withIndex('by_urlId', (q) => q.eq('urlId', args.urlId))
      .first();
  },
});

// Update project metadata
export const update = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { projectId, name, ...otherUpdates } = args;

    // Build the update object
    const updates: Record<string, unknown> = {
      ...otherUpdates,
      updatedAt: Date.now(),
    };

    // If name is provided, update both name and urlId (slug)
    if (name !== undefined && name.trim() !== '') {
      updates.name = name;
      // Generate URL-friendly slug directly from name (no random suffix)
      const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '')     // Remove leading/trailing hyphens
        .slice(0, 40);               // Limit length

      if (baseSlug) {
        // Check uniqueness — try the clean slug first, then append -2, -3, etc.
        let candidate = baseSlug;
        let attempt = 1;
        while (attempt <= 20) {
          const existing = await ctx.db
            .query('projects')
            .withIndex('by_urlId', (q) => q.eq('urlId', candidate))
            .first();
          // If no conflict, or the conflict is this same project, use it
          if (!existing || existing._id === projectId) {
            break;
          }
          attempt++;
          candidate = `${baseSlug}-${attempt}`;
        }
        updates.urlId = candidate;
      }
    } else if (name !== undefined) {
      updates.name = name;
    }

    await ctx.db.patch(projectId, updates);

    return projectId;
  },
});

// Update project integrations
export const updateIntegrations = mutation({
  args: {
    projectId: v.id('projects'),
    integrations: integrationsSchema,
  },
  handler: async (ctx, args) => {
    const { projectId, integrations } = args;

    await ctx.db.patch(projectId, {
      integrations,
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

// Update booking integration only
export const updateBookingIntegration = mutation({
  args: {
    projectId: v.id('projects'),
    booking: bookingIntegrationSchema,
  },
  handler: async (ctx, args) => {
    const { projectId, booking } = args;
    
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error('Project not found');

    const integrations = {
      ...project.integrations,
      booking,
    };

    await ctx.db.patch(projectId, {
      integrations,
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

// Update newsletter integration only
export const updateNewsletterIntegration = mutation({
  args: {
    projectId: v.id('projects'),
    newsletter: newsletterIntegrationSchema,
  },
  handler: async (ctx, args) => {
    const { projectId, newsletter } = args;
    
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error('Project not found');

    const integrations = {
      ...project.integrations,
      newsletter,
    };

    await ctx.db.patch(projectId, {
      integrations,
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

// Update workspace info
export const updateWorkspace = mutation({
  args: {
    projectId: v.id('projects'),
    daytonaWorkspaceId: v.optional(v.string()),
    workspaceUrl: v.optional(v.string()),
    workspaceStatus: v.optional(
      v.union(
        v.literal('creating'),
        v.literal('ready'),
        v.literal('building'),
        v.literal('running'),
        v.literal('error'),
        v.literal('stopped'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { projectId, ...updates } = args;

    await ctx.db.patch(projectId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return projectId;
  },
});


// Update workspace by Supabase project ID (used by build pipeline which only has the Supabase slug)
export const updateWorkspaceBySupabaseId = mutation({
  args: {
    supabaseProjectId: v.string(),
    daytonaWorkspaceId: v.optional(v.string()),
    workspaceUrl: v.optional(v.string()),
    workspaceStatus: v.optional(
      v.union(
        v.literal('creating'),
        v.literal('ready'),
        v.literal('building'),
        v.literal('running'),
        v.literal('error'),
        v.literal('stopped'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { supabaseProjectId, ...updates } = args;
    const project = await ctx.db
      .query('projects')
      .withIndex('by_supabaseProjectId', (q) => q.eq('supabaseProjectId', supabaseProjectId))
      .first();
    if (!project) {
      console.warn('[updateWorkspaceBySupabaseId] No project found for supabaseProjectId:', supabaseProjectId);
      return null;
    }
    await ctx.db.patch(project._id, { ...updates, updatedAt: Date.now() });
    return project._id;
  },
});

// Update contact details
export const updateContactDetails = mutation({
  args: {
    projectId: v.id('projects'),
    contactDetails: contactDetailsSchema,
  },
  handler: async (ctx, args) => {
    const { projectId, contactDetails } = args;

    await ctx.db.patch(projectId, {
      contactDetails,
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

// List all projects (most recent first)
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    return await ctx.db.query('projects').withIndex('by_updatedAt').order('desc').take(limit);
  },
});

// Delete project
export const remove = mutation({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    // Delete all files for this project first
    const files = await ctx.db
      .query('files')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();

    for (const file of files) {
      await ctx.db.delete(file._id);
    }

    // Delete the project
    await ctx.db.delete(args.projectId);

    return { success: true };
  },
});

// Alias for get - get project by ID
export const getById = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

// Generate unique URL ID
export const generateUrlId = mutation({
  args: {},
  handler: async () => {
    // Generate a unique URL ID (8 characters)
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let urlId = '';

    for (let i = 0; i < 8; i++) {
      urlId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return urlId;
  },
});

// NOTE: Projects should be created from dashboard handoff, not directly.
// Create an empty project immediately when user starts (first prompt)
// Data is populated incrementally as user progresses through onboarding
export const createEmpty = mutation({
  args: {
    // Optional - for internal flow
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    templateId: v.optional(v.string()),
    templateName: v.optional(v.string()),
    businessDetails: v.optional(v.object({
      businessName: v.string(),
      description: v.string(),
      targetAudience: v.optional(v.string()),
      features: v.optional(v.array(v.string())),
      goals: v.optional(v.array(v.string())),
    })),
    tags: v.optional(v.array(v.string())),
    // Client and team member linking (for internal flow)
    clientId: v.optional(v.id('clients')),
    createdBy: v.optional(v.string()), // Clerk user ID
    // Cross-platform linking
    supabaseProjectId: v.optional(v.string()), // UUID from Supabase
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Generate a unique URL ID from name or random
    let urlId: string;
    if (args.name) {
      const baseSlug = args.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
      
      // Check uniqueness
      let candidate = baseSlug || 'project';
      let attempt = 1;
      while (attempt <= 20) {
        const existing = await ctx.db
          .query('projects')
          .withIndex('by_urlId', (q) => q.eq('urlId', candidate))
          .first();
        if (!existing) break;
        attempt++;
        candidate = `${baseSlug}-${attempt}`;
      }
      urlId = candidate;
    } else {
      // Random URL ID for self-serve flow
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      urlId = '';
      for (let i = 0; i < 8; i++) {
        urlId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    const projectId = await ctx.db.insert('projects', {
      urlId,
      name: args.name || '',
      description: args.description || '',
      businessDetails: args.businessDetails || {
        businessName: args.name || '',
        description: args.description || '',
      },
      tags: args.tags || [],
      templateId: args.templateId || '',
      templateName: args.templateName,
      // New fields for client/team flow
      clientId: args.clientId,
      createdBy: args.createdBy,
      supabaseProjectId: args.supabaseProjectId,
      status: args.clientId ? 'draft' : undefined, // Set status if client-linked
      createdAt: now,
      updatedAt: now,
    });

    return { projectId, urlId };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL TEAM FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// List projects by status (for internal dashboard)
export const listByStatus = query({
  args: {
    status: v.union(
      v.literal('draft'),
      v.literal('review'),
      v.literal('approved'),
      v.literal('published'),
      v.literal('archived')
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query('projects')
      .withIndex('by_status', (q) => q.eq('status', args.status))
      .order('desc')
      .take(limit);
  },
});

// List projects for a client
export const listByClient = query({
  args: {
    clientId: v.id('clients'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('projects')
      .withIndex('by_client', (q) => q.eq('clientId', args.clientId))
      .collect();
  },
});

// Update project status
export const updateStatus = mutation({
  args: {
    projectId: v.id('projects'),
    status: v.union(
      v.literal('draft'),
      v.literal('review'),
      v.literal('approved'),
      v.literal('published'),
      v.literal('archived')
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// Publish project (set live URL)
export const publish = mutation({
  args: {
    projectId: v.id('projects'),
    publishedUrl: v.string(),
    customDomain: v.optional(v.string()),
    publishedBy: v.optional(v.string()), // Clerk user ID
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    await ctx.db.patch(args.projectId, {
      status: 'published',
      publishedUrl: args.publishedUrl,
      customDomain: args.customDomain,
      publishedAt: now,
      lastPublishedBy: args.publishedBy,
      updatedAt: now,
    });
    
    // Update client status if linked
    const project = await ctx.db.get(args.projectId);
    if (project?.clientId) {
      await ctx.db.patch(project.clientId, {
        status: 'active',
        updatedAt: now,
      });
    }
    
    return { success: true, publishedUrl: args.publishedUrl };
  },
});

// Link project to client
export const linkToClient = mutation({
  args: {
    projectId: v.id('projects'),
    clientId: v.id('clients'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      clientId: args.clientId,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});
  
// Get workspace URL for preview proxy fallback  
export const getPreviewUrl = query({  
  args: { projectId: v.id('projects') },  
  handler: async (ctx, args) => {  
    const project = await ctx.db.get(args.projectId);  
    if (!project) return null;  
    return {  
      workspaceUrl: project.workspaceUrl,  
      workspaceStatus: project.workspaceStatus,  
      sandboxId: project.daytonaWorkspaceId,  
    };  
  },  
});

// Link an existing Convex project to a Supabase project
export const linkToSupabase = mutation({
  args: {
    projectId: v.id('projects'),
    supabaseProjectId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      supabaseProjectId: args.supabaseProjectId,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// Look up a Convex project by its Supabase UUID (for dedup)
export const getBySupabaseId = query({
  args: { supabaseProjectId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('projects')
      .withIndex('by_supabaseProjectId', (q) =>
        q.eq('supabaseProjectId', args.supabaseProjectId)
      )
      .first();
  },
});

// Check if a project name or slug is already taken
export const checkNameAvailability = mutation({
  args: { 
    name: v.string(),
    excludeProjectId: v.optional(v.id('projects')),
  },
  handler: async (ctx, args) => {
    const slug = args.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);

    // Check if slug already exists
    const existingBySlug = await ctx.db
      .query('projects')
      .withIndex('by_urlId', (q) => q.eq('urlId', slug))
      .first();

    if (existingBySlug && (!args.excludeProjectId || existingBySlug._id !== args.excludeProjectId)) {
      return { available: false, slug, reason: 'slug_taken', existingName: existingBySlug.name };
    }

    // Check if exact name already exists (case-insensitive)
    const allProjects = await ctx.db.query('projects').collect();
    const nameLower = args.name.toLowerCase().trim();
    const existingByName = allProjects.find(
      (p) => p.name.toLowerCase().trim() === nameLower && 
             (!args.excludeProjectId || p._id !== args.excludeProjectId)
    );

    if (existingByName) {
      return { available: false, slug, reason: 'name_taken', existingName: existingByName.name };
    }

    return { available: true, slug, reason: null, existingName: null };
  },
});


// ═══════════════════════════════════════════════════════════════════════════
// CASCADE DELETE — called by main platform when a Supabase project is deleted
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Delete a Convex project (+ all conversations, files, snapshots) by Supabase UUID.
 * Returns Daytona workspace IDs so the caller can also destroy the sandbox.
 */
export const deleteBySupabaseId = mutation({
  args: { supabaseProjectId: v.string() },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query('projects')
      .withIndex('by_supabaseProjectId', (q) =>
        q.eq('supabaseProjectId', args.supabaseProjectId)
      )
      .first();

    if (!project) {
      return { success: true, deleted: false, daytonaWorkspaceIds: [] };
    }

    const daytonaWorkspaceIds: string[] = [];
    if (project.daytonaWorkspaceId) {
      daytonaWorkspaceIds.push(project.daytonaWorkspaceId);
    }

    // Delete all conversations linked to this project
    const conversations = await ctx.db
      .query('conversations')
      .withIndex('by_project', (q) => q.eq('projectId', project._id))
      .collect();

    for (const convo of conversations) {
      await ctx.db.delete(convo._id);
    }

    // Delete all files
    const files = await ctx.db
      .query('files')
      .withIndex('by_project', (q) => q.eq('projectId', project._id))
      .collect();

    for (const file of files) {
      await ctx.db.delete(file._id);
    }

    // Delete all snapshots
    const snapshots = await ctx.db
      .query('snapshots')
      .withIndex('by_project', (q) => q.eq('projectId', project._id))
      .collect();

    for (const snapshot of snapshots) {
      await ctx.db.delete(snapshot._id);
    }

    // Delete the project itself
    await ctx.db.delete(project._id);

    return { success: true, deleted: true, daytonaWorkspaceIds };
  },
});
