import { pricingCopy } from '@/lib/config';
import { PreviewScreen } from '@/components/screens/preview';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PreviewScreen projectId={id} pricing={pricingCopy()} />;
}
