'use client';

import MaxWidthContainer from '@/components/MaxWidthContainer';
import {
  FlowBackground,
  type FlowBackgroundVariant,
} from '@flowstarter/flow-design-system';
import { cn } from '@/lib/utils';
import React from 'react';

interface PageContainerProps extends React.PropsWithChildren {
  gradientVariant?: FlowBackgroundVariant | 'integrations' | 'help' | 'default';
  className?: string;
  contentClassName?: string;
}

// Map legacy variant names to FlowBackground variants
const variantMap: Record<string, FlowBackgroundVariant> = {
  dashboard: 'dashboard',
  integrations: 'dashboard',
  help: 'dashboard',
  wizard: 'wizard',
  landing: 'landing',
  default: 'dashboard',
};

export function PageContainer({
  children,
  gradientVariant = 'landing',
  className,
  contentClassName,
}: PageContainerProps) {
  const flowVariant = variantMap[gradientVariant] ?? 'dashboard';

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
      `}</style>
      <div
        className={cn(
          'min-h-screen relative font-[Outfit,system-ui,sans-serif]',
          className
        )}
      >
        {/* Flow background with animated lines */}
        <FlowBackground variant={flowVariant} style={{ position: "fixed", inset: 0, zIndex: 0 }} />
        <MaxWidthContainer
          className={cn('p-4 sm:p-6 lg:p-8 pt-6', contentClassName)}
        >
          {children}
        </MaxWidthContainer>
      </div>
    </>
  );
}
