'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { I18nProvider } from '@/lib/i18n';
import { Logo } from '@/components/ui/logo';
import en from '@/locales/en';
import Link from 'next/link';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// global-error renders outside all providers — keep inline styles only
function GlobalErrorContent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "'Outfit', system-ui, sans-serif", backgroundColor: '#fbf7ef', color: '#120a22', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Subtle indigo bloom */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(78,94,218,0.12) 0%, transparent 70%)',
        }} />

        {/* Header */}
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: 'rgba(251,247,239,0.85)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(18,10,34,0.08)', padding: '1rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo size="md" />
          </Link>
          <Link href="/" style={{ fontSize: 14, color: 'rgba(18,10,34,0.45)', textDecoration: 'none' }}>
            ← Back to home
          </Link>
        </header>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem 3rem', position: 'relative', zIndex: 10 }}>
          <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>

            <div style={{
              width: 80, height: 80, margin: '0 auto 2rem',
              borderRadius: 16, background: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(18,10,34,0.10)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle style={{ width: 36, height: 36, color: 'hsl(233,65%,50%)' }} />
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: 'rgba(18,10,34,0.55)', marginBottom: '2rem', lineHeight: 1.6 }}>
              A critical error occurred. We&apos;ve been notified and are working on it.
            </p>

            <div style={{
              borderRadius: 16, border: '1px solid rgba(18,10,34,0.10)',
              background: 'rgba(255,255,255,0.72)', padding: '1.25rem',
              backdropFilter: 'blur(16px)', marginBottom: '2rem', textAlign: 'left',
            }}>
              <p style={{ fontSize: 13, color: 'rgba(18,10,34,0.45)', lineHeight: 1.6 }}>
                Try reloading the page. If the problem persists, go to the homepage.
                {error?.digest && <><br /><span style={{ fontFamily: 'monospace', fontSize: 11 }}>ID: {error.digest}</span></>}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '0.625rem 1.25rem',
                  background: 'hsl(233,65%,44%)', color: '#fff', border: 'none',
                  borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <RefreshCw style={{ width: 16, height: 16 }} />
                Reload Page
              </button>
              <a
                href="/"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '0.625rem 1.25rem',
                  background: 'rgba(255,255,255,0.72)', color: 'rgba(18,10,34,0.7)',
                  border: '1px solid rgba(18,10,34,0.12)', borderRadius: 12, fontSize: 14,
                  fontWeight: 500, textDecoration: 'none',
                }}
              >
                <Home style={{ width: 16, height: 16 }} />
                Homepage
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <I18nProvider translations={en}>
      <ThemeProvider>
        <GlobalErrorContent error={error} reset={reset} />
      </ThemeProvider>
    </I18nProvider>
  );
}
