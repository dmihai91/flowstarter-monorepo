import { getRepoTemplates } from '@/lib/local-template-service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const repo = await getRepoTemplates();
    return NextResponse.json({ templates: repo });
  } catch (e) {
    return NextResponse.json({ templates: [] }, { status: 200 });
  }
}
