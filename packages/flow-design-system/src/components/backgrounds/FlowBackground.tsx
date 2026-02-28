import { forwardRef, useEffect, useState, type HTMLAttributes } from 'react';
import { getEffectiveTheme } from '../../utils/theme';

export type FlowBackgroundVariant = 'dashboard' | 'editor' | 'landing' | 'wizard';

export interface FlowBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  variant?: FlowBackgroundVariant;
  animated?: boolean;
}

interface VariantConfig {
  bgLight: string;
  bgDark: string;
  glowLight: number;
  glowDark: number;
  lineLight: number;
  lineDark: number;
}

const variants: Record<FlowBackgroundVariant, VariantConfig> = {
  dashboard: { bgLight: '#ffffff', bgDark: '#07070a', glowLight: 0.4, glowDark: 0.12, lineLight: 0.05, lineDark: 0.06 },
  editor:    { bgLight: '#0a0a0c', bgDark: '#0a0a0c', glowLight: 0.15, glowDark: 0.15, lineLight: 0.07, lineDark: 0.07 },
  landing:   { bgLight: '#ffffff', bgDark: '#07070a', glowLight: 0.5, glowDark: 0.15, lineLight: 0.06, lineDark: 0.07 },
  wizard:    { bgLight: '#ffffff', bgDark: '#07070a', glowLight: 0.35, glowDark: 0.1, lineLight: 0.04, lineDark: 0.05 },
};

const animationCSS = `
  @keyframes flow-drift-1 {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    50% { transform: translateY(-10px) translateX(15px); }
  }
  @keyframes flow-drift-2 {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    50% { transform: translateY(8px) translateX(-12px); }
  }
  @keyframes flow-drift-3 {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    50% { transform: translateY(-6px) translateX(10px); }
  }
`;

export const FlowBackground = forwardRef<HTMLDivElement, FlowBackgroundProps>(
  ({ variant = 'dashboard', animated = true, className = '', style, ...props }, ref) => {
    const [isDark, setIsDark] = useState(true); // Default to dark for SSR

    useEffect(() => {
      const update = () => setIsDark(getEffectiveTheme() === 'dark');
      update();

      // Listen for theme changes via data-theme attribute
      const observer = new MutationObserver(() => update());
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

      // Also listen for system preference changes
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', update);

      return () => {
        observer.disconnect();
        mq.removeEventListener('change', update);
      };
    }, []);

    const config = variants[variant];
    const bg = isDark ? config.bgDark : config.bgLight;
    const glowOpacity = isDark ? config.glowDark : config.glowLight;
    const lineOpacity = isDark ? config.lineDark : config.lineLight;
    const warmOpacity = isDark ? 0.06 : 0.2;
    const violetAccentOpacity = isDark ? 0.06 : 0.15;

    return (
      <div
        ref={ref}
        className={className}
        style={{ pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: -1, overflow: 'hidden', ...style }}
        {...props}
      >
        {animated && <style dangerouslySetInnerHTML={{ __html: animationCSS }} />}

        {/* Base background */}
        <div style={{ position: 'absolute', inset: 0, background: bg }} />

        {/* Top purple/indigo glow */}
        <div
          style={{
            position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)',
            width: '1000px', height: '500px', borderRadius: '9999px', opacity: glowOpacity,
            background: 'radial-gradient(ellipse, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
          }}
        />

        {/* Right violet glow */}
        <div
          style={{
            position: 'absolute', top: '25%', right: '-100px',
            width: '500px', height: '500px', borderRadius: '9999px', opacity: glowOpacity,
            background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          }}
        />

        {/* Bottom left warm accent */}
        <div
          style={{
            position: 'absolute', bottom: '-100px', left: '-100px',
            width: '600px', height: '400px', borderRadius: '9999px', opacity: warmOpacity,
            background: 'radial-gradient(ellipse, rgba(251, 191, 36, 0.25) 0%, transparent 70%)',
          }}
        />

        {/* Bottom right violet accent */}
        <div
          style={{
            position: 'absolute', bottom: '-150px', right: '25%',
            width: '500px', height: '400px', borderRadius: '9999px', opacity: violetAccentOpacity,
            background: 'radial-gradient(ellipse, rgba(167, 139, 250, 0.25) 0%, transparent 70%)',
          }}
        />

        {/* Flow lines SVG */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: lineOpacity }}
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <defs>
            <linearGradient id="flow-bg-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="flow-bg-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
          <g
            stroke="url(#flow-bg-grad-1)"
            strokeWidth="1.5"
            style={animated ? { animation: 'flow-drift-1 20s ease-in-out infinite', willChange: 'transform' } : undefined}
          >
            <path d="M-100,150 Q200,120 400,180 T800,140 T1300,200" />
            <path d="M-100,300 Q300,270 500,330 T900,290 T1300,350" />
            <path d="M-100,450 Q250,420 450,480 T850,440 T1300,500" />
          </g>
          <g
            stroke="url(#flow-bg-grad-2)"
            strokeWidth="1.2"
            style={animated ? { animation: 'flow-drift-2 25s ease-in-out infinite', willChange: 'transform' } : undefined}
          >
            <path d="M-100,200 Q150,230 350,170 T750,230 T1300,190" />
            <path d="M-100,380 Q200,350 400,410 T800,370 T1300,430" />
            <path d="M-100,550 Q180,580 380,520 T780,580 T1300,540" />
          </g>
          <g
            stroke="url(#flow-bg-grad-1)"
            strokeWidth="0.8"
            style={animated ? { animation: 'flow-drift-3 30s ease-in-out infinite', willChange: 'transform' } : undefined}
          >
            <path d="M-100,100 Q200,80 400,120 T800,100 T1300,140" />
            <path d="M-100,250 Q250,280 450,220 T850,280 T1300,240" />
            <path d="M-100,600 Q200,620 400,580 T800,620 T1300,600" />
            <path d="M-100,700 Q250,680 450,720 T850,690 T1300,730" />
          </g>
        </svg>
      </div>
    );
  }
);

FlowBackground.displayName = 'FlowBackground';
