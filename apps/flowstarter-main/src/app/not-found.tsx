'use client';

import { ErrorPageLayout } from '@/components/ErrorPageLayout';
import { Button } from '@/components/ui/button';
import { setIsErrorPageFlag, useErrorPage } from '@/contexts/ErrorPageContext';
import Link from 'next/link';
import { useEffect } from 'react';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  const { setIsErrorPage } = useErrorPage();
  setIsErrorPageFlag(true);

  useEffect(() => {
    return () => { setIsErrorPage(false); };
  }, [setIsErrorPage]);

  return (
    <ErrorPageLayout>
      <div className="text-center">
        {/* 404 number */}
        <div className="mb-6">
          <span className="text-[9rem] sm:text-[11rem] font-bold leading-none select-none"
            style={{
              background: 'linear-gradient(135deg, var(--fs-accent) 0%, hsl(233,70%,74%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            404
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--fs-ink)] mb-3">
          Page not found
        </h1>
        <p className="text-[var(--fs-ink-dim)] mb-8 leading-relaxed max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Suggestions card */}
        <div className="rounded-[var(--fs-radius-2xl)] border p-5 mb-8 text-left backdrop-blur-xl"
          style={{ background: 'var(--fs-glass-bg)', borderColor: 'var(--fs-glass-edge)', boxShadow: 'var(--fs-card-shadow)' }}
        >
          <div className="flex gap-3">
            <Search className="w-4 h-4 text-[var(--fs-ink-faint)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--fs-ink)] mb-2">Try one of these instead</p>
              <ul className="space-y-1">
                {[
                  { href: '/', label: 'Homepage' },
                  { href: '/login', label: 'Sign in' },
                  { href: '/help', label: 'Help & support' },
                  { href: '/pricing', label: 'Plans & pricing' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-xs text-[var(--fs-accent)] hover:underline"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              Go to Homepage
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </div>
    </ErrorPageLayout>
  );
}
