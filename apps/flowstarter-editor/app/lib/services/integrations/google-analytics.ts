/**
 * Google Analytics Data API v1 (GA4)
 *
 * Uses a service account to pull analytics data for client sites.
 * The service account is added as a viewer on the client's GA4 property.
 *
 * Auth flow:
 * 1. We create a GCP service account (once)
 * 2. Client adds our service account email as Viewer on their GA4 property
 * 3. We use the service account to pull reports via GA4 Data API
 *
 * Alternative (OAuth):
 * 1. Client clicks "Connect Google Analytics" in dashboard
 * 2. OAuth consent → we get refresh token
 * 3. Store refresh token in Supabase (encrypted)
 * 4. Use it to pull reports
 */

export interface GA4ReportRequest {
  propertyId: string; // GA4 property ID (e.g., "properties/123456")
  startDate: string;  // YYYY-MM-DD or "30daysAgo"
  endDate: string;    // YYYY-MM-DD or "today"
}

export interface GA4Metric {
  name: string;
  value: number;
}

export interface GA4DimensionRow {
  dimension: string;
  metrics: GA4Metric[];
}

export interface GA4Report {
  overview: {
    totalUsers: number;
    newUsers: number;
    sessions: number;
    pageviews: number;
    avgSessionDuration: number; // seconds
    bounceRate: number;         // 0-1
  };
  topPages: GA4DimensionRow[];
  trafficSources: GA4DimensionRow[];
  dailyUsers: Array<{ date: string; users: number; pageviews: number }>;
}

const GA4_API = 'https://analyticsdata.googleapis.com/v1beta';

/**
 * Fetch GA4 report via Data API.
 * Requires an access token (from service account or OAuth).
 */
export async function fetchGA4Report(
  propertyId: string,
  accessToken: string,
  dateRange: { startDate: string; endDate: string } = { startDate: '30daysAgo', endDate: 'today' },
): Promise<GA4Report> {
  const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;

  // Run 3 parallel requests for different report types
  const [overviewData, pagesData, dailyData] = await Promise.all([
    runGA4Report(property, accessToken, {
      metrics: [
        { name: 'totalUsers' }, { name: 'newUsers' }, { name: 'sessions' },
        { name: 'screenPageViews' }, { name: 'averageSessionDuration' }, { name: 'bounceRate' },
      ],
      dateRanges: [dateRange],
    }),
    runGA4Report(property, accessToken, {
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
      dateRanges: [dateRange],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    }),
    runGA4Report(property, accessToken, {
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'totalUsers' }, { name: 'screenPageViews' }],
      dateRanges: [dateRange],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
  ]);

  // Parse overview
  const ov = overviewData.rows?.[0]?.metricValues || [];
  const overview = {
    totalUsers: parseInt(ov[0]?.value || '0'),
    newUsers: parseInt(ov[1]?.value || '0'),
    sessions: parseInt(ov[2]?.value || '0'),
    pageviews: parseInt(ov[3]?.value || '0'),
    avgSessionDuration: parseFloat(ov[4]?.value || '0'),
    bounceRate: parseFloat(ov[5]?.value || '0'),
  };

  // Parse top pages
  const topPages = (pagesData.rows || []).map((row: GA4Row) => ({
    dimension: row.dimensionValues?.[0]?.value || '',
    metrics: [
      { name: 'pageviews', value: parseInt(row.metricValues?.[0]?.value || '0') },
      { name: 'users', value: parseInt(row.metricValues?.[1]?.value || '0') },
    ],
  }));

  // Parse daily users
  const dailyUsers = (dailyData.rows || []).map((row: GA4Row) => ({
    date: row.dimensionValues?.[0]?.value || '',
    users: parseInt(row.metricValues?.[0]?.value || '0'),
    pageviews: parseInt(row.metricValues?.[1]?.value || '0'),
  }));

  return { overview, topPages, trafficSources: [], dailyUsers };
}

interface GA4Row {
  dimensionValues?: Array<{ value: string }>;
  metricValues?: Array<{ value: string }>;
}

interface GA4RunReportResponse {
  rows?: GA4Row[];
}

async function runGA4Report(
  property: string,
  accessToken: string,
  body: Record<string, unknown>,
): Promise<GA4RunReportResponse> {
  const res = await fetch(`${GA4_API}/${property}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GA4 API error ${res.status}: ${err}`);
  }
  return res.json() as Promise<GA4RunReportResponse>;
}
