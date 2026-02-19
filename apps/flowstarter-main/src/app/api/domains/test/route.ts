import { NextRequest, NextResponse } from 'next/server';
import GoDaddyService from '@/lib/godaddy-service';

interface TestResult {
  test: string;
  success: boolean;
  domain?: string;
  error?: string;
  result?: unknown;
}

interface TestResultsResponse {
  configured: boolean;
  environment: string;
  hasApiAccess?: boolean;
  tests: TestResult[];
  summary: {
    message: string;
    apiStatus: string;
  };
}

export async function GET() {
  try {
    // Check if GoDaddy API is configured
    if (!GoDaddyService.isConfigured()) {
      return NextResponse.json(
        {
          error: 'GoDaddy API not configured',
          message:
            'Please set GODADDY_API_KEY and GODADDY_API_SECRET environment variables',
          configured: false,
          note: 'The service will work in fallback mode without API access',
        },
        { status: 400 }
      );
    }

    const testResults: TestResultsResponse = {
      configured: true,
      environment:
        process.env.GODADDY_USE_PRODUCTION === 'true'
          ? 'Production'
          : 'Test (OTE)',
      tests: [],
      summary: {
        message: 'Running tests...',
        apiStatus: 'testing',
      },
    };

    // Test 1: Check a definitely available domain
    try {
      const uniqueDomain = `test-domain-${Date.now()}.com`;
      const availabilityResult = await GoDaddyService.checkDomainAvailability(
        uniqueDomain
      );

      testResults.tests.push({
        test: 'Domain Availability Check',
        success: true,
        domain: uniqueDomain,
        result: {
          available: availabilityResult.available,
          note: 'This should typically be available',
        },
      });
      testResults.hasApiAccess = true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      testResults.tests.push({
        test: 'Domain Availability Check',
        success: false,
        error: errorMessage,
        result: null,
      });

      if (errorMessage.includes('50+ domains')) {
        testResults.hasApiAccess = false;
      }
    }

    // Test 2: Check domain suggestions
    try {
      const suggestions = await GoDaddyService.getDomainSuggestions('test', 5);

      testResults.tests.push({
        test: 'Domain Suggestions',
        success: true,
        result: {
          count: suggestions.length,
          examples: suggestions.slice(0, 3).map((s) => s.domain),
        },
      });
    } catch (error: unknown) {
      testResults.tests.push({
        test: 'Domain Suggestions',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 3: Generate purchase URL
    try {
      const purchaseUrl = GoDaddyService.getGoDaddyPurchaseUrl('example.com');

      testResults.tests.push({
        test: 'Purchase URL Generation',
        success: true,
        result: {
          url: purchaseUrl,
          note: 'Users will be directed here for pricing and purchase',
        },
      });
    } catch (error: unknown) {
      testResults.tests.push({
        test: 'Purchase URL Generation',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Set summary
    const allTestsPassed = testResults.tests.every((test) => test.success);

    if (testResults.hasApiAccess === false) {
      testResults.summary = {
        message:
          'GoDaddy API is configured but access is restricted (requires 50+ domains). Service will work in fallback mode.',
        apiStatus: 'restricted',
      };
    } else if (allTestsPassed) {
      testResults.summary = {
        message:
          'All tests passed! GoDaddy API integration is working correctly.',
        apiStatus: 'working',
      };
    } else {
      testResults.summary = {
        message:
          'Some tests failed. Check the individual test results for details.',
        apiStatus: 'partial',
      };
    }

    return NextResponse.json(testResults);
  } catch (error) {
    console.error('Domain test API error:', error);
    return NextResponse.json(
      { error: 'Failed to run domain tests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json(
        {
          error: 'Domain parameter required',
          example: '{"domain": "example.com"}',
        },
        { status: 400 }
      );
    }

    if (!GoDaddyService.isConfigured()) {
      return NextResponse.json(
        {
          error: 'GoDaddy API not configured',
          note: 'Set GODADDY_API_KEY and GODADDY_API_SECRET environment variables',
        },
        { status: 400 }
      );
    }

    // Test the specific domain
    const result = await GoDaddyService.checkDomainAvailability(domain);
    const hasApiAccess = await GoDaddyService.testApiAccess();

    return NextResponse.json({
      domain,
      result,
      formattedPrice: result.price
        ? GoDaddyService.formatPrice(
            result.price,
            result.currency,
            result.period
          )
        : 'N/A',
      metadata: {
        hasApiAccess,
        pricingSource: 'Static (Current GoDaddy Retail)',
        availabilitySource: hasApiAccess ? 'API' : 'Optimistic',
        note: hasApiAccess
          ? 'API available for availability checks'
          : 'Using fallback mode - pricing is still accurate',
      },
    });
  } catch (error: unknown) {
    console.error('GoDaddy API domain test failed:', error);

    return NextResponse.json(
      {
        error: 'Domain test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        note: 'This may be due to API access restrictions (normal for <50 domains)',
      },
      { status: 500 }
    );
  }
}
