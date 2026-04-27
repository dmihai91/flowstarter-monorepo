export const dynamic = 'force-static';
export const revalidate = 60;
import { FlowBackgroundLayer } from '@/components/ui/flow-background-layer';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen max-w-full">
      <FlowBackgroundLayer variant="landing" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
