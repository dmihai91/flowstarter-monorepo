'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

interface ActionCardProps {
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  icon: LucideIcon;
  className?: string;
  badge?: string;
  iconBg?: string;
  elevated?: boolean; // booking banner elevation
}

export function ActionCard({
  title,
  description,
  href,
  onClick,
  icon: Icon,
  className,
  badge,
  iconBg = 'bg-gradient-to-br from-[var(--purple)] to-blue-600',
  elevated = false,
}: ActionCardProps) {
  const Tag = href ? 'a' : 'div';
  const interactiveProps = href
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : onClick
    ? { onClick, role: 'button' as const, tabIndex: 0 }
    : {};

  const inner = (
    <div
      className={cn(
        'relative flex items-center gap-4 p-4 rounded-xl h-full cursor-pointer group transition-all duration-300',
        elevated
          ? 'bg-white/[0.07] dark:bg-white/[0.07]'
          : 'bg-white/[0.04] dark:bg-white/[0.04] hover:bg-white/[0.06]'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white transition-transform duration-300 group-hover:scale-105',
          iconBg,
          elevated && 'shadow-lg shadow-[var(--purple)]/30'
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-semibold text-white leading-tight">
            {title}
          </h3>
          {elevated && (
            <span className="flex items-center gap-1 text-[0.6rem] font-semibold text-[var(--purple)] bg-[var(--purple)]/10 px-1.5 py-0.5 rounded-full">
              <span className="w-1 h-1 rounded-full bg-[var(--purple)] animate-pulse" />
              Recommended
            </span>
          )}
          {badge && (
            <span className="text-[0.6rem] font-medium text-[var(--fs-ink-faint)] bg-white/[0.06] px-1.5 py-0.5 rounded-full border border-white/10">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--fs-ink-faint)] leading-relaxed">{description}</p>
        {elevated && (
          <p className="text-xs text-[var(--fs-ink-faint)] mt-1">
            First step to getting your site live
          </p>
        )}
      </div>

      <ChevronRight
        className={cn(
          'w-4 h-4 flex-shrink-0 transition-all duration-300 group-hover:translate-x-1',
          elevated
            ? 'text-[var(--purple)]'
            : 'text-[var(--fs-ink-faint)] group-hover:text-[var(--fs-ink-dim)]'
        )}
      />
    </div>
  );

  if (elevated) {
    return (
      <div
        className={cn(
          'p-[1px] rounded-xl bg-gradient-to-r from-[var(--purple)] via-blue-500 to-cyan-500 shadow-[0_4px_24px_rgba(77,93,217,0.25)]',
          className
        )}
      >
        <Tag
          {...interactiveProps}
          className="block rounded-[calc(12px-1px)] overflow-hidden"
        >
          {inner}
        </Tag>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.06] overflow-hidden',
        className
      )}
    >
      <Tag {...interactiveProps} className="block h-full">
        {inner}
      </Tag>
    </div>
  );
}

export default ActionCard;
