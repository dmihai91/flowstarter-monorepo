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
    .eq('integration_id', 'mailchimp')
    .single();

  const config = integration?.config as {
    access_token_secret_id?: string;
    dc?: string;
    api_endpoint?: string;
  } | null;

  if (!config?.access_token_secret_id) {
    return NextResponse.json(
      { error: 'Mailchimp not connected' },
      { status: 400 }
    );
  }

  // Resolve access token from Vault
  let access_token: string | null;
  try {
    access_token = await readUserSecret(
      supabase,
      config.access_token_secret_id
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve credentials' },
      { status: 500 }
    );
  }
  if (!access_token) {
    return NextResponse.json(
      { error: 'Mailchimp credentials not found' },
      { status: 400 }
    );
  }

  const { dc = 'us1', api_endpoint } = config;

  const endpoint = api_endpoint || `https://${dc}.api.mailchimp.com/3.0`;

  try {
    const [accountRes, listsRes] = await Promise.all([
      fetch(`${endpoint}/`, {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
      fetch(
        `${endpoint}/lists?count=100&fields=lists.id,lists.name,lists.stats.member_count`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      ),
    ]);

    if (!accountRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Mailchimp account' },
        { status: 502 }
      );
    }

    const account = await accountRes.json();
    const listsData = listsRes.ok ? await listsRes.json() : { lists: [] };

    return NextResponse.json({
      account: {
        id: account.account_id,
        email: account.email,
        name: account.account_name || account.account_id,
      },
      audiences: (listsData.lists || []).map(
        (list: {
          id: string;
          name: string;
          stats?: { member_count?: number };
        }) => ({
          id: list.id,
          name: list.name,
          memberCount: list.stats?.member_count ?? 0,
        })
      ),
    });
  } catch (err) {
    console.error('Mailchimp resources error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch Mailchimp resources' },
      { status: 500 }
    );
  }
}
