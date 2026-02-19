import { PLATFORM_CONFIG } from '@/lib/const';
import { cn } from '@/lib/utils';
import React from 'react';

export function MaxWidthContainer({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn('relative z-10 mx-auto', className)}
      style={{ maxWidth: PLATFORM_CONFIG.PAGE_MAX_WIDTH }}
    >
      {children}
    </div>
  );
}

export default MaxWidthContainer;
