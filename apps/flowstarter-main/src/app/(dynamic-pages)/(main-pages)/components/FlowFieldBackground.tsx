'use client';

/**
 * Animated flow field SVG background for the landing page hero.
 */
export function FlowFieldBackground() {
  return (
    <>
        {/* Flow Field Background - Hero Section */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ height: '100vh' }}
        >
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.25] dark:opacity-[0.12]"
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
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
              <linearGradient
                id="flowGradient2"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            {/* Flow lines group 1 - horizontal drift */}
            <g
              className="flow-line-1"
              stroke="url(#flowGradient1)"
              strokeWidth="0.5"
            >
              <path d="M-100,80 Q200,60 400,100 T800,80 T1300,120" />
              <path d="M-100,140 Q150,160 350,120 T750,160 T1300,140" />
              <path d="M-100,200 Q250,180 450,220 T850,190 T1300,230" />
              <path d="M-100,260 Q180,280 380,240 T780,280 T1300,260" />
              <path d="M-100,320 Q220,300 420,340 T820,310 T1300,350" />
              <path d="M-100,380 Q200,400 400,360 T800,400 T1300,380" />
            </g>
            {/* Flow lines group 2 - diagonal drift */}
            <g
              className="flow-line-2"
              stroke="url(#flowGradient2)"
              strokeWidth="0.7"
            >
              <path d="M-50,440 Q300,420 500,460 T900,430 T1350,470" />
              <path d="M-50,500 Q250,520 450,480 T850,520 T1350,490" />
              <path d="M-50,560 Q350,540 550,580 T950,550 T1350,590" />
              <path d="M-50,620 Q280,640 480,600 T880,640 T1350,620" />
              <path d="M-50,680 Q320,660 520,700 T920,670 T1350,710" />
              <path d="M-50,740 Q280,760 480,720 T880,760 T1350,740" />
            </g>
            {/* Flow lines group 3 - subtle curves */}
            <g
              className="flow-line-3"
              stroke="url(#flowGradient1)"
              strokeWidth="0.5"
            >
              <path d="M0,50 Q400,30 600,70 T1000,40 T1200,80" />
              <path d="M0,110 Q350,130 550,90 T950,130 T1200,110" />
              <path d="M0,780 Q400,760 600,800 T1000,770 T1200,810" />
            </g>
          </svg>
        </div>

    </>
  );
}
