'use client';

import { FlowBackground, Logo } from '@flowstarter/flow-design-system';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full relative flex flex-col">
      {/* Animated gradient background */}
      <FlowBackground
        variant="auth"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-50 shrink-0"
        style={{
          background: 'var(--header-bg)',
          backdropFilter: 'blur(16px) saturate(160%)',
          WebkitBackdropFilter: 'blur(16px) saturate(160%)',
          borderBottom: '1px solid var(--header-border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="md" />
            <span
              className="px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide rounded-full"
              style={{
                background: 'rgba(139,92,246,0.12)',
                color: 'var(--violet)',
                border: '1px solid rgba(139,92,246,0.20)',
              }}
            >
              Code
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: 'var(--ui-text-tertiary)' }}
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
            Secure sign-in
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-md my-auto">
          {title && (
            <div className="text-center mb-7">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                <span
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #4D5DD9 0%, #8B5CF6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {title}
                </span>
              </h1>
              {subtitle && (
                <p className="text-sm" style={{ color: 'var(--ui-text-tertiary)' }}>
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 shrink-0 py-4"
        style={{ borderTop: '1px solid var(--ui-border-base)' }}
      >
        <p className="text-center text-xs" style={{ color: 'var(--ui-text-tertiary)', opacity: 0.5 }}>
          &copy; {new Date().getFullYear()} Flowstarter. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
