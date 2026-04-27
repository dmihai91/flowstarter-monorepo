import { ClientLayout } from '../ClientLayout';
import { FlowBackgroundLayer } from '@/components/ui/flow-background-layer';

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientLayout>
      <div className="relative min-h-screen">
        <FlowBackgroundLayer variant="auth" />
        <div className="relative z-10">{children}</div>
      </div>
    </ClientLayout>
  );
}
