'use client';

import { NewProjectDropdown } from '@/components/NewProjectDropdown';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

interface ActionCardWithDropdownProps {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
  iconBg?: string;
}

export function ActionCardWithDropdown({
  title,
  description,
  icon: Icon,
  className,
  iconBg = 'bg-gradient-to-br from-blue-500 to-indigo-500',
}: ActionCardWithDropdownProps) {
  const cardContent = (
    <GlassCard className={cn('gap-0 h-full cursor-pointer', className)}>
      {/* Icon on the left */}
      <div
        className={cn(
          'absolute left-3 sm:left-4 md:left-3 top-1/2 -translate-y-1/2 rounded-lg text-white p-1.5 sm:p-2 transition-transform duration-300 group-hover:scale-105 z-20',
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
        </div>
      </div>
      <ChevronRight className="pointer-events-none absolute right-3 sm:right-4 md:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-200 transition-all duration-300 group-hover:translate-x-1" />
    </GlassCard>
  );

  return (
    <NewProjectDropdown
      variant="card"
      className="h-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white rounded-xl"
      align="start"
    >
      {cardContent}
    </NewProjectDropdown>
  );
}
