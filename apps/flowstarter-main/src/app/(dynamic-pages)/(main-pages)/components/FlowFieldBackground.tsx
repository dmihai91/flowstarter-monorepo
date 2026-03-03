'use client';

/**
 * Animated flow field SVG background for the landing page hero.
 */
export function FlowFieldBackground() {
  return (
    <>
        {/* Flow Field Background - Hero Section */}
        <div
          className="fixed inset-0 pointer-events-none overflow-hidden z-0"
        >
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.12] dark:opacity-[0.35]"
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
                <stop offset="0%" stopColor="var(--landing-flow-start)" />
                <stop offset="100%" stopColor="var(--landing-flow-end)" />
              </linearGradient>
              <linearGradient
                id="flowGradient2"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="var(--landing-flow-alt-start)" />
                <stop offset="100%" stopColor="var(--landing-flow-alt-end)" />
              </linearGradient>
            </defs>
            {/* Flow lines group 1 - horizontal drift */}
            <g
              className="flow-line-1"
              stroke="url(#flowGradient1)"
              strokeWidth="0.7"
            >
              <path d="M-100,80 Q200,60 400,100 T800,80 T1300,120" />
              <path d="M-100,200 Q250,180 450,220 T850,190 T1300,230" />
              <path d="M-100,320 Q220,300 420,340 T820,310 T1300,350" />
              <path d="M-100,500 Q280,480 480,520 T880,490 T1300,530" />
            </g>
            {/* Flow lines group 2 - diagonal drift */}
            <g
              className="flow-line-2"
              stroke="url(#flowGradient2)"
              strokeWidth="0.7"
            >
              <path d="M-50,460 Q300,440 500,480 T900,450 T1350,490" />
              <path d="M-50,580 Q350,560 550,600 T950,570 T1350,610" />
              <path d="M-50,700 Q320,680 520,720 T920,690 T1350,730" />
              <path d="M-50,140 Q300,120 500,160 T900,130 T1350,170" />
            </g>
            {/* Flow lines group 3 - subtle curves */}
            <g
              className="flow-line-3"
              stroke="url(#flowGradient1)"
              strokeWidth="0.5"
            >
              <path d="M0,50 Q400,30 600,70 T1000,40 T1200,80" />
              <path d="M0,380 Q400,360 600,400 T1000,370 T1200,410" />
              <path d="M0,780 Q400,760 600,800 T1000,770 T1200,810" />
            </g>
          </svg>
        </div>

    </>
  );
}
