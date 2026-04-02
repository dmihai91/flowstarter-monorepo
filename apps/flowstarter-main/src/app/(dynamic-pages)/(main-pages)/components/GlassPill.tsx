import type { ReactNode } from 'react';

interface GlassPillProps {
  children: ReactNode;
  dot?: boolean; // show animated green presence dot
  className?: string;
}

/**
 * Reusable glassmorphism pill — used for hero badge and audience qualifier.
 * Frosted glass surface, subtle border, soft shadow.
 */
export function GlassPill({
  children,
  dot = false,
  className = '',
}: GlassPillProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2.5',
        'px-4 py-2 rounded-xl',
        'bg-white/60 dark:bg-white/[0.06]',
        'backdrop-blur-md',
        'border border-gray-200/50 dark:border-white/[0.08]',
        'shadow-[0_2px_20px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]',
        'text-sm font-medium text-gray-600 dark:text-white/65',
        className,
      ].join(' ')}
    >
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      {children}
    </span>
  );
}
