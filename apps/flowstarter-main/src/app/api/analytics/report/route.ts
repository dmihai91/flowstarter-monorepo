/**
 * GET /api/analytics/report?projectId=xxx&range=30
 * Fetches GA4 analytics. Reads refresh token from Vault (encrypted at rest).
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { readSecret } from '@/lib/vault';

const GA4_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GA4_API = 'https://analyticsdata.googleapis.com/v1beta';

interface GA4Row {
  dimensionValues?: Array<{ value: string }>;
  metricValues?: Array<{ value: string }>;
}

export async function GET(request: NextRequest) {
  await requireAuth();
  const projectId = request.nextUrl.searchParams.get('projectId');
  const range = parseInt(request.nextUrl.searchParams.get('range') || '30');

  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const supabase = createSupabaseServiceRoleClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, ga_property_id, ga_refresh_token_id, owner_id, team_id')
    .eq('id', projectId)
    .single();

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (!project.ga_property_id || !project.ga_refresh_token_id) {
    return NextResponse.json({ error: 'Google Analytics not connected' }, { status: 400 });
  }

  // Decrypt refresh token from Vault
  const refreshToken = await readSecret(supabase, project.ga_refresh_token_id);
  if (!refreshToken) {
    return NextResponse.json({ error: 'Token not found in vault' }, { status: 500 });
  }

  // Exchange for access token
  const tokenRes = await fetch(GA4_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.json({ error: 'Failed to refresh Google token' }, { status: 401 });
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };
  const property = `properties/${project.ga_property_id}`;
  const dateRange = { startDate: `${range}daysAgo`, endDate: 'today' };

  const [overview, pages, daily] = await Promise.all([
    ga4Report(property, access_token, {
      metrics: [
        { name: 'totalUsers' }, { name: 'newUsers' }, { name: 'sessions' },
        { name: 'screenPageViews' }, { name: 'averageSessionDuration' }, { name: 'bounceRate' },
      ],
      dateRanges: [dateRange],
    }),
    ga4Report(property, access_token, {
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
      dateRanges: [dateRange],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    }),
    ga4Report(property, access_token, {
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'totalUsers' }, { name: 'screenPageViews' }],
      dateRanges: [dateRange],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
  ]);

  const ov = overview.rows?.[0]?.metricValues || [];

  return NextResponse.json({
    overview: {
      totalUsers: parseInt(ov[0]?.value || '0'),
      newUsers: parseInt(ov[1]?.value || '0'),
      sessions: parseInt(ov[2]?.value || '0'),
      pageviews: parseInt(ov[3]?.value || '0'),
      avgSessionDuration: parseFloat(ov[4]?.value || '0'),
      bounceRate: parseFloat(ov[5]?.value || '0'),
    },
    topPages: (pages.rows || []).map((r: GA4Row) => ({
      path: r.dimensionValues?.[0]?.value,
      pageviews: parseInt(r.metricValues?.[0]?.value || '0'),
      users: parseInt(r.metricValues?.[1]?.value || '0'),
    })),
    dailyUsers: (daily.rows || []).map((r: GA4Row) => ({
      date: r.dimensionValues?.[0]?.value,
      users: parseInt(r.metricValues?.[0]?.value || '0'),
      pageviews: parseInt(r.metricValues?.[1]?.value || '0'),
    })),
  });
}

async function ga4Report(property: string, token: string, body: Record<string, unknown>) {
  const res = await fetch(`${GA4_API}/${property}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GA4 ${res.status}`);
  return res.json() as Promise<{ rows?: GA4Row[] }>;
}
