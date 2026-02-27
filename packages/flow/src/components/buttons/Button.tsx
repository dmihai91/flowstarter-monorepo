import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const baseStyles = `
  inline-flex items-center justify-center gap-2
  font-medium rounded-xl transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
`;

const variants = {
  primary: `
    bg-zinc-900 dark:bg-white
    text-white dark:text-zinc-900
    hover:bg-zinc-800 dark:hover:bg-zinc-100
    focus:ring-zinc-500
  `,
  secondary: `
    bg-white dark:bg-zinc-800
    text-zinc-900 dark:text-white
    border border-zinc-200 dark:border-zinc-700
    hover:bg-zinc-50 dark:hover:bg-zinc-700
    focus:ring-zinc-500
  `,
  ghost: `
    bg-transparent
    text-zinc-700 dark:text-zinc-300
    hover:bg-zinc-100 dark:hover:bg-zinc-800
    focus:ring-zinc-500
  `,
  danger: `
    bg-red-500
    text-white
    hover:bg-red-600
    focus:ring-red-500
  `,
  gradient: `
    bg-gradient-to-r from-purple-500 to-cyan-500
    text-white
    hover:from-purple-600 hover:to-cyan-600
    focus:ring-purple-500
  `,
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    icon,
    iconPosition = 'left',
    children, 
    className = '',
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;
    
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : icon && iconPosition === 'left' ? (
          icon
        ) : null}
        {children}
        {!loading && icon && iconPosition === 'right' ? icon : null}
      </button>
    );
  }
);

Button.displayName = 'Button';
