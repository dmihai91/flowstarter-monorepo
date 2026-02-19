'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface WizardCardProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'default' | 'large';
}

interface WizardCardHeaderProps {
  children: ReactNode;
  background?: string;
  className?: string;
}

interface WizardCardContentProps {
  children: ReactNode;
  className?: string;
}

interface WizardCardHeaderContentProps {
  title: string;
  description: string;
  className?: string;
}

export function WizardCard({
  children,
  className,
  maxWidth = 'default',
}: WizardCardProps) {
  return (
    <div
      className={cn(
        'w-full mx-auto relative',
        maxWidth === 'large' ? 'max-w-8xl' : 'max-w-5xl',
        'lg:min-w-3xl',
        'rounded-[24px]',
        // Enhanced glassmorphism with more opacity and depth
        'bg-[rgba(243,243,243,0.50)] dark:bg-[rgba(58,58,74,0.50)]',
        'backdrop-blur-xl',
        'border border-white/50 dark:border-white/20',
        // Depth effect shadows
        'shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.05)]',
        'dark:shadow-[0_8px_32px_rgba(0,0,0,0.2),0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.15)]',
        className
      )}
    >
      {/* Top highlight for depth - light mode */}
      <div
        className="absolute inset-0 rounded-[24px] pointer-events-none dark:hidden"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)`,
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
        }}
      />
      {/* Top highlight for depth - dark mode */}
      <div
        className="absolute inset-0 rounded-[24px] pointer-events-none hidden dark:block"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 30%, transparent 60%)`,
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
        }}
      />
      {/* Content wrapper with z-index */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function WizardCardHeader({
  children,
  className,
  background = 'var(--wizard-header-bg)',
}: WizardCardHeaderProps) {
  return (
    <div
      className={cn(
        'px-4 py-6 sm:px-[40px] sm:py-[32px]',
        'rounded-t-[24px]',
        className
      )}
      style={{ background }}
    >
      {children}
    </div>
  );
}

export function WizardCardContent({
  children,
  className,
}: WizardCardContentProps) {
  return (
    <div
      className={cn(
        'px-4 py-6 pb-4 sm:px-[40px] sm:py-[32px] sm:pb-[24px]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function WizardCardHeaderContent({
  title,
  description,
  className,
}: WizardCardHeaderContentProps) {
  return (
    <div className={cn('flex flex-col gap-[6px]', className)}>
      <h3 className="text-xl font-bold leading-normal text-[var(--wizard-header-text)]">
        {title}
      </h3>
      <p className="text-md font-normal leading-[23px] text-[var(--wizard-header-text)] opacity-95">
        {description}
      </p>
    </div>
  );
}
