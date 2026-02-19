import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Feedback and unsupported request logging
 * Captures user requests for features/business types we don't support yet
 */

// Log an unsupported business type request
export const logUnsupportedRequest = mutation({
  args: {
    requestType: v.string(), // e.g., 'ecommerce', 'saas', 'restaurant'
    userDescription: v.string(), // What the user originally asked for
    anonymizedDescription: v.optional(v.string()), // PII-stripped version
    detectedKeywords: v.optional(v.array(v.string())), // What triggered the detection
    sessionId: v.optional(v.string()),
    metadata: v.optional(v.object({
      userAgent: v.optional(v.string()),
      referrer: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('unsupportedRequests', {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Get unsupported requests for analytics
export const getUnsupportedRequests = query({
  args: {
    limit: v.optional(v.number()),
    requestType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let requests = await ctx.db
      .query('unsupportedRequests')
      .order('desc')
      .take(args.limit ?? 100);
    
    if (args.requestType) {
      requests = requests.filter(r => r.requestType === args.requestType);
    }
    
    // Group by type for analytics
    const byType: Record<string, number> = {};
    for (const req of requests) {
      byType[req.requestType] = (byType[req.requestType] || 0) + 1;
    }
    
    return {
      requests,
      byType,
      total: requests.length,
    };
  },
});

// Get summary of most requested unsupported features
export const getUnsupportedSummary = query({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db
      .query('unsupportedRequests')
      .order('desc')
      .collect();
    
    // Count by type
    const byType: Record<string, { count: number; lastRequested: number; examples: string[] }> = {};
    
    for (const req of requests) {
      if (!byType[req.requestType]) {
        byType[req.requestType] = { count: 0, lastRequested: 0, examples: [] };
      }
      byType[req.requestType].count++;
      if (req.createdAt > byType[req.requestType].lastRequested) {
        byType[req.requestType].lastRequested = req.createdAt;
      }
      if (req.anonymizedDescription && byType[req.requestType].examples.length < 5) {
        byType[req.requestType].examples.push(req.anonymizedDescription);
      }
    }
    
    // Sort by count
    const sorted = Object.entries(byType)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([type, data]) => ({ type, ...data }));
    
    return {
      summary: sorted,
      totalRequests: requests.length,
      uniqueTypes: sorted.length,
    };
  },
});
