'use client';

import { cn } from '@/lib/utils';
import { useId } from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  href?: string;
}

const iconSizes = {
  sm: 'w-7 h-7',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

const textSizes = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

function LogoMark({ size = 'md', className }: { size?: LogoProps['size']; className?: string }) {
  const gradientId = useId();
  return (
    <div className={cn(iconSizes[size!], 'relative flex-shrink-0', className)}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id={`${gradientId}-lines`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="50%" stopColor="rgba(255,255,255,1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.5)" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill={`url(#${gradientId})`} />
        <path
          d="M8 26 Q14 20, 20 23 Q26 26, 32 20"
          stroke={`url(#${gradientId}-lines)`}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M8 20 Q14 14, 20 17 Q26 20, 32 14"
          stroke={`url(#${gradientId}-lines)`}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
        />
      </svg>
    </div>
  );
}

export function Logo({ size = 'md', showText = true, className, href }: LogoProps) {
  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {showText && (
        <span className={cn('font-bold tracking-tight text-gray-900 dark:text-white', textSizes[size!])}>
          Flowstarter
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="flex items-center">{content}</Link>;
  }

  return content;
}

export function LogoIcon({ size = 'md', className }: Omit<LogoProps, 'showText' | 'href'>) {
  return <LogoMark size={size} className={className} />;
}
