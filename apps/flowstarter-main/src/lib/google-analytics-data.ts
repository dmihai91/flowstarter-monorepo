/**
 * Google Analytics Data API Integration
 * Fetches analytics data from Google Analytics for user projects
 *
 * Setup required:
 * 1. Enable Google Analytics Data API in Google Cloud Console
 * 2. Create a service account with Analytics Viewer permissions
 * 3. Download the service account key JSON
 * 4. Add GOOGLE_ANALYTICS_CREDENTIALS to .env
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { GoogleAuth } from 'google-auth-library';

// Types for our analytics data
export interface AnalyticsOverview {
  totalPageViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  totalLeads: number;
  avgSessionDuration: number;
  bounceRate: number;
  growth: {
    pageViews: number;
    visitors: number;
    leads: number;
  };
}

export interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
}

export interface GeographicData {
  country: string;
  visitors: number;
  percentage: number;
}

export interface DeviceData {
  deviceType: string;
  visitors: number;
  percentage: number;
}

export interface PagePerformance {
  path: string;
  pageViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

class GoogleAnalyticsDataService {
  private serviceAccountClient: BetaAnalyticsDataClient | null = null;

  constructor() {
    // Initialize the service account client if credentials are available
    if (process.env.GOOGLE_ANALYTICS_CREDENTIALS) {
      try {
        const credentials = JSON.parse(
          process.env.GOOGLE_ANALYTICS_CREDENTIALS
        );
        this.serviceAccountClient = new BetaAnalyticsDataClient({
          credentials,
        });
      } catch (error) {
        console.error(
          'Failed to initialize Google Analytics Data client:',
          error
        );
      }
    }
  }

  /**
   * Create a client with OAuth access token
   */
  private createOAuthClient(accessToken: string): BetaAnalyticsDataClient {
    // Create a client that uses the OAuth token directly in requests
    const authClient = new GoogleAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oauth2Client = new (authClient as any).OAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    return new BetaAnalyticsDataClient({
      authClient: oauth2Client,
    });
  }

  /**
   * Check if the service is properly configured (either service account or will use OAuth)
   */
  isConfigured(): boolean {
    // Always return true - we can use OAuth tokens at runtime
    return true;
  }

  /**
   * Get analytics overview for a property
   * @param propertyId - GA4 Property ID
   * @param days - Number of days to fetch data for
   * @param accessToken - Optional OAuth access token (if not provided, uses service account)
   */
  async getProjectOverview(
    propertyId: string,
    days: number = 30,
    accessToken?: string
  ): Promise<AnalyticsOverview> {
    const client = accessToken
      ? this.createOAuthClient(accessToken)
      : this.serviceAccountClient;

    if (!client) {
      return this.getEmptyOverview();
    }

    try {
      const [currentData, previousData] = await Promise.all([
        this.getMetricsForPeriod(propertyId, days, 0, client),
        this.getMetricsForPeriod(propertyId, days, days, client), // Previous period
      ]);

      const growth = {
        pageViews: this.calculateGrowth(
          currentData.totalPageViews,
          previousData.totalPageViews
        ),
        visitors: this.calculateGrowth(
          currentData.uniqueVisitors,
          previousData.uniqueVisitors
        ),
        leads: this.calculateGrowth(
          currentData.totalLeads,
          previousData.totalLeads
        ),
      };

      return { ...currentData, growth };
    } catch (error) {
      console.error('Failed to fetch analytics overview:', error);
      return this.getEmptyOverview();
    }
  }

  /**
   * Get metrics for a specific time period
   */
  private async getMetricsForPeriod(
    propertyId: string,
    days: number,
    offset: number = 0,
    client: BetaAnalyticsDataClient
  ): Promise<Omit<AnalyticsOverview, 'growth'>> {
    if (!client) {
      return {
        totalPageViews: 0,
        uniqueVisitors: 0,
        conversionRate: 0,
        totalLeads: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
      };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days - offset);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - offset);

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'conversions' }, // Generic conversions
      ],
    });

    const row = response.rows?.[0];
    if (!row?.metricValues) {
      return {
        totalPageViews: 0,
        uniqueVisitors: 0,
        conversionRate: 0,
        totalLeads: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
      };
    }

    const pageViews = parseInt(row.metricValues[0]?.value || '0');
    const users = parseInt(row.metricValues[1]?.value || '0');
    const bounceRate = parseFloat(row.metricValues[2]?.value || '0');
    const sessionDuration = parseFloat(row.metricValues[3]?.value || '0');
    const conversions = parseInt(row.metricValues[4]?.value || '0');

    return {
      totalPageViews: pageViews,
      uniqueVisitors: users,
      conversionRate: users > 0 ? (conversions / users) * 100 : 0,
      totalLeads: conversions,
      avgSessionDuration: sessionDuration,
      bounceRate: bounceRate,
    };
  }

  /**
   * Get traffic sources
   */
  async getTrafficSources(
    propertyId: string,
    days: number = 30,
    accessToken?: string
  ): Promise<TrafficSource[]> {
    const client = accessToken
      ? this.createOAuthClient(accessToken)
      : this.serviceAccountClient;

    if (!client) return [];

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          {
            startDate: startDate.toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
          },
        ],
        dimensions: [{ name: 'sessionSource' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 10,
      });

      const totalVisitors =
        response.rows?.reduce(
          (sum, row) => sum + parseInt(row.metricValues?.[0]?.value || '0'),
          0
        ) || 0;

      return (
        response.rows?.map((row) => {
          const visitors = parseInt(row.metricValues?.[0]?.value || '0');
          return {
            source: row.dimensionValues?.[0]?.value || 'unknown',
            visitors,
            percentage:
              totalVisitors > 0 ? (visitors / totalVisitors) * 100 : 0,
          };
        }) || []
      );
    } catch (error) {
      console.error('Failed to fetch traffic sources:', error);
      return [];
    }
  }

  /**
   * Get geographic data
   */
  async getGeographicData(
    propertyId: string,
    days: number = 30,
    accessToken?: string
  ): Promise<GeographicData[]> {
    const client = accessToken
      ? this.createOAuthClient(accessToken)
      : this.serviceAccountClient;

    if (!client) return [];

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          {
            startDate: startDate.toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
          },
        ],
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 10,
      });

      const totalVisitors =
        response.rows?.reduce(
          (sum, row) => sum + parseInt(row.metricValues?.[0]?.value || '0'),
          0
        ) || 0;

      return (
        response.rows?.map((row) => {
          const visitors = parseInt(row.metricValues?.[0]?.value || '0');
          return {
            country: row.dimensionValues?.[0]?.value || 'unknown',
            visitors,
            percentage:
              totalVisitors > 0 ? (visitors / totalVisitors) * 100 : 0,
          };
        }) || []
      );
    } catch (error) {
      console.error('Failed to fetch geographic data:', error);
      return [];
    }
  }

  /**
   * Get device data
   */
  async getDeviceData(
    propertyId: string,
    days: number = 30,
    accessToken?: string
  ): Promise<DeviceData[]> {
    const client = accessToken
      ? this.createOAuthClient(accessToken)
      : this.serviceAccountClient;

    if (!client) return [];

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          {
            startDate: startDate.toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
          },
        ],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      });

      const totalVisitors =
        response.rows?.reduce(
          (sum, row) => sum + parseInt(row.metricValues?.[0]?.value || '0'),
          0
        ) || 0;

      return (
        response.rows?.map((row) => {
          const visitors = parseInt(row.metricValues?.[0]?.value || '0');
          return {
            deviceType: row.dimensionValues?.[0]?.value || 'unknown',
            visitors,
            percentage:
              totalVisitors > 0 ? (visitors / totalVisitors) * 100 : 0,
          };
        }) || []
      );
    } catch (error) {
      console.error('Failed to fetch device data:', error);
      return [];
    }
  }

  /**
   * Get page performance
   */
  async getPagePerformance(
    propertyId: string,
    days: number = 30,
    accessToken?: string
  ): Promise<PagePerformance[]> {
    const client = accessToken
      ? this.createOAuthClient(accessToken)
      : this.serviceAccountClient;

    if (!client) return [];

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          {
            startDate: startDate.toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
          },
        ],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      });

      return (
        response.rows?.map((row) => ({
          path: row.dimensionValues?.[0]?.value || '/',
          pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
          avgTimeOnPage: parseFloat(row.metricValues?.[1]?.value || '0'),
          bounceRate: parseFloat(row.metricValues?.[2]?.value || '0'),
        })) || []
      );
    } catch (error) {
      console.error('Failed to fetch page performance:', error);
      return [];
    }
  }

  /**
   * Calculate growth percentage
   */
  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  /**
   * Get empty overview (fallback)
   */
  private getEmptyOverview(): AnalyticsOverview {
    return {
      totalPageViews: 0,
      uniqueVisitors: 0,
      conversionRate: 0,
      totalLeads: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
      growth: {
        pageViews: 0,
        visitors: 0,
        leads: 0,
      },
    };
  }
}

// Export singleton instance
export const googleAnalyticsDataService = new GoogleAnalyticsDataService();
