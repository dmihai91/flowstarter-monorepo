import { forwardRef, type HTMLAttributes } from 'react';

export interface AmbientGlowProps extends HTMLAttributes<HTMLDivElement> {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  color?: 'purple' | 'cyan' | 'violet' | 'warm';
  size?: number;
  blur?: number;
  opacity?: number;
}

const positionStyles = {
  'top-left': '-top-[200px] -left-[100px]',
  'top-right': '-top-[200px] -right-[100px]',
  'bottom-left': '-bottom-[100px] -left-[100px]',
  'bottom-right': '-bottom-[150px] -right-[100px]',
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
};

const colorValues = {
  purple: 'rgba(99, 102, 241, 0.4)',
  cyan: 'rgba(6, 182, 212, 0.35)',
  violet: 'rgba(139, 92, 246, 0.3)',
  warm: 'rgba(251, 191, 36, 0.25)',
};

export const AmbientGlow = forwardRef<HTMLDivElement, AmbientGlowProps>(
  (
    {
      position = 'top-left',
      color = 'purple',
      size = 500,
      blur = 0,
      opacity,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const defaultOpacity = color === 'warm' ? 0.2 : 0.3;
    const resolvedOpacity = opacity ?? defaultOpacity;

    return (
      <div
        ref={ref}
        className={`absolute rounded-full pointer-events-none ${positionStyles[position]} ${className}`}
        style={{
          width: size,
          height: size,
          opacity: resolvedOpacity,
          filter: blur ? `blur(${blur}px)` : undefined,
          background: `radial-gradient(ellipse, ${colorValues[color]} 0%, transparent 70%)`,
          ...style,
        }}
        {...props}
      />
    );
  }
);

AmbientGlow.displayName = 'AmbientGlow';
