import { z } from 'zod';

/**
 * Dashboard statistics response schema.
 */
export const DashboardStatsResponseSchema = z.object({
  projects: z.object({
    total: z.number(),
    published: z.number(),
    draft: z.number(),
    generating: z.number(),
  }),
  analytics: z
    .object({
      totalViews: z.number(),
      totalVisitors: z.number(),
      viewsThisMonth: z.number(),
      visitorsThisMonth: z.number(),
      topPages: z
        .array(
          z.object({
            path: z.string(),
            views: z.number(),
          })
        )
        .optional(),
    })
    .optional(),
  recentActivity: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum([
          'project_created',
          'project_published',
          'project_updated',
          'domain_verified',
        ]),
        projectId: z.string().optional(),
        projectName: z.string().optional(),
        timestamp: z.string(),
      })
    )
    .optional(),
  usage: z
    .object({
      aiGenerationsThisMonth: z.number(),
      aiGenerationsLimit: z.number(),
      storageUsedMB: z.number(),
      storageLimitMB: z.number(),
    })
    .optional(),
});

export type DashboardStatsResponse = z.infer<
  typeof DashboardStatsResponseSchema
>;

/**
 * Dashboard activity request schema (for pagination).
 */
export const DashboardActivityRequestSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
  type: z
    .enum([
      'project_created',
      'project_published',
      'project_updated',
      'domain_verified',
    ])
    .optional(),
});

export type DashboardActivityRequest = z.infer<
  typeof DashboardActivityRequestSchema
>;

/**
 * Dashboard activity item schema.
 */
export const ActivityItemSchema = z.object({
  id: z.string(),
  type: z.enum([
    'project_created',
    'project_published',
    'project_updated',
    'domain_verified',
  ]),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  description: z.string().optional(),
  timestamp: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export type ActivityItem = z.infer<typeof ActivityItemSchema>;

/**
 * Dashboard activity response schema.
 */
export const DashboardActivityResponseSchema = z.object({
  activities: z.array(ActivityItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    hasMore: z.boolean(),
  }),
});

export type DashboardActivityResponse = z.infer<
  typeof DashboardActivityResponseSchema
>;
