/**
 * POST /api/admin/custom-inquiries/[id]/reject
 *
 * Admin action. Updates status to "rejected", stores the internal reason,
 * sends the rejection-redirect email pointing the prospect to the paid
 * Strategy Call. Idempotent on pending_review only.
 */
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveUserRole } from '@/lib/api-auth';
import { sendEmail } from '@/lib/email';

function adminStore() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const RejectSchema = z.object({
  message: z.string().min(20).max(8000),
  rejection_reason: z.string().max(500).optional().default(''),
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function messageToHtml(message: string): string {
  const safe = escapeHtml(message).replace(
    /(https?:\/\/[^\s<]+)/g,
    (m) => `<a href="${m}" style="color:#4f46e5;">${m}</a>`
  );
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#111827;line-height:1.55;font-size:15px;white-space:pre-wrap;">
  ${safe.replace(/\n/g, '<br />')}
</div>`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = await resolveUserRole(userId);
    if (role !== 'team' && role !== 'admin') {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = RejectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid' },
        { status: 400 }
      );
    }
    const { message, rejection_reason } = parsed.data;

    const supabase = adminStore();
    if (!supabase) {
      return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    const { data: inquiry, error: fetchErr } = await supabase
      .from('custom_inquiries')
      .select('id, name, email, status')
      .eq('id', id)
      .maybeSingle();
    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }
    if (!inquiry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if ((inquiry as { status: string }).status !== 'pending_review') {
      return NextResponse.json(
        {
          error: `Inquiry already ${
            (inquiry as { status: string }).status
          } — refresh the page.`,
        },
        { status: 409 }
      );
    }

    const { error: updateErr } = await supabase
      .from('custom_inquiries')
      .update({
        status: 'rejected',
        rejection_reason: rejection_reason || null,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    try {
      await sendEmail({
        to: (inquiry as { email: string }).email,
        subject: 'About your project at Flowstarter',
        html: messageToHtml(message),
      });
    } catch (err) {
      console.error('[reject] email failed', err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[reject] error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
