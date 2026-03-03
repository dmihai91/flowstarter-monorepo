'use client';

import { type ReactNode } from 'react';
import { FlowBackground } from '@flowstarter/flow-design-system';

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative grid w-full h-full page-gradient">
      <FlowBackground variant="dashboard" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
      <div className="relative z-10 flex flex-col items-stretch justify-center min-h-screen min-w-full">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
