import { useServerSupabaseWithAuth } from '@/hooks/useServerSupabase';
import { storeUserSecret } from '@/lib/user-integration-vault';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await useServerSupabaseWithAuth();
    const body = await req.json().catch(() => ({}));
    const incoming = body.config || body.selection || body;

    // Extract the raw API key before vault storage
    const apiKey: string | undefined = incoming.api_key;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'api_key is required' },
        { status: 400 }
      );
    }

    // ── Store API key in Vault (encrypted at rest) ───────────────────────────
    let apiKeySecretId: string;
    try {
      apiKeySecretId = await storeUserSecret(
        supabase,
        userId,
        'cal-com',
        'api_key',
        apiKey
      );
    } catch (vaultErr) {
      console.error('[Cal.com Finalize] Vault store failed:', vaultErr);
      return NextResponse.json(
        { error: 'Failed to encrypt credentials' },
        { status: 500 }
      );
    }

    // ── Persist only non-sensitive config + vault UUID reference ─────────────
    const safeConfig: Record<string, unknown> = {
      // Vault UUID reference — plaintext key is never stored here
      api_key_secret_id: apiKeySecretId,
    };
    // Carry over any non-sensitive fields (event_url, selected event type, etc.)
    const { api_key: _omit, ...rest } = incoming;
    void _omit;
    Object.assign(safeConfig, rest);

    const { error } = await supabase.from('user_integrations').upsert(
      {
        user_id: userId,
        integration_id: 'cal-com',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: safeConfig as any,
      },
      { onConflict: 'user_id,integration_id' }
    );

    if (error) {
      console.error('[Cal.com Finalize] DB error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Cal.com Finalize] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
