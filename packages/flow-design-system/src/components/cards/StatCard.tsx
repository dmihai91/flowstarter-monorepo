import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: ReactNode;
  breakdown?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
}

const cardStyles = `
  rounded-2xl backdrop-blur-sm
  bg-white/80 dark:bg-[#1a1a1f]/80
  border border-zinc-200/60 dark:border-white/[0.06]
  shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)_inset,0_-1px_0_rgba(0,0,0,0.02)_inset]
  dark:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset]
  p-5
`;

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, breakdown, action, footer, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${cardStyles} ${className}`}
        {...props}
      >
        <div className="flex items-start justify-between mb-2">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {title}
          </span>
          {action}
        </div>
        <div className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          {value}
        </div>
        {breakdown && (
          <div className="flex items-center gap-3 flex-wrap">
            {breakdown}
          </div>
        )}
        {footer && (
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/[0.06]">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

StatCard.displayName = 'StatCard';
