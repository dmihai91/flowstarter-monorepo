import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground flex h-8 w-full min-w-0 rounded-lg border px-2.5 py-1 text-sm shadow-sm transition-[color,box-shadow,border-color,background-color] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-gray-100',
        // Light mode - solid white
        'bg-white border-gray-300/90 hover:border-gray-400 focus:border-[var(--purple)]/70 focus-visible:border-[var(--purple)]/50 focus-visible:ring-1 focus-visible:ring-[var(--purple)]/20',
        // Dark mode - glassmorphism with white focus
        'dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/15 dark:hover:border-white/25 dark:focus-visible:ring-white/20 dark:focus-visible:border-white/40 dark:focus:border-white/40',
        'w-full aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        'focus:shadow-none focus-visible:shadow-none',
        className
      )}
      {...props}
    />
  );
}

export { Input };
