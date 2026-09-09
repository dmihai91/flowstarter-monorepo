// Public draft permalink (from the "email me my draft" capture). Shows the
// saved page full-width with a sticky continue bar back into the funnel.
import { notFound } from 'next/navigation';
import { getStore } from '@/lib/store';
import { DraftView } from '@/components/screens/draft-view';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getStore().getLead(id);
  if (!lead) notFound();
  return (
    <DraftView
      description={lead.business_description}
      spec={lead.demo_spec}
      html={lead.demo_html}
      brandName={lead.demo_spec?.brand.name ?? 'Your draft'}
    />
  );
}
