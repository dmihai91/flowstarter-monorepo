import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { twMerge } from 'tailwind-merge';

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'destructive'
  | 'success'
  | 'gradient'
  | 'accent'
  | 'brand'
| 'brand-gradient'
  | 'link'
  | 'transparent';

export type ButtonSize = 'default' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  asChild?: boolean;
}

const baseStyles = [
  'inline-flex items-center justify-center gap-2',
  'font-medium rounded-lg transition-all duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  'disabled:opacity-60 disabled:pointer-events-none',
  'cursor-pointer leading-none whitespace-nowrap box-border',
  '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
].join(' ');

const variantStyles: Record<ButtonVariant, string> = {
  default: [
    'bg-gray-900 dark:bg-white',
    'text-white dark:text-gray-900',
    'hover:bg-gray-700 dark:hover:bg-gray-300',
    'hover:shadow-xl hover:scale-[1.02]',
    'focus-visible:ring-gray-500',
  ].join(' '),
  primary: [
    'bg-gray-900 dark:bg-white',
    'text-white dark:text-gray-900',
    'hover:bg-gray-800 dark:hover:bg-gray-100',
    'hover:shadow-xl hover:scale-[1.02]',
    'focus-visible:ring-gray-500',
  ].join(' '),
  secondary: [
    'bg-white dark:bg-zinc-800',
    'text-zinc-900 dark:text-white',
    'border border-zinc-200 dark:border-zinc-700',
    'hover:bg-zinc-50 dark:hover:bg-zinc-700',
    'hover:shadow-md',
    'focus-visible:ring-zinc-500',
  ].join(' '),
  outline: [
    'border border-zinc-200 dark:border-zinc-700',
    'bg-transparent',
    'text-zinc-900 dark:text-white',
    'hover:bg-zinc-100 dark:hover:bg-zinc-800',
    'focus-visible:ring-zinc-500',
  ].join(' '),
  ghost: [
    'bg-transparent',
    'text-zinc-700 dark:text-zinc-300',
    'hover:bg-zinc-100 dark:hover:bg-zinc-800',
    'focus-visible:ring-zinc-500',
  ].join(' '),
  danger: [
    'bg-red-500 text-white',
    'hover:bg-red-600 hover:shadow-md',
    'focus-visible:ring-red-500',
  ].join(' '),
  destructive: [
    'bg-red-500 text-white',
    'hover:bg-red-600 hover:shadow-md',
    'focus-visible:ring-red-500',
  ].join(' '),
  success: [
    'bg-green-500 text-white',
    'hover:bg-green-600 hover:shadow-md',
    'focus-visible:ring-green-500',
  ].join(' '),
  gradient: [
    'bg-gradient-to-r from-purple-500 to-cyan-500',
    'text-white',
    'hover:from-purple-600 hover:to-cyan-600',
    'focus-visible:ring-purple-500',
  ].join(' '),
  accent: [
    'bg-[var(--purple)] text-white',
    'hover:brightness-110',
    'hover:shadow-lg hover:scale-[1.02]',
    'focus-visible:ring-[var(--purple)]',
  ].join(' '),
  'brand-gradient': [
    'bg-gradient-to-r from-[var(--purple)] via-blue-500 to-[var(--purple)]',
    'text-white',
    'hover:shadow-lg hover:shadow-[var(--purple)]/20',
    'hover:scale-[1.02]',
    'focus-visible:ring-[var(--purple)]',
  ].join(' '),
  brand: [
    'bg-[var(--purple)] text-white',
    'hover:brightness-110',
    'hover:shadow-md',
    'focus-visible:ring-[var(--purple)]',
  ].join(' '),
  link: [
    'text-[var(--purple)]',
    'underline-offset-4 hover:underline',
  ].join(' '),
  transparent: 'bg-transparent hover:bg-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-10 px-4 text-sm',
  xs: 'h-8 px-3 text-xs',
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
  xl: 'h-12 px-8 text-base',
  icon: 'h-10 w-10',
};

/**
 * Computes button class names for a given variant + size.
 * Useful when you need the styles without the component (e.g. CVA compat).
 */
export function getButtonStyles(
  variant: ButtonVariant = 'default',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return twMerge(baseStyles, variantStyles[variant], sizeStyles[size], className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'default',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    asChild = false,
    children,
    className = '',
    disabled,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading;
    const classes = getButtonStyles(variant, size, className);
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        disabled={isDisabled}
        className={classes}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : icon && iconPosition === 'left' ? (
          icon
        ) : null}
        {children}
        {!loading && icon && iconPosition === 'right' ? icon : null}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
