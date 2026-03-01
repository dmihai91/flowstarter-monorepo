import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const messageSchema = v.object({
  id: v.string(),
  role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
  content: v.string(),
  createdAt: v.number(),
  component: v.optional(v.string()),
  metadata: v.optional(v.string()),
});

// Integration schemas
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

// Local runtime type to keep TS happy when schema allows legacy strings
type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  component?: string;
  metadata?: string;
};

function normalizeMessagesField(messages: unknown): ChatMessage[] {
  if (Array.isArray(messages)) return messages as ChatMessage[];
  if (typeof messages === "string") {
    try {
      const parsed = JSON.parse(messages);
      return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

// List conversations by session (most recent first)
export const getBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_session_updated", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();
  },
});

// Get active conversation for session
export const getActiveBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

// Get conversation by ID
export const getById = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get messages for a conversation (with optional pagination for performance)
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const convo = await ctx.db.get(args.conversationId);
    const allMessages = normalizeMessagesField(convo?.messages);

    // If no pagination args, return all messages (backwards compatible)
    if (args.limit === undefined && args.offset === undefined) {
      return allMessages;
    }

    // Apply pagination - return most recent messages first for faster initial load
    const offset = args.offset ?? 0;
    const limit = args.limit ?? 50;

    // For initial load optimization, we want the LAST N messages (most recent)
    // Slice from the end of the array
    const startIdx = Math.max(0, allMessages.length - offset - limit);
    const endIdx = allMessages.length - offset;

    return allMessages.slice(startIdx, endIdx);
  },
});

// Get message count for a conversation (for pagination UI)
export const getMessageCount = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const convo = await ctx.db.get(args.conversationId);
    const messages = normalizeMessagesField(convo?.messages);
    return messages.length;
  },
});

// Create conversation
export const create = mutation({
  args: {
    sessionId: v.string(),
    title: v.string(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Deactivate existing active conversation for this session
    const existingActive = await ctx.db
      .query("conversations")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    for (const convo of existingActive) {
      await ctx.db.patch(convo._id, { isActive: false, updatedAt: now });
    }

    return await ctx.db.insert("conversations", {
      sessionId: args.sessionId,
      title: args.title,
      isActive: true,
      projectId: args.projectId,
      messages: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Create conversation with project link and initial state/messages
// Used when user sends their first prompt - creates project + conversation atomically
export const createWithProject = mutation({
  args: {
    sessionId: v.string(),
    projectId: v.id("projects"),
    projectUrlId: v.string(),
    projectDescription: v.optional(v.string()),
    projectName: v.optional(v.string()),
    step: v.optional(v.string()),
    messages: v.optional(v.array(messageSchema)),
    businessInfo: v.optional(
      v.object({
        uvp: v.optional(v.string()),
        targetAudience: v.optional(v.string()),
        businessGoals: v.optional(v.array(v.string())),
        brandTone: v.optional(v.string()),
        sellingMethod: v.optional(v.string()),
        sellingMethodDetails: v.optional(v.string()),
        pricingOffers: v.optional(v.string()),
        industry: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Deactivate existing active conversation for this session
    const existingActive = await ctx.db
      .query("conversations")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    for (const convo of existingActive) {
      await ctx.db.patch(convo._id, { isActive: false, updatedAt: now });
    }

    return await ctx.db.insert("conversations", {
      sessionId: args.sessionId,
      title: args.projectName || "", // Use project name if available
      isActive: true,
      projectId: args.projectId,
      projectName: args.projectName,
      projectUrlId: args.projectUrlId,
      projectDescription: args.projectDescription,
      businessInfo: args.businessInfo,
      step: args.step || "describe",
      messages: args.messages || [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Set active conversation
export const setActive = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const convo = await ctx.db.get(args.id);
    if (!convo) return null;
    const now = Date.now();

    const siblings = await ctx.db
      .query("conversations")
      .withIndex("by_session", (q) => q.eq("sessionId", convo.sessionId))
      .collect();
    for (const s of siblings) {
      await ctx.db.patch(s._id, { isActive: s._id === args.id, updatedAt: now });
    }

    return args.id;
  },
});

// Rename conversation
export const rename = mutation({
  args: { id: v.id("conversations"), title: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { title: args.title, updatedAt: Date.now() });
    return args.id;
  },
});

// Update project name on conversation
export const updateProjectName = mutation({
  args: { id: v.id("conversations"), projectName: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { projectName: args.projectName, updatedAt: Date.now() });
    return args.id;
  },
});

// Delete conversation and associated project data
export const remove = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    // 1. Get the conversation to check for linked project
    const conversation = await ctx.db.get(args.id);
    
    // Track workspace IDs to return
    const daytonaWorkspaceIds: string[] = [];
    
    if (conversation && conversation.projectId) {
      const projectId = conversation.projectId;
      
      // Get the project to find the workspace ID
      const project = await ctx.db.get(projectId);
      if (project) {
        if (project.daytonaWorkspaceId) {
          daytonaWorkspaceIds.push(project.daytonaWorkspaceId);
        }
      }
      
      // 2. Delete all files for this project
      const files = await ctx.db
        .query('files')
        .withIndex('by_project', (q) => q.eq('projectId', projectId))
        .collect();

      for (const file of files) {
        await ctx.db.delete(file._id);
      }

      // 3. Delete snapshots for this project
      const snapshots = await ctx.db
        .query('snapshots')
        .withIndex('by_project', (q) => q.eq('projectId', projectId))
        .collect();
        
      for (const snapshot of snapshots) {
        await ctx.db.delete(snapshot._id);
      }

      // 4. Delete the project itself (if it exists)
      if (project) {
        await ctx.db.delete(projectId);
      }
    }

    // 5. Delete the conversation
    if (conversation) {
      await ctx.db.delete(args.id);
    }
    
    return { success: true, daytonaWorkspaceIds };
  },
});

// Link conversation to a project
export const linkToProject = mutation({
  args: {
    id: v.id("conversations"),
    projectId: v.id("projects"),
    projectUrlId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      projectId: args.projectId,
      projectUrlId: args.projectUrlId,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

// Add a single message
export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    component: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const convo = await ctx.db.get(args.conversationId);
    if (!convo) return null;

    const messagesArr = normalizeMessagesField(convo.messages);
    const nextMessage: ChatMessage = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
      component: args.component,
      metadata: args.metadata,
    };

    await ctx.db.patch(args.conversationId, {
      messages: [...messagesArr, nextMessage],
      updatedAt: Date.now(),
    });

    return args.conversationId;
  },
});

// Save full message list
export const saveMessages = mutation({
  args: {
    conversationId: v.id("conversations"),
    messages: v.array(messageSchema),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      messages: args.messages,
      updatedAt: Date.now(),
    });
    return args.conversationId;
  },
});

// Clear messages
export const clearMessages = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, { messages: [], updatedAt: Date.now() });
    return args.conversationId;
  },
});

// One-off migration to convert legacy stringified messages to arrays
export const migrateLegacyMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("conversations").collect();
    let migrated = 0;
    for (const c of all) {
      if (typeof c.messages === "string") {
        let parsed: ChatMessage[] = [];
        try {
          const p = JSON.parse(c.messages);
          parsed = Array.isArray(p) ? (p as ChatMessage[]) : [];
        } catch {}
        await ctx.db.patch(c._id, { messages: parsed, updatedAt: Date.now() });
        migrated++;
      }
    }
    return { migrated };
  },
});

// Update conversation state (onboarding data)
export const updateState = mutation({
  args: {
    id: v.id("conversations"),
    step: v.optional(v.string()),
    projectDescription: v.optional(v.string()),
    selectedTemplateId: v.optional(v.string()),
    selectedTemplateName: v.optional(v.string()),
    selectedPalette: v.optional(
      v.object({ id: v.string(), name: v.string(), colors: v.array(v.string()) })
    ),
    selectedFont: v.optional(
      v.object({ id: v.string(), name: v.string(), heading: v.string(), body: v.string() })
    ),
    selectedLogo: v.optional(
      v.object({
        url: v.optional(v.string()),
        storageId: v.optional(v.id('_storage')),
        type: v.union(v.literal('uploaded'), v.literal('generated'), v.literal('none')),
        prompt: v.optional(v.string()),
      })
    ),
    projectUrlId: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    buildPhase: v.optional(v.string()),
    projectName: v.optional(v.string()),
    businessInfo: v.optional(
      v.object({
        uvp: v.optional(v.string()),
        targetAudience: v.optional(v.string()),
        businessGoals: v.optional(v.array(v.string())),
        brandTone: v.optional(v.string()),
        sellingMethod: v.optional(v.string()),
        sellingMethodDetails: v.optional(v.string()),
        pricingOffers: v.optional(v.string()),
        industry: v.optional(v.string()),
        offerings: v.optional(v.string()),
        contactEmail: v.optional(v.string()),
        contactPhone: v.optional(v.string()),
        contactAddress: v.optional(v.string()),
        website: v.optional(v.string()),
      })
    ),
    pipelineState: v.optional(
      v.object({
        currentStep: v.string(),
        previousStep: v.optional(v.string()),
        nextStep: v.optional(v.string()),
        completedSteps: v.array(v.string()),
        pendingTransition: v.optional(
          v.object({
            fromStep: v.string(),
            toStep: v.string(),
            messageGenerated: v.boolean(),
            timestamp: v.number(),
          })
        ),
      })
    ),
    // Integrations can be updated via updateState too
    integrations: v.optional(integrationsSchema),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return id;
  },
});

// Update integrations only (for dedicated integration UI)
export const updateIntegrations = mutation({
  args: {
    id: v.id("conversations"),
    integrations: integrationsSchema,
  },
  handler: async (ctx, args) => {
    const { id, integrations } = args;
    await ctx.db.patch(id, { integrations, updatedAt: Date.now() });
    return id;
  },
});

// Update booking integration on conversation
export const updateBookingIntegration = mutation({
  args: {
    id: v.id("conversations"),
    booking: bookingIntegrationSchema,
  },
  handler: async (ctx, args) => {
    const { id, booking } = args;
    const convo = await ctx.db.get(id);
    if (!convo) throw new Error('Conversation not found');

    const integrations = {
      ...convo.integrations,
      booking,
    };

    await ctx.db.patch(id, { integrations, updatedAt: Date.now() });
    return id;
  },
});

// Update newsletter integration on conversation
export const updateNewsletterIntegration = mutation({
  args: {
    id: v.id("conversations"),
    newsletter: newsletterIntegrationSchema,
  },
  handler: async (ctx, args) => {
    const { id, newsletter } = args;
    const convo = await ctx.db.get(id);
    if (!convo) throw new Error('Conversation not found');

    const integrations = {
      ...convo.integrations,
      newsletter,
    };

    await ctx.db.patch(id, { integrations, updatedAt: Date.now() });
    return id;
  },
});

