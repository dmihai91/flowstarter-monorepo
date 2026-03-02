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

const bgByVariant = {
  default: 'bg-white/85 dark:bg-white/[0.04]',
  elevated: 'bg-white/92 dark:bg-white/[0.06]',
  subtle: 'bg-white/70 dark:bg-white/[0.02]',
} as const;

const shadowByVariant = {
  default:
    'shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.1)_inset]',
  elevated:
    'shadow-[0_8px_32px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.9)_inset] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.1)_inset]',
  subtle:
    'shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.1)_inset]',
} as const;

const hoverClasses = [
  'hover:-translate-y-[2px]',
  'hover:shadow-[0_12px_40px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.9)_inset]',
  'hover:border-purple-500/20',
  'dark:hover:shadow-[0_12px_40px_rgba(124,58,237,0.15),0_1px_0_rgba(255,255,255,0.1)_inset]',
  'dark:hover:border-purple-500/30',
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
      // Base structure
      'group relative overflow-hidden rounded-2xl',
      'px-6 py-5',
      // Glassmorphism
      bgByVariant[variant],
      'backdrop-blur-2xl',
      'border border-white/20 dark:border-white/10',
      // Shadow
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
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/[0.02] group-hover:to-blue-500/[0.02] transition-all duration-300 rounded-2xl" />
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
