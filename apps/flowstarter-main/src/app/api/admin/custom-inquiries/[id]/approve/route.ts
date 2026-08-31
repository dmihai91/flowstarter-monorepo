/**
 * POST /api/admin/custom-inquiries/[id]/approve
 *
 * Admin action. Updates status to "approved", stores the booking link, sends
 * the approval email to the prospect. Idempotency: only fires when the
 * inquiry is currently pending_review (avoids double emails on accidental
 * double-clicks).
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

const ApproveSchema = z.object({
  booking_link: z.string().url().max(500),
  message: z.string().min(20).max(8000),
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function messageToHtml(message: string, bookingLink: string): string {
  const safe = escapeHtml(message)
    .replace(/\n/g, '<br />')
    .replace(
      new RegExp(escapeHtml(bookingLink), 'g'),
      `<a href="${escapeHtml(bookingLink)}" style="color:#4f46e5;">${escapeHtml(
        bookingLink
      )}</a>`
    );
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#111827;line-height:1.55;font-size:15px;">
  ${safe}
  <p style="margin:24px 0 0;">
    <a href="${escapeHtml(
      bookingLink
    )}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">
      Book your consultation
    </a>
  </p>
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
    const parsed = ApproveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid' },
        { status: 400 }
      );
    }
    const { booking_link, message } = parsed.data;

    const supabase = adminStore();
    if (!supabase) {
      return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    const { data: inquiry, error: fetchErr } = await supabase
      .from('custom_inquiries')
      .select('id, name, email, company_name, status')
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
          }, refresh the page.`,
        },
        { status: 409 }
      );
    }

    const { error: updateErr } = await supabase
      .from('custom_inquiries')
      .update({
        status: 'approved',
        booking_link,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Best-effort email.
    try {
      await sendEmail({
        to: (inquiry as { email: string }).email,
        subject:
          'Your Custom Solution consultation: book time with Flowstarter',
        html: messageToHtml(message, booking_link),
      });
    } catch (err) {
      console.error('[approve] email failed', err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[approve] error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
