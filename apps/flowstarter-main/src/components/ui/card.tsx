import * as React from 'react';

import { cn } from '@/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        // Glassy dashboard-style card to match Figma
        // Responsive padding: smaller on mobile, standard on tablet+
        'text-card-foreground flex flex-col items-start gap-3 sm:gap-4 md:gap-5 rounded-xl sm:rounded-[16px] border border-white/40 dark:border-white/12 bg-[rgba(243,243,243,0.30)] dark:bg-[rgba(58,58,74,0.30)] px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4 flex-1 self-stretch backdrop-blur-xl glass-shadow-card',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 sm:gap-1.5 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4 sm:[.border-b]:pb-5 md:[.border-b]:pb-6',
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        'leading-tight sm:leading-none font-semibold text-sm sm:text-base',
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-xs sm:text-sm', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('w-full', className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex items-center [.border-t]:pt-4 sm:[.border-t]:pt-5 md:[.border-t]:pt-6',
        className
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
