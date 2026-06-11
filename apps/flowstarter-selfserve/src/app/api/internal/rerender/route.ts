// TEMPORARY dev-only helper: re-render a saved draft's FILL through the
// current template. Used to refresh the showcase HTML after template changes.
import { NextResponse } from 'next/server';
import { parseFillFromHtml, renderTemplate } from '@/lib/site-template';

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  const { html } = (await req.json()) as { html: string };
  const fill = parseFillFromHtml(html);
  if (!fill) return NextResponse.json({ error: 'No FILL comment found' }, { status: 400 });
  return NextResponse.json({ html: renderTemplate(fill) });
}
