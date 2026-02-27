import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-10 w-full rounded-lg px-2.5 py-2 text-sm shadow-none transition-[color,box-shadow,border-color,background-color] outline-none disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-gray-100',
        'bg-transparent',
        'border-none focus:border-none focus:ring-0 focus:shadow-none focus-visible:shadow-none focus:outline-none focus-visible:outline-none focus-visible:ring-0',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
