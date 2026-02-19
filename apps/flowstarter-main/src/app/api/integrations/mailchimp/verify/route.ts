'use server';

import { NextResponse } from 'next/server';

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const { apiKey, audienceId } = (await req.json()) as {
      apiKey?: string;
      audienceId?: string;
    };

    const key = (apiKey || '').trim();
    if (!key) return bad('Missing API key');

    // Mailchimp keys are like 'xxxx-us21' → datacenter suffix after '-'
    const parts = key.split('-');
    if (parts.length < 2) return bad('Invalid Mailchimp API key format');
    const dc = parts[parts.length - 1];
    const base = `https://${dc}.api.mailchimp.com/3.0`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    // Validate key by hitting root
    const rootRes = await fetch(`${base}/`, {
      headers: { Authorization: `apikey ${key}` },
      signal: controller.signal,
      cache: 'no-store',
    }).catch((e) => {
      if ((e as Error).name === 'AbortError')
        return bad('Mailchimp request timed out', 504);
      return null;
    });

    if (!rootRes || !('ok' in rootRes))
      return bad('Network error to Mailchimp', 502);
    if (rootRes.status === 401)
      return bad('Mailchimp API key unauthorized', 401);
    if (!rootRes.ok) return bad('Mailchimp API error', 502);

    // Optionally validate audience/list
    if (audienceId) {
      const listRes = await fetch(
        `${base}/lists/${encodeURIComponent(audienceId)}`,
        {
          headers: { Authorization: `apikey ${key}` },
          signal: controller.signal,
          cache: 'no-store',
        }
      );
      clearTimeout(timeout);
      if (listRes.status === 404) return bad('Audience/List not found', 404);
      if (!listRes.ok) return bad('Failed to validate audience', 502);
    } else {
      clearTimeout(timeout);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return bad(msg, 500);
  }
}
