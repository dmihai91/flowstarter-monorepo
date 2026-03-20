import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';

/**
 * Cost tracking mutations and queries
 * Now includes anonymized query logging for analytics
 */

// Operation type for reuse
const operationType = v.union(
  v.literal('site_generation'),
  v.literal('site_modification'),
  v.literal('self_healing'),
  v.literal('asset_generation'),
  v.literal('chat'),
  v.literal('router'),
  v.literal('planning'),
  v.literal('other')
);

// Log a single LLM operation cost
export const logCost = mutation({
  args: {
    projectId: v.optional(v.id('projects')),
    operation: operationType,
    model: v.string(),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    costUSD: v.number(),
    durationMs: v.optional(v.number()),
    // NEW: Anonymized query for analytics
    anonymizedQuery: v.optional(v.string()),
    queryFingerprint: v.optional(v.string()),
    metadata: v.optional(v.object({
      template: v.optional(v.string()),
      language: v.optional(v.string()),
      selfHealAttempts: v.optional(v.number()),
      error: v.optional(v.string()),
      step: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('costs', {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Log multiple costs in a batch (for site generation with multiple LLM calls)
export const logCostBatch = mutation({
  args: {
    projectId: v.optional(v.id('projects')),
    operation: operationType,
    costs: v.array(v.object({
      model: v.string(),
      promptTokens: v.number(),
      completionTokens: v.number(),
      totalTokens: v.number(),
      costUSD: v.number(),
    })),
    totalDurationMs: v.optional(v.number()),
    anonymizedQuery: v.optional(v.string()),
    queryFingerprint: v.optional(v.string()),
    metadata: v.optional(v.object({
      template: v.optional(v.string()),
      language: v.optional(v.string()),
      selfHealAttempts: v.optional(v.number()),
      error: v.optional(v.string()),
      step: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids: Id<'costs'>[] = [];
    
    for (const cost of args.costs) {
      const id = await ctx.db.insert('costs', {
        projectId: args.projectId,
        operation: args.operation,
        model: cost.model,
        promptTokens: cost.promptTokens,
        completionTokens: cost.completionTokens,
        totalTokens: cost.totalTokens,
        costUSD: cost.costUSD,
        durationMs: args.totalDurationMs ? Math.round(args.totalDurationMs / args.costs.length) : undefined,
        anonymizedQuery: args.anonymizedQuery,
        queryFingerprint: args.queryFingerprint,
        metadata: args.metadata,
        createdAt: now,
      });
      ids.push(id);
    }
    
    return ids;
  },
});

// Get costs for a specific project
export const getProjectCosts = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const costs = await ctx.db
      .query('costs')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .order('desc')
      .collect();
    
    const totalCostUSD = costs.reduce((sum, c) => sum + c.costUSD, 0);
    const totalTokens = costs.reduce((sum, c) => sum + c.totalTokens, 0);
    
    return {
      costs,
      summary: {
        totalCostUSD,
        totalTokens,
        operationCount: costs.length,
      },
    };
  },
});

// Get costs by operation type (for analytics)
export const getCostsByOperation = query({
  args: {
    operation: v.optional(operationType),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let costs: Doc<'costs'>[];
    
    if (args.operation) {
      // Use filter instead of withIndex to avoid TypeScript union type issues
      costs = await ctx.db
        .query('costs')
        .filter((q) => q.eq(q.field('operation'), args.operation))
        .order('desc')
        .take(args.limit ?? 100);
    } else {
      costs = await ctx.db
        .query('costs')
        .order('desc')
        .take(args.limit ?? 100);
    }
    
    // Group by operation
    const byOperation: Record<string, { count: number; totalCostUSD: number; totalTokens: number }> = {};
    
    for (const cost of costs) {
      if (!byOperation[cost.operation]) {
        byOperation[cost.operation] = { count: 0, totalCostUSD: 0, totalTokens: 0 };
      }
      byOperation[cost.operation].count++;
      byOperation[cost.operation].totalCostUSD += cost.costUSD;
      byOperation[cost.operation].totalTokens += cost.totalTokens;
    }
    
    return {
      costs,
      byOperation,
      summary: {
        totalCostUSD: costs.reduce((sum, c) => sum + c.costUSD, 0),
        totalTokens: costs.reduce((sum, c) => sum + c.totalTokens, 0),
        operationCount: costs.length,
      },
    };
  },
});

// Get recent costs (for dashboard)
export const getRecentCosts = query({
  args: {
    limit: v.optional(v.number()),
    since: v.optional(v.number()), // Unix timestamp
  },
  handler: async (ctx, args) => {
    let costs = await ctx.db
      .query('costs')
      .withIndex('by_created')
      .order('desc')
      .take(args.limit ?? 50);
    
    if (args.since) {
      costs = costs.filter(c => c.createdAt >= args.since!);
    }
    
    // Calculate daily totals
    const dailyTotals: Record<string, { costUSD: number; tokens: number; count: number }> = {};
    
    for (const cost of costs) {
      const day = new Date(cost.createdAt).toISOString().split('T')[0];
      if (!dailyTotals[day]) {
        dailyTotals[day] = { costUSD: 0, tokens: 0, count: 0 };
      }
      dailyTotals[day].costUSD += cost.costUSD;
      dailyTotals[day].tokens += cost.totalTokens;
      dailyTotals[day].count++;
    }
    
    return {
      costs,
      dailyTotals,
      summary: {
        totalCostUSD: costs.reduce((sum, c) => sum + c.costUSD, 0),
        totalTokens: costs.reduce((sum, c) => sum + c.totalTokens, 0),
        operationCount: costs.length,
      },
    };
  },
});

// NEW: Get query patterns for analytics
export const getQueryPatterns = query({
  args: {
    limit: v.optional(v.number()),
    operation: v.optional(operationType),
  },
  handler: async (ctx, args) => {
    let costs = await ctx.db
      .query('costs')
      .order('desc')
      .take(args.limit ?? 500);
    
    if (args.operation) {
      costs = costs.filter(c => c.operation === args.operation);
    }
    
    // Group by fingerprint
    const patterns: Record<string, { 
      count: number; 
      totalCost: number;
      avgTokens: number;
      examples: string[];
    }> = {};
    
    for (const cost of costs) {
      const fp = cost.queryFingerprint || 'unknown';
      if (!patterns[fp]) {
        patterns[fp] = { count: 0, totalCost: 0, avgTokens: 0, examples: [] };
      }
      patterns[fp].count++;
      patterns[fp].totalCost += cost.costUSD;
      patterns[fp].avgTokens = (patterns[fp].avgTokens * (patterns[fp].count - 1) + cost.totalTokens) / patterns[fp].count;
      if (cost.anonymizedQuery && patterns[fp].examples.length < 3) {
        patterns[fp].examples.push(cost.anonymizedQuery);
      }
    }
    
    return { patterns };
  },
});
