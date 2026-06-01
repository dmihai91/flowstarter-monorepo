/**
 * GET /api/admin/custom-inquiries
 *
 * Admin-only. Lists custom solution inquiries (newest first) with optional
 * filtering by status, budget range, and search by company/email. Service
 * role behind Clerk team auth.
 */
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { resolveUserRole } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ inquiries: [] });
    }
    const supabase = createClient(url, key, {
      auth: { persistSession: false },
    });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const budget = searchParams.get('budget');
    const search = searchParams.get('q')?.trim();
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('custom_inquiries')
      .select(
        'id, created_at, name, email, company_name, website, role, industry, ' +
          'project_types, project_type_other, budget_range, timeline, ' +
          'referral_source, status, reviewed_at, booking_link',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (budget) query = query.eq('budget_range', budget);
    if (search) {
      const pattern = `%${search}%`;
      query = query.or(
        `company_name.ilike.${pattern},email.ilike.${pattern},name.ilike.${pattern}`
      );
    }

    const { data, error, count } = await query;
    if (error) {
      console.error('[admin/custom-inquiries] db error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      inquiries: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (err) {
    console.error('[admin/custom-inquiries] error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
