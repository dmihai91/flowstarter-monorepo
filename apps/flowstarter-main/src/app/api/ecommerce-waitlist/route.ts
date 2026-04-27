import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

const bodySchema = z.object({
  email: z.string().email().max(254),
  source: z.string().max(64).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const db = createSupabaseServiceRoleClient();
  const email = parsed.data.email.trim().toLowerCase();
  const source = parsed.data.source?.trim() || 'landing-pricing';
  const notes = parsed.data.notes?.trim() || null;

  // The `ecommerce_waitlist` table isn't in the generated Supabase types yet;
  // cast through `unknown` so the typed client doesn't reject the relation.
  const { error } = await (
    db as unknown as {
      from: (table: string) => {
        insert: (values: Record<string, unknown>) => {
          select: (cols: string) => {
            single: () => Promise<{ error: { code?: string } | null }>;
          };
        };
      };
    }
  )
    .from('ecommerce_waitlist')
    .insert({ email, source, notes })
    .select('id')
    .single();

  if (error && error.code !== '23505') {
    console.error('[ecommerce-waitlist] insert error:', error);
    return NextResponse.json(
      { error: 'Could not save your email. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
