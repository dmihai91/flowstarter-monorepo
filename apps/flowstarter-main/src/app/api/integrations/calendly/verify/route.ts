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

    const url = (eventUrl || '').trim();
    try {
      const u = new URL(url);
      if (!/calendly\.com$/i.test(u.hostname))
        return bad('Calendly URL must be calendly.com');
    } catch {
      return bad('Invalid Calendly URL');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    // Validate token by fetching current user
    const meRes = await fetch('https://api.calendly.com/users/me', {
      headers: { Authorization: `Bearer ${key}` },
      signal: controller.signal,
      cache: 'no-store',
    }).catch((e) => {
      if ((e as Error).name === 'AbortError')
        return bad('Calendly request timed out', 504);
      return null;
    });

    if (!meRes || !('ok' in meRes))
      return bad('Network error to Calendly', 502);
    if (meRes.status === 401) return bad('Calendly API key unauthorized', 401);
    if (!meRes.ok) return bad('Calendly API error', 502);

    clearTimeout(timeout);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return bad(msg, 500);
  }
}
