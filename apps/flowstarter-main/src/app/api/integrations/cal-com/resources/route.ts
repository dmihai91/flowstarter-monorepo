import { requireAuth } from '@/lib/api-auth';
import { useServerSupabaseWithAuth } from '@/hooks/useServerSupabase';
import { readUserSecret } from '@/lib/user-integration-vault';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (!authResult.authenticated) return authResult.response;
  const { userId } = authResult;

  const supabase = await useServerSupabaseWithAuth();
  const { data: integration } = await supabase
    .from('user_integrations')
    .select('config')
    .eq('user_id', userId)
    .eq('integration_id', 'cal-com')
    .single();

  const config = integration?.config as Record<string, string> | null;
  if (!config?.api_key_secret_id) {
    return NextResponse.json(
      { error: 'Cal.com not connected' },
      { status: 400 }
    );
  }

  // Resolve API key from Vault
  let apiKey: string | null;
  try {
    apiKey = await readUserSecret(supabase, config.api_key_secret_id);
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve credentials' },
      { status: 500 }
    );
  }
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Cal.com credentials not found' },
      { status: 400 }
    );
  }

  try {
    const [meRes, eventTypesRes] = await Promise.all([
      fetch(`https://api.cal.com/v1/me?apiKey=${encodeURIComponent(apiKey)}`),
      fetch(
        `https://api.cal.com/v1/event-types?apiKey=${encodeURIComponent(
          apiKey
        )}`
      ),
    ]);

    if (!meRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Cal.com user' },
        { status: 502 }
      );
    }

    const { user } = await meRes.json();
    const eventTypesData = eventTypesRes.ok
      ? await eventTypesRes.json()
      : { event_types: [] };

    return NextResponse.json({
      users: [
        {
          id: user.id,
          email: user.email,
          name: user.name || user.username,
          username: user.username,
        },
      ],
      eventTypes: (eventTypesData.event_types || []).map(
        (et: {
          id: number;
          title: string;
          slug: string;
          length: number;
          hidden: boolean;
          schedulingType: string | null;
        }) => ({
          id: String(et.id),
          name: et.title,
          slug: et.slug,
          url: `https://cal.com/${user.username}/${et.slug}`,
          duration: et.length,
          hidden: et.hidden,
        })
      ),
    });
  } catch (err) {
    console.error('Cal.com resources error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch Cal.com resources' },
      { status: 500 }
    );
  }
}
