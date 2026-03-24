import type { ReactNode } from 'react';

interface AuthFormCardProps {
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Shared glassmorphism card wrapper for all sign-in / sign-up forms.
 * Matches the landing page GlassPill aesthetic.
 */
export function AuthFormCard({ children, footer }: AuthFormCardProps) {
  return (
    <div className="w-full max-w-[520px] mx-auto rounded-2xl bg-white/95 dark:bg-[var(--surface-2)]/90 backdrop-blur-2xl backdrop-saturate-150 py-5 px-4 md:px-6 shadow-lg dark:shadow-2xl border border-gray-200/50 dark:border-white/10">
      {children}
      {footer && (
        <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-white/10 text-center">
          {footer}
        </div>
      )}
    </div>
  );
}
