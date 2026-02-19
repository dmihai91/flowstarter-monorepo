'use client';

import { cn } from '@/lib/utils';

export type GradientVariant = 'dashboard' | 'integrations' | 'help' | 'wizard';

interface GradientBackgroundProps {
  variant?: GradientVariant;
  className?: string;
  includeBackground?: boolean;
}

/**
 * Gradient background using CSS variables defined in globals.css
 * Uses radial gradients with color-mix for smooth transitions
 */
export function GradientBackground({
  variant = 'dashboard',
  className,
  includeBackground = true,
}: GradientBackgroundProps) {
  const gradientVars = {
    dashboard: {
      top1: 'var(--dashboard-gradient-top-1)',
      top2: 'var(--dashboard-gradient-top-2)',
      bottom: 'var(--dashboard-gradient-bottom)',
    },
    integrations: {
      top1: 'var(--integrations-gradient-top-1)',
      top2: 'var(--integrations-gradient-top-2)',
      bottom: 'var(--integrations-gradient-bottom)',
    },
    help: {
      top1: 'var(--help-gradient-top-1)',
      top2: 'var(--help-gradient-top-2)',
      bottom: 'var(--help-gradient-bottom)',
    },
    wizard: {
      top1: 'var(--wizard-gradient-left)',
      top2: 'var(--wizard-gradient-right)',
      bottom: 'transparent',
    },
  };

  const gradients = gradientVars[variant];

  if (variant === 'wizard') {
    return (
      <div
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 overflow-hidden',
          includeBackground && 'bg-[#faf9f5] dark:bg-[hsl(240,8%,17%)]',
          className
        )}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 120% 70% at 0% 0%, ${gradients.top1} 0%, color-mix(in srgb, ${gradients.top1} 88%, transparent) 10%, color-mix(in srgb, ${gradients.top1} 75%, transparent) 22%, color-mix(in srgb, ${gradients.top1} 60%, transparent) 35%, color-mix(in srgb, ${gradients.top1} 45%, transparent) 48%, color-mix(in srgb, ${gradients.top1} 28%, transparent) 58%, color-mix(in srgb, ${gradients.top1} 12%, transparent) 66%, transparent 72%)`,
            mixBlendMode: 'normal',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 100% 65% at 100% 0%, ${gradients.top2} 0%, color-mix(in srgb, ${gradients.top2} 88%, transparent) 10%, color-mix(in srgb, ${gradients.top2} 75%, transparent) 22%, color-mix(in srgb, ${gradients.top2} 60%, transparent) 35%, color-mix(in srgb, ${gradients.top2} 45%, transparent) 48%, color-mix(in srgb, ${gradients.top2} 28%, transparent) 58%, color-mix(in srgb, ${gradients.top2} 12%, transparent) 66%, transparent 72%)`,
            mixBlendMode: 'normal',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 overflow-hidden',
        includeBackground && 'bg-[#faf9f5] dark:bg-[hsl(240,8%,17%)]',
        className
      )}
    >
      {/* Background gradient - layered radial */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 120% 70% at 0% 0%, ${gradients.top1} 0%, color-mix(in srgb, ${gradients.top1} 88%, transparent) 10%, color-mix(in srgb, ${gradients.top1} 75%, transparent) 22%, color-mix(in srgb, ${gradients.top1} 60%, transparent) 35%, color-mix(in srgb, ${gradients.top1} 45%, transparent) 48%, color-mix(in srgb, ${gradients.top1} 28%, transparent) 58%, color-mix(in srgb, ${gradients.top1} 12%, transparent) 66%, transparent 72%)`,
          mixBlendMode: 'normal',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 100% 65% at 100% 0%, ${gradients.top2} 0%, color-mix(in srgb, ${gradients.top2} 88%, transparent) 10%, color-mix(in srgb, ${gradients.top2} 75%, transparent) 22%, color-mix(in srgb, ${gradients.top2} 60%, transparent) 35%, color-mix(in srgb, ${gradients.top2} 45%, transparent) 48%, color-mix(in srgb, ${gradients.top2} 28%, transparent) 58%, color-mix(in srgb, ${gradients.top2} 12%, transparent) 66%, transparent 72%)`,
          mixBlendMode: 'normal',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 55% at 50% 100%, ${gradients.bottom} 0%, color-mix(in srgb, ${gradients.bottom} 88%, transparent) 10%, color-mix(in srgb, ${gradients.bottom} 75%, transparent) 20%, color-mix(in srgb, ${gradients.bottom} 60%, transparent) 32%, color-mix(in srgb, ${gradients.bottom} 45%, transparent) 44%, color-mix(in srgb, ${gradients.bottom} 28%, transparent) 54%, color-mix(in srgb, ${gradients.bottom} 12%, transparent) 61%, transparent 67%)`,
          mixBlendMode: 'normal',
        }}
      />
      {/* Enhanced noise texture to reduce banding */}
      <div
        className="absolute inset-0 pointer-events-none dark:opacity-[0.055] opacity-[0.018]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          backgroundSize: '180px 180px',
          mixBlendMode: 'overlay',
        }}
      />
      {/* Additional dithering layer for dark mode */}
      <div
        className="absolute inset-0 pointer-events-none dark:opacity-[0.03] opacity-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='dither'%3E%3CfeTurbulence type='turbulence' baseFrequency='2.2' numOctaves='3' seed='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23dither)'/%3E%3C/svg%3E\")",
          backgroundSize: '128px 128px',
          mixBlendMode: 'soft-light',
        }}
      />
    </div>
  );
}
