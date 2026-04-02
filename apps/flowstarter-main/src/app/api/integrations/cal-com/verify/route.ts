'use server';

import { NextResponse } from 'next/server';

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const { apiKey, eventUrl } = (await req.json()) as {
      apiKey?: string;
      eventUrl?: string;
    };

    const key = (apiKey || '').trim();
    if (!key) return bad('Missing API key');

    if (eventUrl) {
      const url = (eventUrl || '').trim();
      try {
        const u = new URL(url);
        if (!/cal\.com$/i.test(u.hostname))
          return bad('URL must be a cal.com link');
      } catch {
        return bad('Invalid Cal.com URL');
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    // Validate API key by fetching the current user profile
    const meRes = await fetch(
      `https://api.cal.com/v1/me?apiKey=${encodeURIComponent(key)}`,
      {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      }
    ).catch((e) => {
      if ((e as Error).name === 'AbortError')
        return bad('Cal.com request timed out', 504);
      return null;
    });

    clearTimeout(timeout);

    if (!meRes || !('ok' in meRes))
      return bad('Network error connecting to Cal.com', 502);
    if (meRes.status === 401) return bad('Cal.com API key unauthorized', 401);
    if (!meRes.ok) return bad('Cal.com API error', 502);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return bad(msg, 500);
  }
}
