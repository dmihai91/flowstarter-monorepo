import { moderateBusinessInfo } from '@/lib/ai/project-details';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { businessInfo } = await request.json();
    if (!businessInfo) {
      return NextResponse.json(
        { error: 'Missing businessInfo' },
        { status: 400 }
      );
    }

    const result = await moderateBusinessInfo(businessInfo);
    if (result.isProhibited) {
      return NextResponse.json(
        {
          error: 'Content Policy Violation',
          message:
            'We cannot process your request as it appears to involve prohibited activities or content.',
          details: result.reasons || [],
          code: 'CONTENT_REJECTED',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, riskLevel: result.riskLevel });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
