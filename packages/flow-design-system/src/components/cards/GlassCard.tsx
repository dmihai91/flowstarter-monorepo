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
// All colors resolved from --fs-* design tokens (brand.css).
// bg / border / shadow are applied via inline style so they respond to
// both .dark class and data-theme="dark" without needing Tailwind dark: prefixes.

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
    const tokenStyle: CSSProperties = {
      background: 'var(--fs-glass-bg)',
      borderColor: 'var(--fs-glass-edge)',
      boxShadow: 'var(--fs-card-shadow)',
      borderRadius: 'var(--fs-radius-2xl)',
      ...style,
    };

    const classes = [
      // Structure
      'group relative overflow-hidden',
      'px-6 py-5',
      // Glassmorphism
      'backdrop-blur-2xl backdrop-saturate-150',
      'border',
      variant === 'elevated'
        ? 'shadow-[var(--fs-shadow-xl)]'
        : variant === 'subtle'
          ? 'shadow-none'
          : '',
      // Transitions
      'transition-all duration-300 ease-out',
      // Hover
      !noHover ? 'hover:-translate-y-[2px] hover:shadow-[var(--fs-shadow-xl)] active:translate-y-0' : '',
      // Layout
      'flex flex-col',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const content = (
      <div ref={ref} className={classes} onClick={onClick} style={tokenStyle} {...props}>
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--fs-accent)]/0 to-[var(--fs-accent)]/0 group-hover:from-[var(--fs-accent)]/[0.02] group-hover:to-transparent transition-all duration-300 rounded-[var(--fs-radius-2xl)]" />
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
