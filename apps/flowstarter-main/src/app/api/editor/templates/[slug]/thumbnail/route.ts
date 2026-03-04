import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

const TEMPLATES_DIR = path.resolve(
  process.cwd(),
  '../../flowstarter-library/templates'
);

/**
 * GET /api/editor/templates/[slug]/thumbnail - Serve template thumbnail
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Sanitize slug to prevent directory traversal
  if (slug.includes('..') || slug.includes('/')) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const thumbnailPath = path.join(TEMPLATES_DIR, slug, 'thumbnail.png');

  try {
    const data = await fs.readFile(thumbnailPath);
    return new NextResponse(data as unknown as BodyInit, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, immutable',
      },
    });
  } catch {
    // Return a 404 if thumbnail is missing
    return NextResponse.json(
      { error: 'Thumbnail not found' },
      { status: 404 }
    );
  }
}
