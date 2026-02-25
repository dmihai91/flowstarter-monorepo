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
  // Dashboard uses very subtle lines
  const lineOpacity = variant === 'dashboard' ? 'opacity-[0.04]' : 'opacity-[0.08]';
  const lineOpacityDark = variant === 'dashboard' ? 'dark:opacity-[0.03]' : 'dark:opacity-[0.06]';
  
  return (
    <>
      <style jsx>{`
        @keyframes flow-drift-1 {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(30px) translateY(-20px); }
        }
        @keyframes flow-drift-2 {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-25px) translateY(15px); }
        }
        @keyframes flow-drift-3 {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(20px) translateY(10px); }
        }
        .flow-line-1 { animation: flow-drift-1 25s ease-in-out infinite; }
        .flow-line-2 { animation: flow-drift-2 30s ease-in-out infinite; }
        .flow-line-3 { animation: flow-drift-3 22s ease-in-out infinite; }
      `}</style>
      <div
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 overflow-hidden',
          className
        )}
      >
        {/* Base gradient - subtle lavender wash */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br dark:from-[#0a0a0c] dark:via-[#0c0c10] dark:to-[#0a0a0c]',
          gradientClass
        )} />
        
        {/* Main gradient overlay - top to bottom */}
        <div 
          className="absolute inset-0 opacity-40 dark:opacity-20"
          style={{ 
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 100%)'
          }}
        />
        
        {/* Accent gradient orb - top right */}
        <div 
          className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-20 dark:opacity-10 blur-[100px]"
          style={{ background: 'radial-gradient(circle, hsl(233, 65%, 58%, 0.3) 0%, transparent 70%)' }}
        />
        
        {/* Accent gradient orb - bottom left */}
        <div 
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-15 dark:opacity-8 blur-[100px]"
          style={{ background: 'radial-gradient(circle, hsl(211, 93%, 61%, 0.25) 0%, transparent 70%)' }}
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
          <g className="flow-line-1" stroke="url(#flowGradient1)" strokeWidth="1.5">
            <path d="M-100,150 Q200,120 400,180 T800,140 T1300,200" />
            <path d="M-100,300 Q300,270 500,330 T900,290 T1300,350" />
            <path d="M-100,450 Q250,420 450,480 T850,440 T1300,500" />
          </g>
          <g className="flow-line-2" stroke="url(#flowGradient2)" strokeWidth="1.2">
            <path d="M-100,200 Q150,230 350,170 T750,230 T1300,190" />
            <path d="M-100,380 Q200,350 400,410 T800,370 T1300,430" />
            <path d="M-100,550 Q180,580 380,520 T780,580 T1300,540" />
          </g>
          <g className="flow-line-3" stroke="url(#flowGradient1)" strokeWidth="0.8">
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
