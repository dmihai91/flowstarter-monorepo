'use client';

import { RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SelectionCardProps {
  value: string;
  title: string;
  description: string;
  icon?: ReactNode;
  isSelected?: boolean;
  className?: string;
}

export function SelectionCard({
  value,
  title,
  description,
  icon,
  isSelected = false,
  className,
}: SelectionCardProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-[12px] border-[1.5px] border-solid pl-[24px] pr-[20px] py-[16px] cursor-pointer transition-all duration-200',
        'bg-white dark:bg-[rgba(75,75,94,0.3)]',
        isSelected
          ? 'border-gray-900 dark:border-white'
          : 'border-gray-300 dark:border-[rgba(255,255,255,0.1)] hover:border-gray-400 dark:hover:border-white/50',
        className
      )}
    >
      <label className="flex items-center justify-between w-full cursor-pointer">
        <div className="flex items-center gap-[20px]">
          {icon && (
            <div className="w-[32px] h-[32px] flex items-center justify-center shrink-0">
              <div className="[&>svg]:w-[32px] [&>svg]:h-[32px] [&>svg]:text-gray-900 dark:[&>svg]:text-white">
                {icon}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-[6px]">
            <div className="text-base font-medium leading-[1.3] text-gray-900 dark:text-white">
              {title}
            </div>
            <div className="text-sm font-normal leading-[1.4] text-gray-600 dark:text-gray-400">
              {description}
            </div>
          </div>
        </div>
        <RadioGroupItem value={value} className="shrink-0" />
      </label>
    </div>
  );
}
