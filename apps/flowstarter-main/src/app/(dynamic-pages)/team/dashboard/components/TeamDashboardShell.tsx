'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const card =
  'rounded-[24px] border border-gray-200/80 bg-white/95 dark:border-white/[0.06] dark:bg-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-2xl backdrop-saturate-150 dark:shadow-[0_8px_32px_rgba(0,0,0,0.25),0_1px_0_rgba(255,255,255,0.06)_inset]';

interface TeamDashboardShellProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  children: React.ReactNode;
}

export function TeamDashboardShell({
  icon,
  title,
  subtitle,
  backHref = '/team/dashboard',
  backLabel = 'Back to Dashboard',
  maxWidth = '3xl',
  children,
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
  }[maxWidth];

  return (
    <div className="py-6 px-4 sm:px-6">
      <div className={`${maxWidthClass} mx-auto`}>
        {/* Back */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-gray-400 dark:text-white/30 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>

        {/* Page header */}
        {(icon || title) && (
          <div className="flex items-center gap-3 mb-6">
            {icon && (
              <div className="w-10 h-10 rounded-2xl bg-[var(--purple)]/10 border border-[var(--purple)]/20 flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
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
  return <div className={`${card} p-5 sm:p-6 ${className}`}>{children}</div>;
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
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
