import { forwardRef, useEffect, useState, type HTMLAttributes } from 'react';
import { getEffectiveTheme } from '../../utils/theme';

export type FlowBackgroundVariant = 'dashboard' | 'editor' | 'landing' | 'wizard' | 'auth';

export interface FlowBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  variant?: FlowBackgroundVariant;
  animated?: boolean;
}

interface VariantConfig {
  glowLight: number;
  glowDark: number;
  lineLight: number;
  lineDark: number;
}

// Backgrounds now use --fs-bg-* tokens resolved at runtime.
// Only glow/line opacities vary per variant — base color comes from the token system.
const variants: Record<FlowBackgroundVariant, VariantConfig> = {
  dashboard: { glowLight: 0.10, glowDark: 0.14, lineLight: 0,    lineDark: 0    },
  editor:    { glowLight: 0.12, glowDark: 0.10, lineLight: 0.04, lineDark: 0.05 },
  landing:   { glowLight: 0.55, glowDark: 0.38, lineLight: 0.08, lineDark: 0.08 },
  auth:      { glowLight: 0.14, glowDark: 0.18, lineLight: 0.06, lineDark: 0.08 },
  wizard:    { glowLight: 0.16, glowDark: 0.08, lineLight: 0.03, lineDark: 0.03 },
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
    const [isDark, setIsDark] = useState(() => {
      if (typeof window === 'undefined') return true;
      return getEffectiveTheme() === 'dark';
    });

    useEffect(() => {
      const update = () => setIsDark(getEffectiveTheme() === 'dark');
      update();
      const observer = new MutationObserver(() => update());
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', update);
      return () => {
        observer.disconnect();
        mq.removeEventListener('change', update);
      };
    }, []);

    const config = variants[variant];
    const glowOpacity = isDark ? config.glowDark : config.glowLight;
    const lineOpacity = isDark ? config.lineDark : config.lineLight;
    const warmOpacity = isDark ? 0.10 : 0.06;
    const accentSecondOpacity = isDark ? 0.08 : 0.04;

    // Glow colors aligned with --fs-accent (hsl 233) and --fs-accent-warm
    // These match the landing-design.css orb colors exactly
    const accentGlow    = isDark ? 'rgba(130, 148, 255, 1)' : 'rgba(78, 94, 218, 1)';   // --fs-accent hsl 233
    const accentHot     = isDark ? 'rgba(78, 94, 218, 1)'   : 'rgba(30, 45, 107, 1)';   // darker indigo
    const warmGlow      = isDark ? 'rgba(255, 178, 122, 1)' : 'rgba(180, 83, 9, 1)';    // --fs-accent-warm
    const accentSecond  = isDark ? 'rgba(130, 148, 255, 1)' : 'rgba(78, 94, 218, 1)';

    return (
      <div
        ref={ref}
        className={className}
        style={{ pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: -1, overflow: 'hidden', ...style }}
        {...props}
      >
        {animated && <style dangerouslySetInnerHTML={{ __html: animationCSS }} />}

        {/* Base background — uses fs token */}
        <div style={{
          position: 'absolute', inset: 0,
          background: isDark ? 'var(--fs-bg-base)' : 'var(--fs-bg-base)',
        }} />

        {/* Top-center primary glow */}
        <div style={{
          position: 'absolute', top: '-180px', left: '50%', transform: 'translateX(-50%)',
          width: '1100px', height: '550px', borderRadius: '9999px', opacity: glowOpacity,
          background: `radial-gradient(ellipse, ${accentGlow.replace('1)', '0.5)')} 0%, ${accentGlow.replace('1)', '0.12)')} 40%, transparent 70%)`,
        }} />

        {/* Top-left accent */}
        <div style={{
          position: 'absolute', top: '-50px', left: '-150px',
          width: '600px', height: '400px', borderRadius: '9999px', opacity: glowOpacity * 0.65,
          background: `radial-gradient(ellipse, ${accentHot.replace('1)', '0.35)')} 0%, transparent 65%)`,
        }} />

        {/* Right secondary glow */}
        <div style={{
          position: 'absolute', top: '20%', right: '-80px',
          width: '550px', height: '550px', borderRadius: '9999px', opacity: glowOpacity,
          background: `radial-gradient(ellipse, ${accentGlow.replace('1)', '0.3)')} 0%, ${accentGlow.replace('1)', '0.08)')} 45%, transparent 70%)`,
        }} />

        {/* Centre-left cool accent */}
        <div style={{
          position: 'absolute', top: '45%', left: '-50px',
          width: '450px', height: '350px', borderRadius: '9999px', opacity: glowOpacity * 0.55,
          background: `radial-gradient(ellipse, ${accentSecond.replace('1)', '0.25)')} 0%, transparent 65%)`,
        }} />

        {/* Bottom-left warm accent */}
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-80px',
          width: '600px', height: '400px', borderRadius: '9999px', opacity: warmOpacity,
          background: `radial-gradient(ellipse, ${warmGlow.replace('1)', '0.28)')} 0%, ${warmGlow.replace('1)', '0.08)')} 40%, transparent 70%)`,
        }} />

        {/* Bottom-right accent */}
        <div style={{
          position: 'absolute', bottom: '-120px', right: '20%',
          width: '550px', height: '450px', borderRadius: '9999px', opacity: accentSecondOpacity,
          background: `radial-gradient(ellipse, ${accentGlow.replace('1)', '0.3)')} 0%, transparent 70%)`,
        }} />

        {/* Flow lines SVG */}
        {lineOpacity > 0 && (
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: lineOpacity }}
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <defs>
              <linearGradient id="flow-bg-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="hsl(233,65%,44%)" />
                <stop offset="50%"  stopColor="hsl(233,70%,58%)" />
                <stop offset="100%" stopColor="hsl(211,93%,61%)" />
              </linearGradient>
              <linearGradient id="flow-bg-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="hsl(211,93%,61%)" />
                <stop offset="50%"  stopColor="hsl(233,70%,58%)" />
                <stop offset="100%" stopColor="hsl(233,65%,44%)" />
              </linearGradient>
            </defs>
            <g stroke="url(#flow-bg-grad-1)" strokeWidth="1.2"
              style={animated ? { animation: 'flow-drift-1 20s ease-in-out infinite', willChange: 'transform' } : undefined}>
              <path d="M-100,150 Q200,120 400,180 T800,140 T1300,200" />
              <path d="M-100,300 Q300,270 500,330 T900,290 T1300,350" />
              <path d="M-100,450 Q250,420 450,480 T850,440 T1300,500" />
            </g>
            <g stroke="url(#flow-bg-grad-2)" strokeWidth="0.8"
              style={animated ? { animation: 'flow-drift-2 25s ease-in-out infinite', willChange: 'transform' } : undefined}>
              <path d="M-100,200 Q150,230 350,170 T750,230 T1300,190" />
              <path d="M-100,380 Q200,350 400,410 T800,370 T1300,430" />
              <path d="M-100,550 Q180,580 380,520 T780,580 T1300,540" />
            </g>
            <g stroke="url(#flow-bg-grad-1)" strokeWidth="0.5"
              style={animated ? { animation: 'flow-drift-3 30s ease-in-out infinite', willChange: 'transform' } : undefined}>
              <path d="M-100,100 Q200,80 400,120 T800,100 T1300,140" />
              <path d="M-100,250 Q250,280 450,220 T850,280 T1300,240" />
              <path d="M-100,600 Q200,620 400,580 T800,620 T1300,600" />
              <path d="M-100,700 Q250,680 450,720 T850,690 T1300,730" />
            </g>
          </svg>
        )}
      </div>
    );
  }
);

FlowBackground.displayName = 'FlowBackground';
