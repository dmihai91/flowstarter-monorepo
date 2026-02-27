import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        'flex field-sizing-content min-h-10 w-full rounded-xl px-3 py-2.5 text-sm',
        'transition-[color,box-shadow,border-color,background-color] outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'text-gray-900 dark:text-gray-100',
        'bg-white dark:bg-white/5',
        'border border-gray-200 dark:border-white/10',
        'focus:border-[var(--purple)] focus:ring-2 focus:ring-[var(--purple)]/20',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
