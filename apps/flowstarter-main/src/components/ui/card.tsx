import * as React from 'react';

import { cn } from '@/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        // Layout
        'text-card-foreground flex flex-1 flex-col items-start self-stretch',
        'gap-3 sm:gap-4 md:gap-5 px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4',
        'rounded-xl sm:rounded-2xl',
        // iOS 3D glass — light mode
        'bg-gradient-to-b from-white/85 to-white/60',
        'backdrop-blur-xl backdrop-saturate-[180%]',
        'border border-white/40',
        '[border-top-color:rgba(255,255,255,0.85)]',
        '[box-shadow:inset_0_1.5px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.05),0_4px_24px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.05)]',
        // iOS 3D glass — dark mode
        'dark:bg-gradient-to-b dark:from-white/[0.10] dark:to-white/[0.04]',
        'dark:[border-color:rgba(255,255,255,0.08)] dark:[border-top-color:rgba(255,255,255,0.20)]',
        'dark:[box-shadow:inset_0_1.5px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(0,0,0,0.25),0_4px_24px_rgba(0,0,0,0.25),0_1px_3px_rgba(0,0,0,0.18)]',
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
