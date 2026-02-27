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
          25% { transform: translateY(-15px) translateX(25px); }
          50% { transform: translateY(10px) translateX(-20px); }
          75% { transform: translateY(-8px) translateX(15px); }
        }
        @keyframes flowDrift2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(18px) translateX(-22px); }
          50% { transform: translateY(-12px) translateX(28px); }
          75% { transform: translateY(8px) translateX(-10px); }
        }
        @keyframes flowDrift3 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(15px); }
          50% { transform: translateY(15px) translateX(-25px); }
          75% { transform: translateY(-10px) translateX(20px); }
        }
        @keyframes flowGlow {
          0%, 100% { 
            opacity: 1;
            filter: drop-shadow(0 0 2px rgba(124, 58, 237, 0.3));
          }
          50% { 
            opacity: 0.7;
            filter: drop-shadow(0 0 8px rgba(124, 58, 237, 0.6));
          }
        }
        @keyframes flowGlowStrong {
          0%, 100% { 
            opacity: 1;
            filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.4));
          }
          50% { 
            opacity: 0.8;
            filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.7));
          }
        }
        @keyframes gradientFlow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -100; }
        }
        .flow-group-1 { 
          animation: flowDrift1 15s ease-in-out infinite, flowGlow 4s ease-in-out infinite;
        }
        .flow-group-2 { 
          animation: flowDrift2 18s ease-in-out infinite, flowGlowStrong 5s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        .flow-group-3 { 
          animation: flowDrift3 22s ease-in-out infinite, flowGlow 6s ease-in-out infinite;
          animation-delay: 1s;
        }
        .flow-moving {
          animation: gradientFlow 8s linear infinite;
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

        {/* Top purple/indigo glow - animated */}
        <div
          className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] rounded-full opacity-[0.5] dark:opacity-[0.15] animate-pulse"
          style={{
            background:
              'radial-gradient(ellipse, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
            animationDuration: '4s',
          }}
        />

        {/* Right violet glow - animated */}
        <div
          className="absolute top-1/4 -right-[100px] w-[500px] h-[500px] rounded-full opacity-[0.35] dark:opacity-[0.10] animate-pulse"
          style={{
            background:
              'radial-gradient(ellipse, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            animationDuration: '5s',
            animationDelay: '1s',
          }}
        />

        {/* Bottom left - subtle warm/yellow tint */}
        <div
          className="absolute -bottom-[100px] -left-[100px] w-[600px] h-[400px] rounded-full opacity-[0.25] dark:opacity-[0.08] animate-pulse"
          style={{
            background:
              'radial-gradient(ellipse, rgba(251, 191, 36, 0.25) 0%, transparent 70%)',
            animationDuration: '6s',
            animationDelay: '2s',
          }}
        />

        {/* Bottom right - violet accent */}
        <div
          className="absolute -bottom-[150px] right-1/4 w-[500px] h-[400px] rounded-full opacity-[0.20] dark:opacity-[0.08] animate-pulse"
          style={{
            background:
              'radial-gradient(ellipse, rgba(167, 139, 250, 0.25) 0%, transparent 70%)',
            animationDuration: '5s',
            animationDelay: '0.5s',
          }}
        />

        {/* Animated Flow lines - dynamic movement with glow */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.12] dark:opacity-[0.15]"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
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
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <g stroke="url(#flowGradient1)" strokeWidth="2" className={animated ? "flow-group-1" : ""} filter="url(#glow)">
            <path d="M-100,150 Q200,120 400,180 T800,140 T1300,200" className={animated ? "flow-moving" : ""} />
            <path d="M-100,300 Q300,270 500,330 T900,290 T1300,350" />
            <path d="M-100,450 Q250,420 450,480 T850,440 T1300,500" className={animated ? "flow-moving" : ""} />
          </g>
          <g stroke="url(#flowGradient2)" strokeWidth="1.5" className={animated ? "flow-group-2" : ""} filter="url(#glow)">
            <path d="M-100,200 Q150,230 350,170 T750,230 T1300,190" />
            <path d="M-100,380 Q200,350 400,410 T800,370 T1300,430" className={animated ? "flow-moving" : ""} />
            <path d="M-100,550 Q180,580 380,520 T780,580 T1300,540" />
          </g>
          <g stroke="url(#flowGradient1)" strokeWidth="1" className={animated ? "flow-group-3" : ""}>
            <path d="M-100,100 Q200,80 400,120 T800,100 T1300,140" className={animated ? "flow-moving" : ""} />
            <path d="M-100,250 Q250,280 450,220 T850,280 T1300,240" />
            <path d="M-100,600 Q200,620 400,580 T800,620 T1300,600" />
            <path d="M-100,700 Q250,680 450,720 T850,690 T1300,730" className={animated ? "flow-moving" : ""} />
          </g>
        </svg>
      </div>
    </>
  );
}
