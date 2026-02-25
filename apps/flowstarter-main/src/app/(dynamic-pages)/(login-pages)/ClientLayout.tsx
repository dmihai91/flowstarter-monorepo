'use client';

import { type ReactNode } from 'react';

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid w-full h-full">
      <div className="flex flex-col items-stretch justify-center min-h-screen min-w-full">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
