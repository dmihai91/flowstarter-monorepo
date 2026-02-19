'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface QuickLinkCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function QuickLinkCard({
  icon: Icon,
  title,
  description,
  gradientFrom,
  gradientTo,
  href,
  onClick,
  className,
}: QuickLinkCardProps) {
  return (
    <GlassCard
      href={href}
      onClick={onClick}
      as={href ? 'link' : onClick ? 'button' : 'div'}
      className={cn(
        'group relative flex flex-col items-center text-center',
        className
      )}
    >
      <div className="w-full flex justify-center mb-3 sm:mb-4">
        <div className="relative rounded-2xl p-4 transition-transform duration-300 sm:group-hover:scale-105">
          <div
            className={cn(
              'absolute inset-0 rounded-2xl bg-gradient-to-br',
              gradientFrom,
              gradientTo
            )}
          />
          <Icon className="relative h-8 w-8 text-white" />
        </div>
      </div>
      <h3
        className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2"
        style={{ color: 'var(--copy-headlines)' }}
      >
        {title}
      </h3>
      <p className="text-xs sm:text-sm" style={{ color: 'var(--copy-body)' }}>
        {description}
      </p>
    </GlassCard>
  );
}
