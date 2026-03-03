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
        </defs>
        {/* Background */}
        <rect width="40" height="40" rx="11" fill={`url(#${id}-bg)`} />
        <rect x="1" y="1" width="38" height="38" rx="10" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        {/* Stylized "F" — vertical stem + two horizontal arms with flowing curves */}
        {/* Vertical stem */}
        <path
          d="M14 10 L14 30"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Top arm — flows right with a gentle wave */}
        <path
          d="M14 12 C18 12, 22 10, 27 12"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Middle arm — shorter, flows right */}
        <path
          d="M14 20 C17 20, 20 18, 24 20"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Accent: small flowing trail off the bottom of the stem */}
        <path
          d="M14 30 C18 30, 22 28, 28 26"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
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
