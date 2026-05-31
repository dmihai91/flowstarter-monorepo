/**
 * Per-workspace company billing details for the customer billing page.
 *
 *   GET  /api/account/billing-profile  → the signed-in user's workspace profile
 *   PUT  /api/account/billing-profile  → upsert it (+ best-effort Stripe sync)
 *
 * Persists to `workspace_billing_profiles` (RLS-on, service-role only). The
 * user is scoped to their own workspace via `workspace_memberships`. When the
 * workspace already has a Stripe customer, company name / address / tax id are
 * mirrored onto it so company-name invoicing is reflected on Stripe too
 * (best-effort — never blocks the save). Same-origin only (CSRF) + Clerk auth.
 *
 * Uses an untyped Supabase client on purpose: `workspace_billing_profiles` is
 * not in the generated `database.types.ts` (matches the custom_inquiries
 * pattern), so typed `.from()` would not compile.
 */
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { z } from 'zod';
import { STRIPE_API_VERSION } from '@/lib/billing/stripe';

export const runtime = 'nodejs';

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function resolveWorkspace(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ id: string; stripe_customer_id: string | null } | null> {
  const { data: membership } = await supabase
    .from('workspace_memberships')
    .select('workspace_id')
    .eq('clerk_user_id', userId)
    .limit(1)
    .maybeSingle();
  const workspaceId = membership?.workspace_id as string | undefined;
  if (!workspaceId) return null;
  const { data: ws } = await supabase
    .from('workspaces')
    .select('id, stripe_customer_id')
    .eq('id', workspaceId)
    .maybeSingle();
  return ws ? { id: ws.id as string, stripe_customer_id: ws.stripe_customer_id ?? null } : null;
}

const ProfileSchema = z.object({
  bill_to_company: z.boolean().optional(),
  company_name: z.string().trim().max(200).optional().nullable(),
  vat_id: z.string().trim().max(64).optional().nullable(),
  registration_no: z.string().trim().max(64).optional().nullable(),
  billing_address: z.string().trim().max(500).optional().nullable(),
  country: z.string().trim().max(2).optional().nullable(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const supabase = serviceClient();
  if (!supabase) return NextResponse.json({ error: 'config' }, { status: 503 });
  const ws = await resolveWorkspace(supabase, userId);
  if (!ws) return NextResponse.json({ error: 'no-workspace' }, { status: 404 });
  const { data } = await supabase
    .from('workspace_billing_profiles')
    .select('*')
    .eq('workspace_id', ws.id)
    .maybeSingle();
  return NextResponse.json({ profile: data ?? null });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const supabase = serviceClient();
  if (!supabase) return NextResponse.json({ error: 'config' }, { status: 503 });
  const ws = await resolveWorkspace(supabase, userId);
  if (!ws) return NextResponse.json({ error: 'no-workspace' }, { status: 404 });

  let input: z.infer<typeof ProfileSchema>;
  try {
    input = ProfileSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const country = input.country ? input.country.toUpperCase() : null;
  const row = {
    workspace_id: ws.id,
    bill_to_company: input.bill_to_company ?? false,
    company_name: input.company_name || null,
    vat_id: input.vat_id || null,
    registration_no: input.registration_no || null,
    billing_address: input.billing_address || null,
    country,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('workspace_billing_profiles')
    .upsert(row, { onConflict: 'workspace_id' })
    .select('*')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'save-failed' }, { status: 500 });

  // Best-effort: mirror company billing identity onto the Stripe customer when
  // one exists. Never blocks the save.
  let stripeSynced = false;
  if (process.env.STRIPE_SECRET_KEY && ws.stripe_customer_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION });
      await stripe.customers.update(ws.stripe_customer_id, {
        ...(row.company_name ? { name: row.company_name } : {}),
        ...(row.billing_address
          ? { address: { line1: row.billing_address, ...(country ? { country } : {}) } }
          : {}),
        metadata: {
          vat_id: row.vat_id ?? '',
          registration_no: row.registration_no ?? '',
          bill_to_company: String(row.bill_to_company),
        },
      });
      stripeSynced = true;
    } catch {
      // leave stripeSynced false; the local save already succeeded
    }
  }

  return NextResponse.json({ profile: data, stripeSynced });
}
