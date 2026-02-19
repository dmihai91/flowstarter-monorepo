'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

// Restrict to HTML text elements (avoid SVG tags like <symbol> that cause type mismatch)
type AllowedAs = 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type BaseProps = React.HTMLAttributes<HTMLElement> & {
  as?: AllowedAs;
};

function Title({ className, as: Tag = 'p', ...props }: BaseProps) {
  return (
    <Tag
      className={cn(
        'font-semibold text-[1.32rem] text-white dark:text-black leading-tight',
        className
      )}
      {...props}
    />
  );
}

function Subtitle({ className, as: Tag = 'p', ...props }: BaseProps) {
  return (
    <Tag
      className={cn(
        'text-[0.925rem] text-white dark:text-black mt-1',
        className
      )}
      {...props}
    />
  );
}

export { Subtitle, Title };
