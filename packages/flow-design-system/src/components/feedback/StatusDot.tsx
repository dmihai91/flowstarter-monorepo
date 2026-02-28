import { forwardRef, type HTMLAttributes } from 'react';

export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  color?: 'success' | 'warning' | 'error' | 'info' | 'brand' | 'neutral';
  size?: 'sm' | 'md';
  label?: string;
}

const dotColors = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  brand: 'bg-purple-500',
  neutral: 'bg-zinc-400 dark:bg-zinc-500',
};

const dotSizes = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
};

const labelSizes = {
  sm: 'text-xs',
  md: 'text-sm',
};

export const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ color = 'neutral', size = 'md', label, className = '', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 ${className}`}
        {...props}
      >
        <span
          className={`inline-block rounded-full shrink-0 ${dotColors[color]} ${dotSizes[size]}`}
        />
        {label && (
          <span className={`text-zinc-600 dark:text-zinc-400 ${labelSizes[size]}`}>
            {label}
          </span>
        )}
      </span>
    );
  }
);

StatusDot.displayName = 'StatusDot';
