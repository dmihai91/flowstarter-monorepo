// POST /api/admin/builds/[id]/refund — manual €50 refund button (team only).
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { refundPaymentIntent } from '@/lib/stripe';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await ctx.params;
  const store = getStore();
  const build = await store.getBuild(id);
  if (!build) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const payments = await store.listPaymentsForProject(build.project_id);
  const fee = payments.find((p) => p.kind === 'build_fee' && p.status === 'paid');
  if (!fee) return NextResponse.json({ error: 'No paid build fee to refund' }, { status: 409 });
  if (!fee.stripe_payment_intent_id) {
    return NextResponse.json({ error: 'Payment has no payment intent on record' }, { status: 409 });
  }
  await refundPaymentIntent(fee.stripe_payment_intent_id);
  await store.updatePayment(fee.id, { status: 'refunded' });
  return NextResponse.json({ ok: true });
}
