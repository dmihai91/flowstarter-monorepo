'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { I18nProvider } from '@/lib/i18n';
import { Logo } from '@/components/ui/logo';
import en from '@/locales/en';
import Link from 'next/link';
import { useEffect } from 'react';

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
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display {
          font-family: 'Outfit', system-ui, sans-serif;
        }
        :root {
          --purple: #7b6ad8;
        }
      `}</style>

      <div className="min-h-screen font-display bg-[#FAFAFA] dark:bg-[#0a0a0c] relative overflow-hidden">
        {/* Flow lines background */}
        <div className="fixed inset-0 pointer-events-none">
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.15] dark:opacity-[0.12]"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <defs>
              <linearGradient
                id="globalErrorGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#7B6AD8" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <g stroke="url(#globalErrorGradient)" strokeWidth="1.2">
              <path d="M-100,100 Q200,80 400,120 T800,100 T1300,140" />
              <path d="M-100,200 Q150,220 350,180 T750,220 T1300,200" />
              <path d="M-100,300 Q250,280 450,320 T850,290 T1300,330" />
              <path d="M-100,400 Q180,420 380,380 T780,420 T1300,400" />
              <path d="M-100,500 Q220,480 420,520 T820,490 T1300,530" />
              <path d="M-100,600 Q200,620 400,580 T800,620 T1300,600" />
              <path d="M-100,700 Q250,680 450,720 T850,690 T1300,730" />
            </g>
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
          <div className="text-center max-w-lg">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <Logo size="lg" />
            </div>

            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Critical Error
            </h1>

            {/* Description */}
            <p className="text-gray-500 dark:text-white/50 mb-2">
              Something went seriously wrong. We've been notified and are
              looking into it.
            </p>
            <p className="text-sm text-gray-400 dark:text-white/30 mb-8">
              Your data is safe. Try restarting the app.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 hover:from-[#232342] hover:via-[#1e2a4a] hover:to-[#232342] dark:hover:from-gray-100 dark:hover:via-white dark:hover:to-gray-100 rounded-xl px-8 h-12 text-base font-semibold shadow-lg transition-all duration-300"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                Restart App
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-8 h-12 text-base font-semibold border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-300"
              >
                Back to Home
              </Link>
            </div>

            {/* Help Link */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10">
              <p className="text-sm text-gray-400 dark:text-white/30 mb-3">
                Need immediate help?
              </p>
              <a
                href="mailto:hello@flowstarter.app"
                className="text-sm text-[#7B6AD8] hover:underline font-medium"
              >
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
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
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Critical Error - Flowstarter</title>
      </head>
      <body>
        <ThemeProvider>
          <I18nProvider initialLocale="en" initialMessages={{ en }}>
            <GlobalErrorContent error={error} reset={reset} />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
