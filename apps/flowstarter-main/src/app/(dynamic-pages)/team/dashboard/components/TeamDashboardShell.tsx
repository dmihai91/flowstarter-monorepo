'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const card =
  'rounded-[var(--fs-radius-2xl)] border backdrop-blur-2xl backdrop-saturate-150';

interface TeamDashboardShellProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  showBackButton?: boolean;
  maxWidth?:
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | '7xl';
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function TeamDashboardShell({
  icon,
  title,
  subtitle,
  backHref = '/team/dashboard',
  backLabel = 'Dashboard',
  showBackButton = false,
  maxWidth = '4xl',
  children,
  actions,
}: TeamDashboardShellProps) {
  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  }[maxWidth];

  return (
    <div className="pt-10 pb-10 px-4 sm:px-6">
      <div className={`${maxWidthClass} mx-auto`}>
        {/* Back */}
        {showBackButton && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {backLabel}
          </Link>
        )}

        {/* Page header */}
        {(icon || title) && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="w-10 h-10 rounded-2xl bg-[var(--purple)]/10 border border-[var(--purple)]/20 flex items-center justify-center shrink-0">
                  {icon}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-[var(--fs-ink)]">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-500 dark:text-white/40 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex items-center gap-2">{actions}</div>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

// Reusable section card used inside the shell
export function ShellCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${card} p-5 sm:p-6 ${className}`} style={{ background: 'var(--fs-glass-bg)', borderColor: 'var(--fs-glass-edge)', boxShadow: 'var(--fs-card-shadow)' }}>{children}</div>;
}

// Section title inside a card
export function ShellSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {title && (
        <h2 className="text-sm font-semibold text-[var(--fs-ink)] mb-4">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}