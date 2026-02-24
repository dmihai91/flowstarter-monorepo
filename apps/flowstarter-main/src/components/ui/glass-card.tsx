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
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, onClick, href, as = 'div', style }, ref) => {
    const baseClasses = cn(
      // Base structure
      'group relative overflow-hidden rounded-2xl',
      'px-5 py-4 sm:px-6 sm:py-5',
      // Glassmorphism effect
      'bg-white/70 dark:bg-white/[0.04]',
      'backdrop-blur-xl backdrop-saturate-150',
      'border border-white/60 dark:border-white/10',
      // Shadow - refined
      'shadow-[0_4px_24px_rgba(0,0,0,0.04)]',
      'dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]',
      // Hover effects
      'transition-all duration-300 ease-out',
      'hover:-translate-y-1',
      'hover:shadow-[0_12px_40px_rgba(124,58,237,0.08)]',
      'dark:hover:shadow-[0_12px_40px_rgba(124,58,237,0.15)]',
      'hover:border-[#7C3AED]/20 dark:hover:border-[#7C3AED]/30',
      // Active state
      'active:scale-[0.98]',
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
