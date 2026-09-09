import { BuildScreen } from '@/components/screens/build';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BuildScreen projectId={id} />;
}
