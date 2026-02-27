import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled' | 'ghost';
  inputSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  label?: string;
  helperText?: string;
  errorText?: string;
}

const baseStyles = `
  w-full rounded-xl transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-offset-0
  disabled:opacity-50 disabled:cursor-not-allowed
  placeholder:text-zinc-400 dark:placeholder:text-zinc-500
`;

const variants = {
  default: `
    bg-white dark:bg-zinc-900
    border border-zinc-300 dark:border-zinc-700
    text-zinc-900 dark:text-white
    focus:border-zinc-500 dark:focus:border-zinc-500
    focus:ring-zinc-500/20
  `,
  filled: `
    bg-zinc-100 dark:bg-zinc-800
    border border-transparent
    text-zinc-900 dark:text-white
    focus:bg-white dark:focus:bg-zinc-900
    focus:border-zinc-300 dark:focus:border-zinc-700
    focus:ring-zinc-500/20
  `,
  ghost: `
    bg-transparent
    border border-transparent
    text-zinc-900 dark:text-white
    hover:bg-zinc-100 dark:hover:bg-zinc-800
    focus:bg-zinc-100 dark:focus:bg-zinc-800
    focus:ring-zinc-500/20
  `,
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-4 py-3 text-base',
};

const errorStyles = `
  border-red-500 dark:border-red-500
  focus:border-red-500 dark:focus:border-red-500
  focus:ring-red-500/20
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    variant = 'default', 
    inputSize = 'md',
    error = false,
    icon,
    iconPosition = 'left',
    label,
    helperText,
    errorText,
    className = '',
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`;
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={`
              ${baseStyles}
              ${variants[variant]}
              ${sizes[inputSize]}
              ${error ? errorStyles : ''}
              ${icon && iconPosition === 'left' ? 'pl-10' : ''}
              ${icon && iconPosition === 'right' ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
              {icon}
            </div>
          )}
        </div>
        
        {(helperText || errorText) && (
          <p className={`mt-1.5 text-sm ${error ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
            {error ? errorText : helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
