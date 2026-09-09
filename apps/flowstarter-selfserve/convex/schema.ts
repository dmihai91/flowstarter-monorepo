import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// Convex holds the *live* agent state: build feed events, progress, and the
// orchestrator's task graph. Supabase remains the system of record for
// projects/payments; Convex is what the build screen subscribes to.
export default defineSchema({
  builds: defineTable({
    buildId: v.string(), // selfserve_builds.id (Supabase uuid)
    projectId: v.string(),
    status: v.string(),
    progress: v.number(),
    error: v.optional(v.string()),
    updatedAt: v.number(),
  }).index('by_buildId', ['buildId']),

  buildEvents: defineTable({
    buildId: v.string(),
    seq: v.number(),
    event: v.any(), // BuildEvent from @flowstarter/build-engine
  })
    .index('by_buildId', ['buildId'])
    .index('by_buildId_seq', ['buildId', 'seq']),

  // Orchestrator task graph — one row per planned agent task.
  agentTasks: defineTable({
    buildId: v.string(),
    taskId: v.string(),
    description: v.string(),
    agentRole: v.string(), // research | brand | copy | dev
    capability: v.string(),
    status: v.string(), // waiting | running | done | failed
    dependsOn: v.array(v.string()),
    output: v.optional(v.string()),
    error: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
  })
    .index('by_buildId', ['buildId'])
    .index('by_buildId_taskId', ['buildId', 'taskId']),
});
