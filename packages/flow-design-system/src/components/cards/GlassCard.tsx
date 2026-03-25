import React, { forwardRef, type ReactNode, type CSSProperties, type HTMLAttributes } from 'react';

export interface GlassCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
  /** Visual weight variant */
  variant?: 'default' | 'elevated' | 'subtle';
  /** Disable hover lift & glow effects */
  noHover?: boolean;
  /** Render as a link (wraps in <a>) */
  href?: string;
  /** Render as a button (wraps in <button>) */
  as?: 'div' | 'button' | 'link';
  style?: CSSProperties;
}

// ── Liquid-glass tokens ────────────────────────────────────────────────────────
// Light: visible card with gray border, high-opacity white bg, soft inset glow
// Dark: subtle translucent panel, very faint borders, low-key inset highlight

const bgByVariant = {
  default: 'bg-white/95 dark:bg-white/[0.05]',
  elevated: 'bg-white/95 dark:bg-white/[0.06]',
  subtle: 'bg-white/80 dark:bg-white/[0.03]',
} as const;

const borderByVariant = {
  default: 'border border-gray-200/80 dark:border-white/[0.06]',
  elevated: 'border border-gray-200/80 dark:border-white/[0.07]',
  subtle: 'border border-gray-200/50 dark:border-white/[0.05]',
} as const;

const shadowByVariant = {
  default: [
    'shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset]',
    'dark:shadow-[0_8px_32px_rgba(0,0,0,0.25),0_1px_0_rgba(255,255,255,0.06)_inset]',
  ].join(' '),
  elevated: [
    'shadow-[0_12px_40px_rgba(0,0,0,0.10),0_1px_0_rgba(255,255,255,0.9)_inset]',
    'dark:shadow-[0_12px_40px_rgba(0,0,0,0.30),0_1px_0_rgba(255,255,255,0.08)_inset]',
  ].join(' '),
  subtle: [
    'shadow-[0_4px_20px_rgba(0,0,0,0.05),0_1px_0_rgba(255,255,255,0.9)_inset]',
    'dark:shadow-[0_4px_20px_rgba(0,0,0,0.20),0_1px_0_rgba(255,255,255,0.04)_inset]',
  ].join(' '),
} as const;

const hoverClasses = [
  'hover:-translate-y-[2px]',
  'hover:shadow-[0_16px_48px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.9)_inset]',
  'hover:border-gray-300/80',
  'dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.08)_inset]',
  'dark:hover:border-white/[0.10]',
].join(' ');

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      className = '',
      onClick,
      href,
      as = 'div',
      style,
      variant = 'default',
      noHover = false,
      ...props
    },
    ref,
  ) => {
    const classes = [
      // Structure
      'group relative overflow-hidden rounded-[28px]',
      'px-6 py-5',
      // Glassmorphism
      bgByVariant[variant],
      'backdrop-blur-2xl backdrop-saturate-150',
      borderByVariant[variant],
      // Shadow + 3D inset
      shadowByVariant[variant],
      // Transitions
      'transition-all duration-300 ease-out',
      // Hover
      !noHover ? hoverClasses : '',
      // Active
      'active:scale-[0.99]',
      // Layout
      'flex flex-col',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const content = (
      <div ref={ref} className={classes} onClick={onClick} style={style} {...props}>
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/[0.02] group-hover:to-blue-500/[0.02] transition-all duration-300 rounded-[28px]" />
        <div className="relative z-10 flex flex-col gap-[inherit] h-full">{children}</div>
      </div>
    );

    if (as === 'link' && href) {
      return (
        <a href={href} className="block h-full">
          {content}
        </a>
      );
    }

    if (as === 'button' || onClick) {
      return (
        <button onClick={onClick as unknown as React.MouseEventHandler<HTMLButtonElement>} className="block w-full text-left h-full" type="button">
          {content}
        </button>
      );
    }

    return content;
  },
);

GlassCard.displayName = 'GlassCard';
