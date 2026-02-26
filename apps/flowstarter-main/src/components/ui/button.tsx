import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 box-border leading-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-gray-900 text-white hover:bg-gray-700 hover:shadow-xl hover:scale-[1.02] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-300 dark:hover:shadow-xl dark:hover:scale-[1.02] disabled:bg-gray-800 disabled:text-white/75 disabled:shadow-none',
        brand:
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md dark:text-primary-foreground dark:bg-primary dark:hover:brightness-110 dark:hover:shadow-xl disabled:bg-primary/70 disabled:text-primary-foreground/80 disabled:shadow-none',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md dark:text-destructive-foreground dark:hover:bg-destructive/80',
        success:
          'bg-success text-success-foreground hover:bg-success/90 hover:shadow-md dark:text-success-foreground dark:hover:bg-success/80',
        outline:
          'border border-input bg-background hover:bg-gray-100 hover:border-gray-400 dark:text-foreground dark:hover:bg-[var(--dashboard-card-hover)] dark:hover:border-gray-500 text-black dark:text-white focus-visible:ring-0 focus-visible:ring-offset-0',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:shadow-md text-white dark:text-black dark:hover:bg-secondary/80',
        ghost:
          'text-foreground hover:bg-gray-100 dark:hover:bg-[var(--dashboard-card-hover)]',
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary/90',
        transparent: 'bg-transparent hover:bg-transparent',
        accent:
          'bg-[var(--purple)] text-white hover:bg-[var(--purple)]/90 hover:shadow-lg hover:scale-[1.02] dark:hover:brightness-110',
      },
      size: {
        default: '!h-10 px-4 rounded-lg',
        xs: '!h-8 px-3 rounded-md',
        sm: '!h-9 px-3 rounded-lg',
        md: '!h-10 px-4 rounded-lg',
        lg: '!h-11 px-6 rounded-lg',
        xl: '!h-12 px-8 rounded-lg',
        icon: 'h-10 w-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
