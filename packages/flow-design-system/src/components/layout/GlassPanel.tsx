import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  shadow?: 'none' | 'subtle' | 'elevated' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const shadowStyles = {
  none: '',
  subtle: 'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]',
  elevated: 'shadow-[0_4px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06)]',
  glass: 'shadow-[var(--glass-shadow)]',
};

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ shadow = 'glass', padding = 'md', children, className = '', style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-2xl backdrop-blur-2xl backdrop-saturate-150 ${shadowStyles[shadow]} ${paddings[padding]} ${className}`}
        style={{
          backgroundColor: 'color-mix(in srgb, var(--glass-surface) 80%, transparent)',
          borderTop: '1px solid var(--glass-border-highlight)',
          borderLeft: '1px solid var(--glass-border-highlight)',
          borderBottom: '1px solid var(--glass-border-shadow)',
          borderRight: '1px solid var(--glass-border-shadow)',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';
