'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn(sizes[size], 'relative flex-shrink-0')}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          
          {/* Rounded square background */}
          <rect width="40" height="40" rx="10" fill="url(#logoGrad)" />
          
          {/* Clean "F" with flow curve */}
          <path 
            d="M12 10h16v4H16v5h10v4H16v9h-4V10z" 
            fill="white"
          />
          
          {/* Subtle flow accent - single smooth curve */}
          <path 
            d="M28 24c0 4-3 7-7 7" 
            stroke="white" 
            strokeWidth="2.5" 
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
        </svg>
      </div>
      
      {showText && (
        <span className="font-semibold text-gray-900 dark:text-white text-lg">
          Flowstarter
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ size = 'md', className }: Omit<LogoProps, 'showText'>) {
  return <Logo size={size} showText={false} className={className} />;
}
