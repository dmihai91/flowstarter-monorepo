'use client';

import { cn } from '@/lib/utils';

export type GradientVariant = 'dashboard' | 'integrations' | 'help' | 'landing' | 'default';

interface GradientBackgroundProps {
  variant?: GradientVariant;
  className?: string;
}

const variantStyles: Record<GradientVariant, { orb1: string; orb2: string }> = {
  dashboard: {
    orb1: 'bg-[var(--purple)]/20',
    orb2: 'bg-[var(--blue)]/15',
  },
  integrations: {
    orb1: 'bg-[var(--green)]/20',
    orb2: 'bg-[var(--purple)]/15',
  },
  help: {
    orb1: 'bg-[var(--blue)]/20',
    orb2: 'bg-[var(--purple)]/15',
  },
  landing: {
    orb1: 'bg-[var(--purple)]/15',
    orb2: 'bg-[var(--blue)]/10',
  },
  default: {
    orb1: 'bg-[var(--purple)]/20',
    orb2: 'bg-[var(--blue)]/15',
  },
};

export function GradientBackground({ variant = 'default', className }: GradientBackgroundProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn('fixed inset-0 -z-10 overflow-hidden', className)}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100/80 dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#0f0f1a]" />
      
      {/* Accent orbs */}
      <div 
        className={cn(
          'absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-60 dark:opacity-40',
          styles.orb1
        )}
      />
      <div 
        className={cn(
          'absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-50 dark:opacity-30',
          styles.orb2
        )}
      />
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
