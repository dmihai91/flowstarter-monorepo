'use client';

import MaxWidthContainer from '@/components/MaxWidthContainer';
import {
  GradientBackground,
  type GradientVariant,
} from '@/components/ui/gradient-background';
import { cn } from '@/lib/utils';
import React from 'react';

interface PageContainerProps extends React.PropsWithChildren {
  gradientVariant?: GradientVariant;
  className?: string;
  contentClassName?: string;
}

export function PageContainer({
  children,
  gradientVariant = 'landing',
  className,
  contentClassName,
}: PageContainerProps) {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
      `}</style>
      <div className={cn('min-h-screen relative font-[Outfit,system-ui,sans-serif]', className)}>
        {/* Gradient background with flow lines */}
        <GradientBackground variant={gradientVariant} className="fixed" />
        <MaxWidthContainer
          className={cn('p-4 sm:p-6 lg:p-8 pt-6', contentClassName)}
        >
          {children}
        </MaxWidthContainer>
      </div>
    </>
  );
}
