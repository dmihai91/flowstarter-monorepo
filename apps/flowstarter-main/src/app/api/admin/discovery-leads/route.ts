/**
 * GET /api/admin/discovery-leads
 *
 * Team-only. Lists discovery-form leads (newest first) with their booking
 * deposit status. Mirrors the auth + service-role pattern of
 * /api/admin/projects. `discovery_leads` is not in the generated Database
 * types yet, so the service client is created untyped here.
 */
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { resolveUserRole } from '@/lib/api-auth';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await resolveUserRole(userId);
    if (role !== 'team' && role !== 'admin') {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ leads: [] });
    }

    const supabase = createClient(url, key, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from('discovery_leads')
      .select(
        'id, created_at, full_name, email, business_name, industry, ' +
          'description, selected_tier, subscription, source, ' +
          'deposit_status, deposit_amount_eur, deposit_paid_at, project_id'
      )
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) {
      console.error('[admin/discovery-leads] db error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leads: data ?? [] });
  } catch (err) {
    console.error('[admin/discovery-leads] error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
