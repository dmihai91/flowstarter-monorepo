// Post-delivery-payment page. Launch path: subscribe to the €39/mo hosting
// plan via Clerk Billing (Stripe handled the one-time €149), then the site is
// live. Code-only path: instant export download.
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getStore } from '@/lib/store';
import { CLERK_HOSTING_PLAN, pricingCopy } from '@/lib/config';
import { DoneScreen } from '@/components/screens/done';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, has } = await auth();
  if (!userId) redirect('/sign-in');

  const store = getStore();
  const project = await store.getProject(id);
  if (!project || project.clerk_user_id !== userId) redirect('/');
  const build = await store.latestBuildForProject(id);
  const payments = await store.listPaymentsForProject(id);

  const deliveryPaid = payments.some(
    (p) => (p.kind === 'final_code' || p.kind === 'final_subscription') && p.status === 'paid',
  );
  if (!deliveryPaid) redirect(`/p/${id}/preview`);

  const hasHosting = has({ plan: CLERK_HOSTING_PLAN });

  return (
    <DoneScreen
      projectId={id}
      outcome={project.outcome === 'launch' ? 'launch' : 'code_only'}
      brandName={build?.outputs?.spec.brand.name ?? project.demo_spec?.brand.name ?? 'Your site'}
      buildId={build?.id ?? null}
      previewUrl={build?.outputs?.previewUrl ?? null}
      subscribed={hasHosting}
      pricing={pricingCopy()}
    />
  );
}
