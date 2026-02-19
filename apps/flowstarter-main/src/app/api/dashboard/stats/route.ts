import { useServerSupabaseWithAuth } from '@/hooks/useServerSupabase';
import { googleAnalyticsDataService } from '@/lib/google-analytics-data';
import { getValidGoogleCredentials } from '@/lib/google-oauth-helper';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Extended project type to include analytics columns that may be added via migration
// TODO: Remove this when database types are regenerated with analytics columns
interface ProjectWithAnalytics {
  id: string;
  name: string;
  status: string | null;
  template_id: string | null;
  created_at: string;
  generated_at: string | null;
  // Analytics columns (added via migration 20251207000001)
  analytics_ga_property_id?: string | null;
  analytics_ga_measurement_id?: string | null;
  analytics_fb_pixel?: string | null;
}

interface TemplateStat {
  template: string;
  count: number;
}

interface TrendsPoint {
  name: string;
  Created: number;
  Completed: number;
}

interface UserEngagementStats {
  totalUsers: number;
  activeUsersThisWeek: number;
  activeUsersThisMonth: number;
  newUsersThisMonth: number;
}

interface DashboardStatsPayload {
  totalProjects: number;
  liveProjects: number;
  totalLeads: number;
  uniqueVisitors: number;
  totalViews: number;
  avgSessionDuration: number;
  potentialRevenue: number;
  trendsData: TrendsPoint[];
  popularTemplates: TemplateStat[];
  userEngagement: UserEngagementStats;
  completedProjects: number;
  inProgressProjects: number;
  draftProjects: number;
  lastProject: {
    id: string;
    name: string;
    status: string;
    is_draft: boolean;
    updated_at: string;
  } | null;
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await useServerSupabaseWithAuth();

    // Fetch all projects for the user
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      throw projectsError;
    }

    const allProjects = projects || [];

    // Get the last project (most recently updated)
    const lastProject =
      allProjects.length > 0
        ? {
            id: allProjects[0].id,
            name: allProjects[0].name || 'Untitled Project',
            status: allProjects[0].status || 'draft',
            is_draft: allProjects[0].is_draft || false,
            updated_at: allProjects[0].updated_at || allProjects[0].created_at,
          }
        : null;

    // Calculate project stats by status
    const draftProjects = allProjects.filter((p) => p.is_draft).length;
    const liveProjects = allProjects.filter(
      (p) => p.status === 'active' && !p.is_draft
    ).length;
    const completedProjects = allProjects.filter(
      (p) => p.status === 'completed' && !p.is_draft
    ).length;
    const inProgressProjects = allProjects.filter(
      (p) =>
        (p.status === 'in_progress' && !p.is_draft) ||
        (p.status === 'active' && !p.is_draft)
    ).length;

    // Total projects includes drafts + completed + live + in progress
    const totalProjects = allProjects.length;

    // Calculate template popularity
    const templateCounts = allProjects.reduce((acc, project) => {
      const templateId = project.template_id || 'custom';
      acc[templateId] = (acc[templateId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularTemplates: TemplateStat[] = Object.entries(templateCounts)
      .map(([template, count]) => ({ template, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate trends data (last 7 days)
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const trendsData: TrendsPoint[] = last7Days.map((date) => {
      const dateStr = date.toISOString().split('T')[0];
      const created = allProjects.filter((p) => {
        const projectDate = new Date(p.created_at).toISOString().split('T')[0];
        return projectDate === dateStr;
      }).length;

      const completed = allProjects.filter((p) => {
        if (p.status !== 'completed' || !p.updated_at) return false;
        const completedDate = new Date(p.updated_at)
          .toISOString()
          .split('T')[0];
        return completedDate === dateStr;
      }).length;

      return {
        name: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        Created: created,
        Completed: completed,
      };
    });

    // Calculate user engagement stats
    // Note: In a real implementation, you'd query a users table or analytics
    // For now, we'll provide placeholder data since the schema doesn't have user tracking
    const userEngagement: UserEngagementStats = {
      totalUsers: 1, // Current user
      activeUsersThisWeek: 1,
      activeUsersThisMonth: 1,
      newUsersThisMonth: 0,
    };

    // Calculate analytics stats from Google Analytics
    let totalLeads = 0;
    let uniqueVisitors = 0;
    let totalViews = 0;
    let avgSessionDuration = 0;
    let potentialRevenue = 0;

    // Try to get OAuth access token for the user
    const accessToken = await getValidGoogleCredentials(userId);

    // Fetch analytics data if user has Google Analytics connected
    if (accessToken) {
      // Get all projects with GA configured
      // Cast to extended type that includes analytics columns
      const projectsWithGA = (allProjects as ProjectWithAnalytics[]).filter(
        (p) => p.analytics_ga_property_id
      );

      if (projectsWithGA.length > 0) {
        // Fetch analytics for each project and aggregate
        const analyticsPromises = projectsWithGA.map((project) =>
          googleAnalyticsDataService
            .getProjectOverview(
              project.analytics_ga_property_id!,
              30,
              accessToken
            )
            .catch((err) => {
              console.error(
                `Failed to fetch analytics for project ${project.id}:`,
                err
              );
              return null;
            })
        );

        const analyticsResults = await Promise.all(analyticsPromises);

        // Aggregate analytics data across all projects
        analyticsResults.forEach((analytics) => {
          if (analytics) {
            totalViews += analytics.totalPageViews;
            uniqueVisitors += analytics.uniqueVisitors;
            totalLeads += analytics.totalLeads;
            avgSessionDuration += analytics.avgSessionDuration;
          }
        });

        // Average the session duration across projects
        if (projectsWithGA.length > 0) {
          avgSessionDuration = Math.round(
            avgSessionDuration / projectsWithGA.length
          );
        }

        // Calculate potential revenue (example: $50 per lead)
        potentialRevenue = totalLeads * 50;
      }
    }

    const stats: DashboardStatsPayload = {
      totalProjects,
      liveProjects,
      totalLeads,
      uniqueVisitors,
      totalViews,
      avgSessionDuration,
      potentialRevenue,
      trendsData,
      popularTemplates,
      userEngagement,
      completedProjects,
      inProgressProjects,
      draftProjects,
      lastProject,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
