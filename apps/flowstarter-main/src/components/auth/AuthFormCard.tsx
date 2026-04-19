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
    <div className="w-full max-w-[540px] mx-auto rounded-[var(--fs-radius-2xl)] backdrop-blur-2xl py-8 px-6 md:px-8 border" style={{ background: 'var(--fs-glass-bg)', borderColor: 'var(--fs-glass-edge)', boxShadow: 'var(--fs-card-shadow)' }}>
      {children}
      {footer && (
        <div className="mt-6 pt-4 border-t border-[var(--fs-rule)] text-center">
          {footer}
        </div>
      )}
    </div>
  );
}
