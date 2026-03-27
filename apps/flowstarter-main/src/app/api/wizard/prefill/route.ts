import { NextRequest, NextResponse } from 'next/server';

function deprecatedResponse() {
  return NextResponse.json(
    {
      error:
        'The wizard prefill flow has been retired. Use /api/projects/draft and continue in /team/dashboard/new.',
    },
    { status: 410 },
  );
}

export async function GET(_request: NextRequest) {
  return deprecatedResponse();
}

export async function POST(_request: NextRequest) {
  return deprecatedResponse();
}

export async function PATCH(_request: NextRequest) {
  return deprecatedResponse();
}
