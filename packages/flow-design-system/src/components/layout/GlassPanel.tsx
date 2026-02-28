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
  glass: `
    shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)_inset,0_-1px_0_rgba(0,0,0,0.02)_inset]
    dark:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset]
  `,
};

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

const baseStyles = `
  rounded-2xl
  backdrop-blur-2xl backdrop-saturate-150
  bg-white/50 dark:bg-white/[0.03]
  border border-white/20 dark:border-white/[0.06]
`;

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ shadow = 'glass', padding = 'md', children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${baseStyles} ${shadowStyles[shadow]} ${paddings[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';
