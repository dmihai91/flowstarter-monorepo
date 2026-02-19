'use client';

import { GlassCard } from '@/components/ui/glass-card';
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
  iconBg?: string; // gradient background for icon
}

export function ActionCard({
  title,
  description,
  href,
  onClick,
  icon: Icon,
  className,
  badge,
  iconBg = 'bg-gradient-to-br from-gray-900 to-gray-800',
}: ActionCardProps) {
  const as = href ? 'link' : onClick ? 'button' : 'div';

  return (
    <GlassCard
      href={href}
      onClick={onClick}
      as={as}
      className={cn('gap-0 h-full', className)}
    >
      {/* Icon on the left */}
      <div
        className={cn(
          'absolute left-3 sm:left-4 md:left-3 top-1/2 -translate-y-1/2 rounded-lg text-white p-1.5 sm:p-2 transition-transform duration-300 sm:group-hover:scale-105 z-20',
          iconBg
        )}
      >
        <Icon className="h-4 w-4 sm:h-4 md:h-5 sm:w-4 md:w-5" />
      </div>

      {/* Text content */}
      <div className="relative z-10 pl-16 sm:pl-16 md:pl-18 pr-8 sm:pr-10 md:pr-12 h-full md:flex md:items-center">
        <div className="space-y-0.5 sm:space-y-1 md:space-y-1.5">
          <h3
            className="text-md md:text-base font-semibold leading-tight"
            style={{ color: 'var(--copy-headlines)' }}
          >
            {title}
          </h3>
          <p
            className="text-sm sm:text-md leading-relaxed"
            style={{ color: 'var(--copy-body)' }}
          >
            {description}
          </p>
          {badge && (
            <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-[#3a3a42] px-1.5 py-0.5 sm:px-2 sm:py-1 text-[9px] sm:text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200/50 dark:border-gray-600/50">
              {badge}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="pointer-events-none absolute right-3 sm:right-4 md:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 sm:group-hover:text-gray-600 dark:text-gray-400 dark:sm:group-hover:text-gray-200 transition-all duration-300 sm:group-hover:translate-x-1" />
    </GlassCard>
  );
}

export default ActionCard;
