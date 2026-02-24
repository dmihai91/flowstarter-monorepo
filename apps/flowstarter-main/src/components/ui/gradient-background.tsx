'use client';

import { cn } from '@/lib/utils';

export type GradientVariant = 'dashboard' | 'integrations' | 'help' | 'wizard' | 'landing';

interface GradientBackgroundProps {
  variant?: GradientVariant;
  className?: string;
  includeBackground?: boolean;
}

/**
 * Gradient background with flow lines - matching landing page aesthetic
 */
export function GradientBackground({
  variant = 'dashboard',
  className,
}: GradientBackgroundProps) {
  // All variants now use the new unified style
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 overflow-hidden',
        className
      )}
    >
      {/* Base gradient - white to lavender (light) / dark (dark) */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#FAFAFF] to-[#F0EEFF] dark:from-[#0a0a0c] dark:via-[#0c0c10] dark:to-[#0a0a0c]" />
      
      {/* Accent gradient orb - top left */}
      <div 
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-30 dark:opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)' }}
      />
      
      {/* Accent gradient orb - bottom right */}
      <div 
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-25 dark:opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)' }}
      />
      
      {/* Flow lines */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-[0.08] dark:opacity-[0.06]"
        viewBox="0 0 1200 800" 
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient id="bgFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <g stroke="url(#bgFlowGradient)" strokeWidth="1">
          <path d="M-100,100 Q200,80 400,120 T800,100 T1300,140" />
          <path d="M-100,200 Q150,220 350,180 T750,220 T1300,200" />
          <path d="M-100,300 Q250,280 450,320 T850,290 T1300,330" />
          <path d="M-100,400 Q180,420 380,380 T780,420 T1300,400" />
          <path d="M-100,500 Q220,480 420,520 T820,490 T1300,530" />
          <path d="M-100,600 Q200,620 400,580 T800,620 T1300,600" />
          <path d="M-100,700 Q250,680 450,720 T850,690 T1300,730" />
        </g>
      </svg>
    </div>
  );
}
