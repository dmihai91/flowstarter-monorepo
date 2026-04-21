import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const fileEntryValidator = v.object({
  path: v.string(),
  content: v.string(),
});

/**
 * Large generation / review payloads keyed by Supabase `projects.id` (UUID).
 * Stored in Convex so Postgres `projects` rows stay small for list queries.
 */
export const getBySupabaseId = query({
  args: { supabaseProjectId: v.string() },
  handler: async (ctx, { supabaseProjectId }) => {
    return await ctx.db
      .query('supabaseReviewArtifacts')
      .withIndex('by_supabaseProjectId', (q) =>
        q.eq('supabaseProjectId', supabaseProjectId),
      )
      .first();
  },
});

export const upsert = mutation({
  args: {
    supabaseProjectId: v.string(),
    generatedCode: v.optional(v.string()),
    previewHtml: v.optional(v.string()),
    generatedFiles: v.optional(v.array(fileEntryValidator)),
    qualityMetricsJson: v.optional(v.string()),
    generationCompletedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query('supabaseReviewArtifacts')
      .withIndex('by_supabaseProjectId', (q) =>
        q.eq('supabaseProjectId', args.supabaseProjectId),
      )
      .first();

    const patch = {
      generatedCode: args.generatedCode,
      previewHtml: args.previewHtml,
      generatedFiles: args.generatedFiles,
      qualityMetricsJson: args.qualityMetricsJson,
      generationCompletedAt: args.generationCompletedAt,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert('supabaseReviewArtifacts', {
      supabaseProjectId: args.supabaseProjectId,
      ...patch,
    });
  },
});

export const deleteBySupabaseId = mutation({
  args: { supabaseProjectId: v.string() },
  handler: async (ctx, { supabaseProjectId }) => {
    const row = await ctx.db
      .query('supabaseReviewArtifacts')
      .withIndex('by_supabaseProjectId', (q) =>
        q.eq('supabaseProjectId', supabaseProjectId),
      )
      .first();
    if (!row) return { deleted: 0 };
    await ctx.db.delete(row._id);
    return { deleted: 1 };
  },
});
