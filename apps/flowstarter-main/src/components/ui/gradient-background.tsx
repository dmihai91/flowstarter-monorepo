'use client';

import { cn } from '@/lib/utils';

export type GradientVariant =
  | 'dashboard'
  | 'integrations'
  | 'help'
  | 'wizard'
  | 'landing'
  | 'default';

interface GradientBackgroundProps {
  variant?: GradientVariant;
  className?: string;
  animated?: boolean;
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
  animated = true,
}: GradientBackgroundProps) {
  const gradientClass = variantGradients[variant];

  return (
    <>
      {/* CSS for flow line animations */}
      <style jsx global>{`
        @keyframes flowDrift1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-10px) translateX(15px); }
        }
        @keyframes flowDrift2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(8px) translateX(-12px); }
        }
        @keyframes flowDrift3 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-6px) translateX(10px); }
        }
        .flow-group-1 { 
          animation: flowDrift1 20s ease-in-out infinite;
          will-change: transform;
        }
        .flow-group-2 { 
          animation: flowDrift2 25s ease-in-out infinite;
          will-change: transform;
        }
        .flow-group-3 { 
          animation: flowDrift3 30s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>
      <div
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 overflow-hidden',
          className
        )}
      >
        {/* Base - clean white/dark */}
        <div className="absolute inset-0 bg-white dark:bg-[#07070a]" />

        {/* Top purple/indigo glow */}
        <div
          className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] rounded-full opacity-[0.4] dark:opacity-[0.12]"
          style={{
            background:
              'radial-gradient(ellipse, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
          }}
        />

        {/* Right violet glow */}
        <div
          className="absolute top-1/4 -right-[100px] w-[500px] h-[500px] rounded-full opacity-[0.3] dark:opacity-[0.08]"
          style={{
            background:
              'radial-gradient(ellipse, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          }}
        />

        {/* Bottom left - subtle warm/yellow tint */}
        <div
          className="absolute -bottom-[100px] -left-[100px] w-[600px] h-[400px] rounded-full opacity-[0.2] dark:opacity-[0.06]"
          style={{
            background:
              'radial-gradient(ellipse, rgba(251, 191, 36, 0.25) 0%, transparent 70%)',
          }}
        />

        {/* Bottom right - violet accent */}
        <div
          className="absolute -bottom-[150px] right-1/4 w-[500px] h-[400px] rounded-full opacity-[0.15] dark:opacity-[0.06]"
          style={{
            background:
              'radial-gradient(ellipse, rgba(167, 139, 250, 0.25) 0%, transparent 70%)',
          }}
        />

        {/* Flow lines - smooth animation */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.10] dark:opacity-[0.12]"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          style={{ willChange: 'transform' }}
        >
          <defs>
            <linearGradient
              id="flowGradient1"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient
              id="flowGradient2"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
          <g stroke="url(#flowGradient1)" strokeWidth="1.5" className={animated ? "flow-group-1" : ""}>
            <path d="M-100,150 Q200,120 400,180 T800,140 T1300,200" />
            <path d="M-100,300 Q300,270 500,330 T900,290 T1300,350" />
            <path d="M-100,450 Q250,420 450,480 T850,440 T1300,500" />
          </g>
          <g stroke="url(#flowGradient2)" strokeWidth="1.2" className={animated ? "flow-group-2" : ""}>
            <path d="M-100,200 Q150,230 350,170 T750,230 T1300,190" />
            <path d="M-100,380 Q200,350 400,410 T800,370 T1300,430" />
            <path d="M-100,550 Q180,580 380,520 T780,580 T1300,540" />
          </g>
          <g stroke="url(#flowGradient1)" strokeWidth="0.8" className={animated ? "flow-group-3" : ""}>
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
