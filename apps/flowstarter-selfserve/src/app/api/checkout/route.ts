// POST /api/checkout — create a Stripe Checkout session.
// body: { projectId, kind: 'build_fee' | 'final_code' | 'final_subscription', waiverAccepted? }
// Stage 1 (build_fee) legally requires the EU withdrawal-right waiver checkbox.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireIdentity } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { createBuildFeeCheckout, createFinalCheckout } from '@/lib/stripe';
import { PRICING } from '@/lib/config';
import { slotsLeftThisMonth } from '@/lib/slots';

const Body = z.object({
  projectId: z.string().uuid(),
  kind: z.enum(['build_fee', 'final_code', 'final_subscription']),
  waiverAccepted: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const { userId, email } = await requireIdentity();
    const body = Body.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    const { projectId, kind } = body.data;

    const store = getStore();
    const project = await store.getProject(projectId);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (project.clerk_user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const origin = new URL(req.url).origin;
    const payments = await store.listPaymentsForProject(projectId);

    if (kind === 'build_fee') {
      if (!body.data.waiverAccepted) {
        return NextResponse.json(
          { error: 'Please confirm the withdrawal-right waiver to start the build immediately.' },
          { status: 400 },
        );
      }
      if (payments.some((p) => p.kind === 'build_fee' && p.status === 'paid')) {
        return NextResponse.json({ error: 'Build fee already paid.' }, { status: 409 });
      }
      // The slot counter shown on the landing page is real — enforce it.
      if ((await slotsLeftThisMonth()) <= 0) {
        return NextResponse.json(
          { error: 'This month’s build slots are full. Your draft and free prompts stay — builds reopen on the 1st.' },
          { status: 409 },
        );
      }
      const waiverAcceptedAt = new Date().toISOString();
      const { url, sessionId } = await createBuildFeeCheckout({
        projectId,
        email,
        origin,
        waiverAcceptedAt,
      });
      await store.createPayment({
        projectId,
        kind,
        amountCents: PRICING.buildFeeCents,
        currency: PRICING.currency,
        sessionId,
        waiverAcceptedAt,
      });
      return NextResponse.json({ url });
    }

    // Stage 2 requires a completed build.
    const build = await store.latestBuildForProject(projectId);
    if (build?.status !== 'completed') {
      return NextResponse.json({ error: 'Your build is not finished yet.' }, { status: 409 });
    }
    if (payments.some((p) => (p.kind === 'final_code' || p.kind === 'final_subscription') && p.status === 'paid')) {
      return NextResponse.json({ error: 'Delivery already paid.' }, { status: 409 });
    }
    const { url, sessionId } = await createFinalCheckout({ projectId, email, origin, kind });
    await store.createPayment({
      projectId,
      kind,
      amountCents: PRICING.finalFeeCents,
      currency: PRICING.currency,
      sessionId,
    });
    return NextResponse.json({ url });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
