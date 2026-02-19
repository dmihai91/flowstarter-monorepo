import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const tokenCookie = (await cookies()).get('ga_token')?.value;
  if (!tokenCookie) {
    return NextResponse.json({ accounts: [] });
  }
  const token = JSON.parse(tokenCookie) as {
    access_token: string;
    expires_at?: number;
    refresh_token?: string;
  };

  async function authorized(url: string, init?: RequestInit) {
    return fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    });
  }

  // Fetch accounts
  const accountsRes = await authorized(
    'https://analyticsadmin.googleapis.com/v1beta/accounts'
  );
  if (!accountsRes.ok) {
    return NextResponse.json({ accounts: [] });
  }
  const accountsJson = await accountsRes.json();
  const accountItems: Array<{ name: string; displayName: string }> =
    accountsJson.accounts || [];

  const result: Array<{
    account: { id: string; name: string };
    property: { id: string; name: string };
    streams: Array<{ id: string; name: string; measurementId?: string }>;
  }> = [];

  for (const acc of accountItems) {
    const accountId = acc.name.split('/').pop() as string;
    const propsRes = await authorized(
      `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/${accountId}`
    );
    if (!propsRes.ok) continue;
    const propsJson = await propsRes.json();
    const properties: Array<{ name: string; displayName: string }> =
      propsJson.properties || [];

    for (const p of properties) {
      const propertyId = p.name.split('/').pop() as string;
      const streamsRes = await authorized(
        `https://analyticsadmin.googleapis.com/v1beta/properties/${propertyId}/dataStreams`
      );
      const streamsJson = streamsRes.ok
        ? await streamsRes.json()
        : { dataStreams: [] };
      const streams: Array<{
        name?: string;
        displayName?: string;
        webStreamData?: { measurementId?: string; defaultUri?: string };
      }> = streamsJson.dataStreams || [];
      const simplified = streams.map((s) => {
        const id = s.name?.split('/').pop() || 'unknown';
        const mId = s.webStreamData?.measurementId;
        return {
          id,
          name: s.displayName || s.webStreamData?.defaultUri || 'Web Stream',
          measurementId: mId,
        };
      });
      result.push({
        account: { id: accountId, name: acc.displayName },
        property: { id: propertyId, name: p.displayName },
        streams: simplified,
      });
    }
  }

  return NextResponse.json({ accounts: result });
}
