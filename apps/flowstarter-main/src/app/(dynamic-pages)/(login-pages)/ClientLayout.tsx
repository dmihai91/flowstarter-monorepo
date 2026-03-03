'use client';

import { type ReactNode } from 'react';
import { FlowBackground } from '@flowstarter/flow-design-system';

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative grid w-full h-full bg-gradient-to-br from-[#f7f3ff] via-[#f0e8ff] via-60% to-[#fdf2f8] dark:from-[#110b1e] dark:via-[#160e28] dark:to-[#1a0c1e]">
      <FlowBackground variant="landing" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
      <div className="relative z-10 flex flex-col items-stretch justify-center min-h-screen min-w-full">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
