import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Flowstarter Convex schema — T3-backed editor edition.
 *
 * Storage layout:
 *   - Supabase (flowstarter-main)     : team auth, billing, Supabase `projects`
 *                                       row (source of truth for project id).
 *   - Convex (this schema)            : durable cross-editor state shared by
 *                                       the team editor and the client editor
 *                                       (project record, sandbox pointer,
 *                                       thread + checkpoint registry, assets,
 *                                       costs, magic-link access control).
 *   - T3 SQLite (apps/t3-code/server) : per-session runtime state — WebSocket
 *                                       sessions, Claude tool-call streams,
 *                                       ephemeral projections. NOT mirrored
 *                                       into Convex; T3 owns it.
 *   - Daytona sandbox                 : actual project code + dev server.
 *                                       Spun up per project via flowstarter-
 *                                       main's /api/daytona/provision.
 *
 * Threads and checkpoints below are *registry rows* — just enough metadata
 * for team/client dashboards to list them and link back into T3. The real
 * content lives in T3's projection tables.
 */

// ─── Shared object schemas ────────────────────────────────────────────────

const paletteColorsSchema = v.object({
  primary: v.string(),
  secondary: v.string(),
  accent: v.string(),
  background: v.string(),
  text: v.string(),
});

const paletteSchema = v.object({
  id: v.string(),
  name: v.string(),
  colors: paletteColorsSchema,
});

const fontFamilySchema = v.object({
  family: v.string(),
  weight: v.optional(v.number()),
});

const fontSchema = v.object({
  id: v.string(),
  name: v.string(),
  heading: fontFamilySchema,
  body: fontFamilySchema,
});

export default defineSchema({
  // ─── Clients ───────────────────────────────────────────────────────────
  // Client accounts that own a published site. Team auth stays in Clerk /
  // flowstarter-main; this table models the end-customer.
  clients: defineTable({
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),

    clerkUserId: v.optional(v.string()),
    signupMethod: v.optional(
      v.union(v.literal('google'), v.literal('apple'), v.literal('email')),
    ),
    signedUpAt: v.optional(v.number()),

    status: v.union(
      v.literal('invited'),
      v.literal('onboarding'),
      v.literal('active'),
      v.literal('churned'),
    ),

    plan: v.optional(
      v.union(
        v.literal('trial'),
        v.literal('starter'),
        v.literal('professional'),
        v.literal('enterprise'),
      ),
    ),
    planStartedAt: v.optional(v.number()),

    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_email', ['email'])
    .index('by_status', ['status'])
    .index('by_clerkUserId', ['clerkUserId']),

  // ─── Magic links ───────────────────────────────────────────────────────
  // Shareable access tokens for client editor mode.
  magicLinks: defineTable({
    token: v.string(),
    clientId: v.id('clients'),
    projectId: v.id('projects'),

    accessLevel: v.union(
      v.literal('view'),
      v.literal('customize'),
      v.literal('full'),
    ),

    expiresAt: v.optional(v.number()),
    usedAt: v.optional(v.number()),
    useCount: v.number(),
    maxUses: v.optional(v.number()),

    isRevoked: v.boolean(),
    revokedAt: v.optional(v.number()),
    revokedReason: v.optional(v.string()),

    createdBy: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_client', ['clientId'])
    .index('by_project', ['projectId']),

  // ─── Client sessions ───────────────────────────────────────────────────
  // Long-lived per-device sessions backing magic-link access.
  clientSessions: defineTable({
    token: v.string(),
    clientId: v.id('clients'),

    magicLinkId: v.optional(v.id('magicLinks')),
    projectId: v.id('projects'),
    accessLevel: v.union(
      v.literal('view'),
      v.literal('customize'),
      v.literal('full'),
    ),

    userAgent: v.optional(v.string()),
    expiresAt: v.number(),
    lastActiveAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_client', ['clientId'])
    .index('by_project', ['projectId']),

  // ─── Projects ──────────────────────────────────────────────────────────
  // Minimal durable project record. Code lives in the Daytona sandbox
  // (currentSandbox*), runtime state lives in T3 SQLite; this row is the
  // bridge both editors + the team dashboard key off.
  projects: defineTable({
    urlId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),

    clientId: v.optional(v.id('clients')),
    createdBy: v.optional(v.string()),

    status: v.optional(
      v.union(
        v.literal('draft'),
        v.literal('review'),
        v.literal('approved'),
        v.literal('published'),
        v.literal('archived'),
      ),
    ),

    templateId: v.optional(v.string()),
    templateName: v.optional(v.string()),

    selectedPalette: v.optional(paletteSchema),
    selectedFont: v.optional(fontSchema),

    // Daytona sandbox the editors are currently wired to.
    currentSandboxId: v.optional(v.string()),
    currentSandboxUrl: v.optional(v.string()),
    currentSandboxPreviewUrl: v.optional(v.string()),
    currentSandboxStatus: v.optional(
      v.union(
        v.literal('provisioning'),
        v.literal('ready'),
        v.literal('building'),
        v.literal('running'),
        v.literal('error'),
        v.literal('stopped'),
      ),
    ),
    sandboxProvisionedAt: v.optional(v.number()),
    sandboxProvisionedBy: v.optional(v.string()),

    publishedUrl: v.optional(v.string()),
    customDomain: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    lastPublishedBy: v.optional(v.string()),

    supabaseProjectId: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_urlId', ['urlId'])
    .index('by_updatedAt', ['updatedAt'])
    .index('by_currentSandbox', ['currentSandboxId'])
    .index('by_client', ['clientId'])
    .index('by_status', ['status'])
    .index('by_supabaseProjectId', ['supabaseProjectId']),

  // ─── Threads ───────────────────────────────────────────────────────────
  // Registry of T3 threads per project. Content lives in T3 SQLite; this
  // row exists so the team dashboard can list threads and jump into them.
  threads: defineTable({
    projectId: v.id('projects'),
    t3ThreadId: v.string(),

    title: v.optional(v.string()),
    mode: v.optional(
      v.union(v.literal('team'), v.literal('client'), v.literal('platform')),
    ),
    archivedAt: v.optional(v.number()),
    lastActivityAt: v.optional(v.number()),

    createdByKind: v.optional(
      v.union(v.literal('clerk'), v.literal('client'), v.literal('system')),
    ),
    createdBy: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_project', ['projectId'])
    .index('by_t3Id', ['t3ThreadId'])
    .index('by_project_updated', ['projectId', 'updatedAt']),

  // ─── Checkpoints ───────────────────────────────────────────────────────
  // Registry of T3 checkpoints for time-travel / restore UX.
  checkpoints: defineTable({
    projectId: v.id('projects'),
    threadId: v.optional(v.id('threads')),
    t3CheckpointId: v.string(),

    label: v.optional(v.string()),
    description: v.optional(v.string()),

    createdByKind: v.optional(
      v.union(v.literal('clerk'), v.literal('client'), v.literal('system')),
    ),
    createdBy: v.optional(v.string()),

    createdAt: v.number(),
  })
    .index('by_project', ['projectId'])
    .index('by_thread', ['threadId'])
    .index('by_t3Id', ['t3CheckpointId'])
    .index('by_project_created', ['projectId', 'createdAt']),

  // ─── Assets ────────────────────────────────────────────────────────────
  // AI-generated media (hero images, logos, etc.). Dropping an asset from
  // the editor still leaves it here until the team or a cleanup job purges.
  assets: defineTable({
    projectId: v.id('projects'),
    type: v.union(
      v.literal('hero'),
      v.literal('product'),
      v.literal('team'),
      v.literal('background'),
      v.literal('logo'),
      v.literal('custom'),
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
      }),
    ),
    status: v.union(
      v.literal('pending'),
      v.literal('generating'),
      v.literal('ready'),
      v.literal('error'),
    ),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_project', ['projectId'])
    .index('by_project_type', ['projectId', 'type'])
    .index('by_status', ['status']),

  // ─── Costs ─────────────────────────────────────────────────────────────
  // Per-project LLM spend ledger. Mirrored into Supabase for billing.
  costs: defineTable({
    projectId: v.optional(v.id('projects')),
    operation: v.union(
      v.literal('site_generation'),
      v.literal('site_modification'),
      v.literal('self_healing'),
      v.literal('asset_generation'),
      v.literal('chat'),
      v.literal('router'),
      v.literal('planning'),
      v.literal('other'),
    ),
    model: v.string(),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    costUSD: v.number(),
    durationMs: v.optional(v.number()),
    anonymizedQuery: v.optional(v.string()),
    queryFingerprint: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        template: v.optional(v.string()),
        language: v.optional(v.string()),
        selfHealAttempts: v.optional(v.number()),
        error: v.optional(v.string()),
        step: v.optional(v.string()),
      }),
    ),
    createdAt: v.number(),
  })
    .index('by_project', ['projectId'])
    .index('by_operation', ['operation'])
    .index('by_created', ['createdAt'])
    .index('by_project_operation', ['projectId', 'operation'])
    .index('by_fingerprint', ['queryFingerprint']),

  // ─── Unsupported requests ──────────────────────────────────────────────
  // When a prospect asks for something we can't ship yet.
  unsupportedRequests: defineTable({
    requestType: v.string(),
    userDescription: v.string(),
    anonymizedDescription: v.optional(v.string()),
    detectedKeywords: v.optional(v.array(v.string())),
    sessionId: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        userAgent: v.optional(v.string()),
        referrer: v.optional(v.string()),
      }),
    ),
    createdAt: v.number(),
  })
    .index('by_type', ['requestType'])
    .index('by_created', ['createdAt']),
});
