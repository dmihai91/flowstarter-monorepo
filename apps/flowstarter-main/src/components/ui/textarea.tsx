import * as React from 'react';

import { cn } from '@/lib/utils';

interface TextareaProps extends React.ComponentProps<'textarea'> {
  variant?: 'default' | 'borderless';
}

function Textarea({ className, variant = 'default', ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base styles
        'placeholder:text-muted-foreground',
        'flex field-sizing-content min-h-10 w-full text-sm',
        'transition-[color,box-shadow,border-color,background-color] outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'text-gray-900 dark:text-gray-100',
        // Variant styles
        variant === 'default' && [
          'rounded-xl px-3 py-2.5',
          'bg-white dark:bg-white/5',
          'border border-gray-200 dark:border-white/10',
          'focus:border-[var(--purple)] focus:ring-2 focus:ring-[var(--purple)]/20',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        ],
        variant === 'borderless' && [
          'rounded-lg px-2.5 py-2',
          'bg-transparent',
          'border-none',
          'focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none',
          'shadow-none',
        ],
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
