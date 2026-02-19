import { projectTemplates } from '@/data/project-templates';
import { NextResponse } from 'next/server';

export async function GET() {
  const ids = projectTemplates.map((t) => t.id);
  return NextResponse.json({ ids });
}
