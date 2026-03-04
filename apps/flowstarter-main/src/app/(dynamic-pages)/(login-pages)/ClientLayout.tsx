'use client';

import { type ReactNode } from 'react';
import { FlowBackground } from '@flowstarter/flow-design-system';

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative grid w-full h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_0%_0%,#ede6ff_0%,transparent_80%),radial-gradient(circle_at_100%_100%,#fde9f0_0%,transparent_80%),linear-gradient(to_bottom,#fbf9ff,#fdfcff)] dark:bg-[radial-gradient(circle_at_0%_0%,#1a0d2e_0%,transparent_80%),radial-gradient(circle_at_100%_100%,#200a1a_0%,transparent_80%),linear-gradient(to_bottom,#0a0810,#0a0a0c)]">
      <FlowBackground variant="dashboard" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
      <div className="relative z-10 flex flex-col items-stretch justify-center h-[100dvh] min-w-full overflow-hidden">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
