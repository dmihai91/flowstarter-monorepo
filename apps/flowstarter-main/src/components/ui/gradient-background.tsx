'use client';

import { cn } from '@/lib/utils';

export type GradientVariant = 'dashboard' | 'integrations' | 'help' | 'wizard' | 'landing' | 'default';

interface GradientBackgroundProps {
  variant?: GradientVariant;
  className?: string;
}

// Different gradient washes for each page
const variantGradients: Record<GradientVariant, string> = {
  dashboard: 'from-white via-[#FAFAFF] to-[#F5F3FF]',
  integrations: 'from-white via-[#F5FFFA] to-[#F0FFF4]',
  help: 'from-white via-[#F5F8FF] to-[#EEF2FF]',
  wizard: 'from-white via-[#FAFAFF] to-[#F5F3FF]',
  landing: 'from-white via-[#F8F7FF] to-[#EDE9FE]',
  default: 'from-white via-[#FAFAFF] to-[#F5F3FF]',
};

/**
 * Gradient background with flow lines - matching landing page aesthetic
 */
export function GradientBackground({
  variant = 'dashboard',
  className,
}: GradientBackgroundProps) {
  const gradientClass = variantGradients[variant];
  // Lines visibility - subtle in light, more visible in dark
  const lineOpacity = 'opacity-[0.06]';
  const lineOpacityDark = 'dark:opacity-[0.08]';
  
  return (
    <>
      <div
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 overflow-hidden',
          className
        )}
      >
        {/* Base gradient - light mode like Figma, dark mode deep */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5F5F7] via-[#FAFAFA] to-white dark:from-[#07070a] dark:via-[#09090d] dark:to-[#07070a]" />
        
        {/* Top purple glow - both modes */}
        <div 
          className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-[0.4] dark:opacity-[0.15]"
          style={{ 
            background: 'radial-gradient(ellipse, rgba(99, 102, 241, 0.15) 0%, transparent 70%)'
          }}
        />
        
        {/* Secondary glow - bottom */}
        <div 
          className="absolute -bottom-[200px] left-1/4 w-[600px] h-[400px] rounded-full opacity-[0.3] dark:opacity-[0.10]"
          style={{ 
            background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.1) 0%, transparent 70%)'
          }}
        />
        
        {/* Animated Flow lines - very subtle for dashboard */}
        <svg 
          className={cn('absolute inset-0 w-full h-full', lineOpacity, lineOpacityDark)}
          viewBox="0 0 1200 800" 
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <defs>
            <linearGradient id="flowGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(233, 65%, 58%)" />
              <stop offset="100%" stopColor="hsl(211, 93%, 61%)" />
            </linearGradient>
            <linearGradient id="flowGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(211, 93%, 61%)" />
              <stop offset="100%" stopColor="hsl(233, 65%, 58%)" />
            </linearGradient>
          </defs>
          <g stroke="url(#flowGradient1)" strokeWidth="1.5">
            <path d="M-100,150 Q200,120 400,180 T800,140 T1300,200" />
            <path d="M-100,300 Q300,270 500,330 T900,290 T1300,350" />
            <path d="M-100,450 Q250,420 450,480 T850,440 T1300,500" />
          </g>
          <g stroke="url(#flowGradient2)" strokeWidth="1.2">
            <path d="M-100,200 Q150,230 350,170 T750,230 T1300,190" />
            <path d="M-100,380 Q200,350 400,410 T800,370 T1300,430" />
            <path d="M-100,550 Q180,580 380,520 T780,580 T1300,540" />
          </g>
          <g stroke="url(#flowGradient1)" strokeWidth="0.8">
            <path d="M-100,100 Q200,80 400,120 T800,100 T1300,140" />
            <path d="M-100,250 Q250,280 450,220 T850,280 T1300,240" />
            <path d="M-100,600 Q200,620 400,580 T800,620 T1300,600" />
            <path d="M-100,700 Q250,680 450,720 T850,690 T1300,730" />
          </g>
        </svg>
      </div>
    </>
  );
}
