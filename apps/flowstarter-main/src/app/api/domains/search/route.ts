import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { searchDomains, type NameComConfig } from '@flowstarter/editor-engine/publishing';

export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword')?.trim();

  if (!keyword) {
    return NextResponse.json(
      { error: 'keyword query parameter is required' },
      { status: 400 },
    );
  }

  const username = process.env.NAME_COM_USERNAME;
  const token = process.env.NAME_COM_TOKEN;

  if (!username || !token) {
    return NextResponse.json(
      { error: 'Domain search is not configured' },
      { status: 503 },
    );
  }

  const config: NameComConfig = {
    username,
    token,
    sandbox: process.env.NAME_COM_SANDBOX === 'true',
  };

  try {
    const domains = await searchDomains(keyword, config);
    return NextResponse.json({ domains });
  } catch (err) {
    console.error('[domains/search]', err);
    return NextResponse.json(
      { error: 'Failed to search domains' },
      { status: 500 },
    );
  }
}
