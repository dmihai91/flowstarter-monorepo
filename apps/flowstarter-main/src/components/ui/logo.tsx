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
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#A855F7' }} />
              <stop offset="50%" style={{ stopColor: '#8B5CF6' }} />
              <stop offset="100%" style={{ stopColor: '#3B82F6' }} />
            </linearGradient>
          </defs>
          
          {/* Background rounded square */}
          <rect x="15" y="15" width="170" height="170" rx="42" fill="url(#logoGradient)" />
          
          {/* Abstract flow symbol - rising energy */}
          <g transform="translate(100, 100)">
            {/* Central rising flow */}
            <path 
              d="M0 45 Q-25 20, 0 -10 Q25 -40, 0 -55" 
              stroke="white" 
              strokeWidth="18" 
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Left accent flow */}
            <path 
              d="M-30 35 Q-40 10, -25 -15" 
              stroke="white" 
              strokeWidth="10" 
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
            />
            
            {/* Right accent flow */}
            <path 
              d="M30 35 Q40 10, 25 -15" 
              stroke="white" 
              strokeWidth="10" 
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
            />
          </g>
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
