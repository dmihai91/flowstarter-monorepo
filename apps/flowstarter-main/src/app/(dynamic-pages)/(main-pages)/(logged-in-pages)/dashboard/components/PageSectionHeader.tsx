import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface PageSectionHeaderProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  uppercaseTitle?: boolean;
  className?: string;
}

export function PageSectionHeader({
  title,
  subtitle,
  uppercaseTitle = false,
  className,
}: PageSectionHeaderProps) {
  return (
    <div className={cn('mb-5', className)}>
      <h2
        className={cn(
          'text-xl sm:text-2xl font-medium text-gray-900 dark:text-gray-100 tracking-tight',
          uppercaseTitle && 'uppercase'
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-600 dark:text-gray-400 mt-1.5 text-sm">
          {subtitle}
        </p>
      )}
    </div>
  );
}
