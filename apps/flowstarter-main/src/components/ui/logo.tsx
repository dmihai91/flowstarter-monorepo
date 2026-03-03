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
  const id = useId();
  return (
    <div className={cn(iconSizes[size!], 'relative flex-shrink-0', className)}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--purple, #4D5DD9)" />
            <stop offset="0.5" stopColor="#7C3AED" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id={`${id}-flow`} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="40%" stopColor="rgba(255,255,255,1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
          </linearGradient>
        </defs>
        {/* Background: rounded square with premium gradient */}
        <rect width="40" height="40" rx="11" fill={`url(#${id}-bg)`} />
        {/* Subtle inner glow */}
        <rect x="1" y="1" width="38" height="38" rx="10" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        {/* Main flow line — the "F" stroke that flows upward like a launch */}
        <path
          d="M10 28 C14 28, 16 20, 20 20 S26 12, 30 12"
          stroke={`url(#${id}-flow)`}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Secondary flow — parallel momentum line */}
        <path
          d="M10 22 C14 22, 17 16, 21 16 S27 10, 30 10"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Spark dot — the "starter" at the peak */}
        <circle cx="30" cy="11" r="2" fill="white" opacity="0.9" />
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
          Flow<span className="bg-gradient-to-r from-[var(--purple,#4D5DD9)] to-cyan-500 bg-clip-text text-transparent">starter</span>
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
