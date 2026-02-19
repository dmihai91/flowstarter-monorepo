import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getValidGoogleCredentials } from '@/lib/google-oauth-helper';
import { fetchAllGA4Properties } from '@/lib/google-analytics-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/google-analytics/properties
 * Fetch all GA4 properties the authenticated user has access to
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get valid OAuth access token for the user
    const accessToken = await getValidGoogleCredentials(userId);

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'Google Analytics not connected',
          message:
            'Please connect your Google Analytics account in the integrations page',
        },
        { status: 403 }
      );
    }

    // Fetch all GA4 properties
    const properties = await fetchAllGA4Properties(accessToken);

    return NextResponse.json({
      properties,
      total: properties.length,
    });
  } catch (error) {
    console.error('Error fetching GA4 properties:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch properties',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
