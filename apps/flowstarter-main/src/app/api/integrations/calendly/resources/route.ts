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
    .eq('integration_id', 'calendly')
    .single();

  const config = integration?.config as Record<string, string> | null;
  if (!config?.access_token_secret_id) {
    return NextResponse.json(
      { error: 'Calendly not connected' },
      { status: 400 }
    );
  }

  // Resolve access token from Vault
  let accessToken: string | null;
  try {
    accessToken = await readUserSecret(supabase, config.access_token_secret_id);
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve credentials' },
      { status: 500 }
    );
  }
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Calendly credentials not found' },
      { status: 400 }
    );
  }

  try {
    // Get current user profile
    const meRes = await fetch('https://api.calendly.com/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!meRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Calendly user' },
        { status: 502 }
      );
    }

    const { resource: user } = await meRes.json();

    // Get active event types for this user
    const etRes = await fetch(
      `https://api.calendly.com/event_types?user=${encodeURIComponent(
        user.uri
      )}&count=20&active=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!etRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch event types' },
        { status: 502 }
      );
    }

    const { collection: eventTypes } = await etRes.json();

    return NextResponse.json({
      users: [
        {
          id: user.uri,
          email: user.email,
          name: user.name,
        },
      ],
      eventTypes: (eventTypes || []).map(
        (et: {
          uri: string;
          name: string;
          scheduling_url: string;
          duration: number;
          active: boolean;
        }) => ({
          id: et.uri,
          name: et.name,
          url: et.scheduling_url,
          duration: et.duration,
          active: et.active,
        })
      ),
    });
  } catch (err) {
    console.error('Calendly resources error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch Calendly resources' },
      { status: 500 }
    );
  }
}
