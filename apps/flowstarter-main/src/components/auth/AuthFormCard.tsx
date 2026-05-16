import type { ReactNode } from 'react';

interface AuthFormCardProps {
  children: ReactNode;
  footer?: ReactNode;
  /** Editorial top highlight like marketing `.ls-card` (admin login only). */
  landingSurface?: boolean;
}

/**
 * Shared glassmorphism card wrapper for all sign-in / sign-up forms.
 * Matches the design-system GlassCard aesthetic.
 */
export function AuthFormCard({
  children,
  footer,
  landingSurface = false,
}: AuthFormCardProps) {
  return (
    <div
      className={
        landingSurface
          ? 'auth-form-card--landing relative overflow-hidden w-full max-w-[540px] mx-auto rounded-[var(--fs-radius-2xl)] backdrop-blur-2xl py-7 px-6 md:px-8 border'
          : 'w-full max-w-[540px] mx-auto rounded-[var(--fs-radius-2xl)] backdrop-blur-2xl py-7 px-6 md:px-8 border'
      }
      style={{
        background: 'var(--fs-glass-bg)',
        borderColor: 'var(--fs-glass-edge)',
        boxShadow: 'var(--fs-card-shadow)',
      }}
    >
      {children}
      {footer && (
        <div className="mt-5 pt-4 border-t border-[var(--fs-rule)] text-center">
          {footer}
        </div>
      )}
    </div>
  );
}
