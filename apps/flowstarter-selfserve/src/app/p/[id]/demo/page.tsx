import { pricingCopy, DEMO, CAPACITY } from '@/lib/config';
import { slotsLeftThisMonth } from '@/lib/slots';
import { DemoScreen } from '@/components/screens/demo';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slotsLeft = await slotsLeftThisMonth();
  return (
    <DemoScreen
      projectId={id}
      pricing={pricingCopy()}
      maxRefinements={DEMO.maxRefinements}
      slots={{ left: slotsLeft, cap: CAPACITY.buildsPerMonth }}
    />
  );
}
