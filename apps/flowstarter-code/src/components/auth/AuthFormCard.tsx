import type { ReactNode } from 'react';

interface AuthFormCardProps {
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Glassmorphism card — adapts to system light/dark theme via CSS variables.
 */
export function AuthFormCard({ children, footer }: AuthFormCardProps) {
  return (
    <div
      className="w-full rounded-2xl py-8 px-6 md:px-8"
      style={{
        background: 'var(--glass-surface)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid var(--ui-border-base)',
        boxShadow: 'var(--glass-shadow)',
      }}
    >
      {children}
      {footer && (
        <div
          className="mt-6 pt-4 text-center"
          style={{ borderTop: '1px solid var(--ui-border-base)' }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
