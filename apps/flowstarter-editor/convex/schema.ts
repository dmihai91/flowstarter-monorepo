import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Convex Schema for Flowstarter Editor
 *
 * Includes cost tracking for LLM operations
 */

// Business details collected during onboarding
const businessDetailsSchema = v.object({
  businessName: v.string(),
  description: v.string(),
  targetAudience: v.optional(v.string()),
  features: v.optional(v.array(v.string())),
  goals: v.optional(v.array(v.string())),
});

// Contact details for footer and contact page
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

// Integration settings for booking systems
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

// Integration settings for newsletter systems
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

// All integrations combined
const integrationsSchema = v.object({
  booking: v.optional(bookingIntegrationSchema),
  newsletter: v.optional(newsletterIntegrationSchema),
});

export default defineSchema({
  // ═══════════════════════════════════════════════════════════════════════════
  // TEAM MEMBERS - Internal team (Darius, Dorin, etc.)
  // ═══════════════════════════════════════════════════════════════════════════
  teamMembers: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal('admin'), v.literal('editor')),
    
    // Auth - using simple email-based auth for now
    passwordHash: v.optional(v.string()), // For password auth
    authProvider: v.optional(v.string()), // 'google', 'github', etc.
    authProviderId: v.optional(v.string()),
    
    // Session management
    lastLoginAt: v.optional(v.number()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_email', ['email']),

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIENTS - Client accounts linked to projects
  // ═══════════════════════════════════════════════════════════════════════════
  clients: defineTable({
    // Contact info
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    
    // Status
    status: v.union(
      v.literal('lead'),       // Initial contact
      v.literal('onboarding'), // Discovery call done, creating site
      v.literal('review'),     // Site ready for client review
      v.literal('active'),     // Launched, paying customer
      v.literal('churned')     // No longer active
    ),
    
    // Notes from discovery call
    discoveryNotes: v.optional(v.string()),
    
    // Subscription info (for future billing)
    plan: v.optional(v.union(
      v.literal('trial'),
      v.literal('starter'),
      v.literal('professional'),
      v.literal('enterprise')
    )),
    planStartedAt: v.optional(v.number()),
    
    // Created by team member
    createdBy: v.optional(v.id('teamMembers')),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_email', ['email'])
    .index('by_status', ['status'])
    .index('by_createdBy', ['createdBy']),

  // ═══════════════════════════════════════════════════════════════════════════
  // MAGIC LINKS - Secure access links for clients
  // ═══════════════════════════════════════════════════════════════════════════
  magicLinks: defineTable({
    // Link details
    token: v.string(), // Unique token (UUID or similar)
    
    // What this link grants access to
    clientId: v.id('clients'),
    projectId: v.id('projects'),
    
    // Access level
    accessLevel: v.union(
      v.literal('view'),       // Can only view the site
      v.literal('customize'),  // Can make customizations (default for clients)
      v.literal('full')        // Full access (for team sharing)
    ),
    
    // Validity
    expiresAt: v.optional(v.number()), // null = never expires
    usedAt: v.optional(v.number()),    // First use timestamp
    useCount: v.number(),              // How many times used
    maxUses: v.optional(v.number()),   // null = unlimited
    
    // Status
    isRevoked: v.boolean(),
    revokedAt: v.optional(v.number()),
    revokedReason: v.optional(v.string()),
    
    // Created by
    createdBy: v.optional(v.id('teamMembers')),
    
    createdAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_client', ['clientId'])
    .index('by_project', ['projectId']),

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSIONS - Auth sessions for both team and clients
  // ═══════════════════════════════════════════════════════════════════════════
  sessions: defineTable({
    // Session token (stored in cookie)
    token: v.string(),
    
    // Who this session belongs to
    userType: v.union(v.literal('team'), v.literal('client')),
    teamMemberId: v.optional(v.id('teamMembers')),
    clientId: v.optional(v.id('clients')),
    
    // For magic link sessions
    magicLinkId: v.optional(v.id('magicLinks')),
    projectId: v.optional(v.id('projects')), // Scoped to specific project
    
    // Session metadata
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    
    // Validity
    expiresAt: v.number(),
    lastActiveAt: v.number(),
    
    createdAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_teamMember', ['teamMemberId'])
    .index('by_client', ['clientId'])
    .index('by_expiresAt', ['expiresAt']),

  // Projects - core project data
  projects: defineTable({
    // Basic info
    urlId: v.string(), // URL-friendly identifier
    name: v.string(),
    description: v.string(),

    // ══════ NEW: Client & Team linking ══════
    clientId: v.optional(v.id('clients')),      // Which client owns this
    createdBy: v.optional(v.id('teamMembers')), // Which team member created it
    
    // Project status
    status: v.optional(v.union(
      v.literal('draft'),      // Being built by team
      v.literal('review'),     // Ready for client review
      v.literal('approved'),   // Client approved
      v.literal('published'),  // Live on the web
      v.literal('archived')    // No longer active
    )),

    // Business details from onboarding
    businessDetails: businessDetailsSchema,
    tags: v.array(v.string()),

    // Template
    templateId: v.string(),
    templateName: v.optional(v.string()),

    // Integrations (saved with project)
    integrations: v.optional(integrationsSchema),

    // Contact details (email, phone, address)
    contactDetails: v.optional(contactDetailsSchema),

    // Daytona workspace
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
    
    // ══════ NEW: Publishing info ══════
    publishedUrl: v.optional(v.string()),       // Live URL (e.g., client.flowstarter.app)
    customDomain: v.optional(v.string()),       // Custom domain if configured
    publishedAt: v.optional(v.number()),        // When it was published
    lastPublishedBy: v.optional(v.id('teamMembers')),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_urlId', ['urlId'])
    .index('by_updatedAt', ['updatedAt'])
    .index('by_workspace', ['daytonaWorkspaceId'])
    .index('by_client', ['clientId'])
    .index('by_status', ['status']),

  // Files - editor file contents
  files: defineTable({
    projectId: v.id('projects'),
    path: v.string(), // File path relative to project root
    content: v.string(), // File contents
    type: v.union(v.literal('file'), v.literal('folder')),
    isBinary: v.boolean(),
    updatedAt: v.number(),
  })
    .index('by_project', ['projectId'])
    .index('by_project_path', ['projectId', 'path'])
    .index('by_project_updated', ['projectId', 'updatedAt']),

  // Conversations - lightweight chat state for editor onboarding
  conversations: defineTable({
    sessionId: v.string(),
    title: v.string(),
    isActive: v.boolean(),

    // Optional project link
    projectId: v.optional(v.id('projects')),
    projectName: v.optional(v.string()),
    projectUrlId: v.optional(v.string()),

    // Onboarding state
    step: v.optional(v.string()),
    projectDescription: v.optional(v.string()),
    selectedTemplateId: v.optional(v.string()),
    selectedTemplateName: v.optional(v.string()),
    selectedPalette: v.optional(
      v.object({
        id: v.string(),
        name: v.string(),
        colors: v.array(v.string()),
      }),
    ),
    selectedFont: v.optional(
      v.object({
        id: v.string(),
        name: v.string(),
        heading: v.string(),
        body: v.string(),
      }),
    ),
    selectedLogo: v.optional(
      v.object({
        url: v.optional(v.string()),
        storageId: v.optional(v.id('_storage')),
        type: v.union(v.literal('uploaded'), v.literal('generated'), v.literal('none')),
        prompt: v.optional(v.string()),
      }),
    ),
    buildPhase: v.optional(v.string()),
    
    // Integrations (draft state during onboarding)
    integrations: v.optional(integrationsSchema),

    // Contact details (draft state during onboarding)
    contactDetails: v.optional(contactDetailsSchema),
    
    // Business discovery progress
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

    // Pipeline orchestration state
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

    // Messages embedded on conversation
    messages: v.optional(
      v.union(
        v.array(
          v.object({
            id: v.string(),
            role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
            content: v.string(),
            createdAt: v.number(),
            component: v.optional(v.string()),
            metadata: v.optional(v.string()),
          }),
        ),
        v.string(),
      ),
    ),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_session', ['sessionId'])
    .index('by_session_updated', ['sessionId', 'updatedAt'])
    .index('by_project', ['projectId']),

  // Snapshots - for saving project state at key milestones
  snapshots: defineTable({
    projectId: v.id('projects'),
    name: v.string(),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    blobUrl: v.optional(v.string()),
    storageId: v.optional(v.id('_storage')),
    data: v.optional(v.any()),
    compressedSize: v.optional(v.number()),
    uncompressedSize: v.optional(v.number()),
    fileCount: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_project', ['projectId'])
    .index('by_project_created', ['projectId', 'createdAt']),

  // Assets - AI-generated images and media for projects
  assets: defineTable({
    projectId: v.id('projects'),
    type: v.union(
      v.literal('hero'),
      v.literal('product'),
      v.literal('team'),
      v.literal('background'),
      v.literal('logo'),
      v.literal('custom')
    ),
    name: v.string(),
    prompt: v.string(),
    storageId: v.optional(v.id('_storage')),
    url: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        model: v.optional(v.string()),
        seed: v.optional(v.number()),
      })
    ),
    status: v.union(
      v.literal('pending'),
      v.literal('generating'),
      v.literal('ready'),
      v.literal('error')
    ),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_project', ['projectId'])
    .index('by_project_type', ['projectId', 'type'])
    .index('by_status', ['status']),

  // ═══════════════════════════════════════════════════════════════════════════
  // COSTS - Track LLM usage and costs for billing/analytics
  // ═══════════════════════════════════════════════════════════════════════════
  costs: defineTable({
    // Link to project (optional - some costs may be pre-project)
    projectId: v.optional(v.id('projects')),
    
    // Operation type for grouping
    operation: v.union(
      v.literal('site_generation'),      // Initial site build
      v.literal('site_modification'),    // Gretly/simple mods
      v.literal('self_healing'),         // Build error fixes
      v.literal('asset_generation'),     // fal.ai images
      v.literal('chat'),                 // Onboarding chat
      v.literal('router'),               // Modification router
      v.literal('planning'),             // Planning with Opus
      v.literal('other')
    ),
    
    // Model used
    model: v.string(),
    
    // Token usage
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    
    // Cost in USD
    costUSD: v.number(),
    
    // Duration in milliseconds
    durationMs: v.optional(v.number()),
    
    // Anonymized query for analytics (PII removed)
    anonymizedQuery: v.optional(v.string()),
    
    // Query fingerprint for grouping similar queries
    queryFingerprint: v.optional(v.string()),
    
    // Additional context
    metadata: v.optional(v.object({
      template: v.optional(v.string()),
      language: v.optional(v.string()),
      selfHealAttempts: v.optional(v.number()),
      error: v.optional(v.string()),
      step: v.optional(v.string()),
    })),
    
    createdAt: v.number(),
  })
    .index('by_project', ['projectId'])
    .index('by_operation', ['operation'])
    .index('by_created', ['createdAt'])
    .index('by_project_operation', ['projectId', 'operation'])
    .index('by_fingerprint', ['queryFingerprint']),

  // ═══════════════════════════════════════════════════════════════════════════
  // UNSUPPORTED REQUESTS - Track requests for features we don't support yet
  // ═══════════════════════════════════════════════════════════════════════════
  unsupportedRequests: defineTable({
    // Type of unsupported request (ecommerce, saas, restaurant, etc.)
    requestType: v.string(),
    
    // Original user description
    userDescription: v.string(),
    
    // Anonymized version (PII stripped)
    anonymizedDescription: v.optional(v.string()),
    
    // Keywords that triggered the detection
    detectedKeywords: v.optional(v.array(v.string())),
    
    // Session tracking
    sessionId: v.optional(v.string()),
    
    // Additional metadata
    metadata: v.optional(v.object({
      userAgent: v.optional(v.string()),
      referrer: v.optional(v.string()),
    })),
    
    createdAt: v.number(),
  })
    .index('by_type', ['requestType'])
    .index('by_created', ['createdAt']),
});
