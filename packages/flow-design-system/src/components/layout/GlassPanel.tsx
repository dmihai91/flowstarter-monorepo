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
  glass: [
    // Light mode — 3D glassmorphism
    'shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04),',
    '1px_1px_0_rgba(0,0,0,0.03)_inset,',    // bottom-right inner edge (depth)
    '-1px_-1px_0_rgba(255,255,255,1)_inset,', // top-left inner highlight (3D light)
    '0_1px_0_rgba(255,255,255,0.9)_inset]',   // top edge highlight
    // Dark mode — 3D glassmorphism
    'dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.2),',
    '1px_1px_0_rgba(0,0,0,0.3)_inset,',       // bottom-right inner edge (depth)
    '-1px_-1px_0_rgba(255,255,255,0.08)_inset,', // top-left inner highlight (3D light)
    '0_1px_0_rgba(255,255,255,0.06)_inset]',    // top edge highlight
  ].join(''),
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
  bg-white/55 dark:bg-white/[0.03]
  border-t border-l border-white/40 dark:border-white/[0.08]
  border-b border-r border-black/[0.04] dark:border-black/[0.2]
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
