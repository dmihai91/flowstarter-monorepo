import { pricingCopy, DEMO } from '@/lib/config';
import { DemoScreen } from '@/components/screens/demo';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DemoScreen projectId={id} pricing={pricingCopy()} maxRefinements={DEMO.maxRefinements} />;
}
