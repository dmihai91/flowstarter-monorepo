import type { ReactNode } from 'react';

interface AuthFormCardProps {
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Shared glassmorphism card wrapper for all sign-in / sign-up forms.
 * Matches the design-system GlassCard aesthetic.
 */
export function AuthFormCard({ children, footer }: AuthFormCardProps) {
  return (
    <div className="w-full max-w-[540px] mx-auto rounded-2xl bg-white/95 dark:bg-white/[0.04] backdrop-blur-2xl py-8 px-6 md:px-8 border border-gray-200/60 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.1)_inset]">
      {children}
      {footer && (
        <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-white/10 text-center">
          {footer}
        </div>
      )}
    </div>
  );
}
