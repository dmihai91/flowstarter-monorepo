'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { glassClass, glassStyle } from '@/lib/glass';

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
  maxWidth = '6xl',
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
    <div className="px-4 pb-10 pt-8 sm:px-6 lg:px-8">
      <div className={`${maxWidthClass} mx-auto`}>
        {/* Back */}
        {showBackButton && (
          <Link
            href={backHref}
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-[var(--fs-ink-faint)] transition-colors hover:text-[var(--fs-ink)]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {backLabel}
          </Link>
        )}

        {/* Page header */}
        {(icon || title) && (
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--fs-rule-accent)] bg-[var(--fs-accent-bg)] text-[var(--fs-accent)]">
                  {icon}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[var(--fs-ink)] sm:text-[1.65rem]">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-[var(--fs-ink-faint)]">
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
  return (
    <div className={`${glassClass} p-5 sm:p-6 ${className}`} style={glassStyle}>
      {children}
    </div>
  );
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
        <h2 className="mb-4 text-sm font-semibold tracking-tight text-[var(--fs-ink-dim)]">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
