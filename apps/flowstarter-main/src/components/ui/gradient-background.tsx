'use client';

import { cn } from '@/lib/utils';

export type GradientVariant = 'dashboard' | 'integrations' | 'help' | 'wizard' | 'landing';

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
    landing: {
      top1: '#7C3AED',
      top2: '#3B82F6',
      bottom: '#EDE9FE',
    },
  };

  const gradients = gradientVars[variant];

  // New landing style with flow lines
  if (variant === 'landing') {
    return (
      <div
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 overflow-hidden',
          className
        )}
      >
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#F8F7FF] to-[#EDE9FE] dark:from-[#0a0a0c] dark:via-[#0a0a0c] dark:to-[#0a0a0c]" />
        
        {/* Flow lines */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-[0.12] dark:opacity-[0.10]"
          viewBox="0 0 1200 800" 
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <defs>
            <linearGradient id="dashboardFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          <g stroke="url(#dashboardFlowGradient)" strokeWidth="1.5">
            <path d="M-100,80 Q200,60 400,100 T800,80 T1300,120" />
            <path d="M-100,180 Q150,200 350,160 T750,200 T1300,180" />
            <path d="M-100,280 Q250,260 450,300 T850,270 T1300,310" />
            <path d="M-100,380 Q180,400 380,360 T780,400 T1300,380" />
            <path d="M-100,480 Q220,460 420,500 T820,470 T1300,510" />
            <path d="M-100,580 Q200,600 400,560 T800,600 T1300,580" />
            <path d="M-100,680 Q250,660 450,700 T850,670 T1300,710" />
            <path d="M-100,780 Q180,800 380,760 T780,800 T1300,780" />
          </g>
        </svg>
      </div>
    );
  }

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
