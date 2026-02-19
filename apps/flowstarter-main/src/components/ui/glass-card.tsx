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
    const baseClasses =
      'glass-3d group relative overflow-hidden rounded-[16px] px-4 py-3 sm:px-5 md:px-6 lg:px-[24px] sm:py-3.5 md:py-4 lg:py-[16px] transition-all duration-500 active:scale-[0.98] sm:hover:-translate-y-1 sm:hover:shadow-[0_20px_60px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-2px_8px_rgba(0,0,0,0.06)] bg-white/30 dark:bg-[rgba(58,58,74,0.25)] backdrop-blur-xl border border-white/60 dark:border-white/15 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_2px_6px_rgba(0,0,0,0.08)]';

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
