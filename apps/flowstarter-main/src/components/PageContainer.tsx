'use client';

import MaxWidthContainer from '@/components/MaxWidthContainer';
import {
  GradientBackground,
  type GradientVariant,
} from '@/components/ui/gradient-background';
import { cn } from '@/lib/utils';
import React from 'react';

interface PageContainerProps extends React.PropsWithChildren {
  /**
   * Gradient variant to use for the background
   * 'dashboard' | 'integrations' | 'help' | 'wizard'
   */
  gradientVariant?: GradientVariant;
  /**
   * Custom className for the outer container
   */
  className?: string;
  /**
   * Custom className for the content container (MaxWidthContainer)
   */
  contentClassName?: string;
}

export function PageContainer({
  children,
  gradientVariant = 'dashboard',
  className,
  contentClassName,
}: PageContainerProps) {
  return (
    <div className={cn('min-h-screen relative', className)}>
      {/* Background gradient - layered radial */}
      <GradientBackground variant={gradientVariant} className="fixed" />
      <MaxWidthContainer
        className={cn('p-4 sm:p-6 lg:p-8 mt-4', contentClassName)}
      >
        {children}
      </MaxWidthContainer>
    </div>
  );
}
