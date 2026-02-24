'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ReactNode, forwardRef } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  as?: 'div' | 'button' | 'link';
  style?: React.CSSProperties;
  variant?: 'default' | 'elevated';
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, onClick, href, as = 'div', style, variant = 'default' }, ref) => {
    const baseClasses = cn(
      // Base structure
      'group relative overflow-hidden rounded-2xl',
      'px-6 py-5',
      // Glassmorphism effect
      variant === 'elevated' 
        ? 'bg-white/80 dark:bg-white/[0.06]'
        : 'bg-white/60 dark:bg-white/[0.03]',
      'backdrop-blur-xl backdrop-saturate-150',
      'border border-gray-200/80 dark:border-white/10',
      // Shadow
      variant === 'elevated'
        ? 'shadow-[0_8px_32px_rgba(77,93,217,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
        : 'shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]',
      // Hover effects
      'transition-all duration-300 ease-out',
      'hover:-translate-y-0.5',
      'hover:shadow-[0_12px_40px_rgba(77,93,217,0.1)] dark:hover:shadow-[0_12px_40px_rgba(77,93,217,0.15)]',
      'hover:border-[var(--purple)]/20 dark:hover:border-[var(--purple)]/30',
      // Active state
      'active:scale-[0.99]',
      // Flex layout
      'flex flex-col'
    );

    const content = (
      <div
        ref={ref}
        className={cn(baseClasses, className)}
        onClick={onClick}
        style={style}
      >
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--purple)]/0 to-[var(--blue)]/0 group-hover:from-[var(--purple)]/[0.02] group-hover:to-[var(--blue)]/[0.02] transition-all duration-300 rounded-2xl" />
        <div className="relative z-10 flex flex-col gap-[inherit] h-full">
          {children}
        </div>
      </div>
    );

    if (as === 'link' && href) {
      return (
        <Link href={href} className="block h-full">
          {content}
        </Link>
      );
    }

    if (as === 'button' || onClick) {
      return (
        <button
          onClick={onClick}
          className="block w-full text-left h-full"
          type="button"
        >
          {content}
        </button>
      );
    }

    return content;
  }
);

GlassCard.displayName = 'GlassCard';
