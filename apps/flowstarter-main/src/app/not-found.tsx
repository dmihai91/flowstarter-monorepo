'use client';

import { ErrorPageLayout } from '@/components/ErrorPageLayout';
import { Button } from '@/components/ui/button';
import { setIsErrorPageFlag, useErrorPage } from '@/contexts/ErrorPageContext';
import Link from 'next/link';
import { useEffect } from 'react';

export default function NotFound() {
  const { setIsErrorPage } = useErrorPage();

  setIsErrorPageFlag(true);

  useEffect(() => {
    return () => {
      setIsErrorPage(false);
    };
  }, [setIsErrorPage]);

  return (
    <ErrorPageLayout>
      <div className="text-center">
        {/* Error Code */}
        <div className="mb-6">
          <h1 className="text-8xl sm:text-9xl font-bold bg-gradient-to-r from-[var(--purple)] via-blue-500 to-cyan-400 bg-clip-text text-transparent">
            404
          </h1>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Page not found
        </h2>

        {/* Description */}
        <p className="text-gray-500 dark:text-white/50 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. Let's get
          you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link href="/">
            <Button className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 hover:from-[#232342] hover:via-[#1e2a4a] hover:to-[#232342] dark:hover:from-gray-100 dark:hover:via-white dark:hover:to-gray-100 rounded-xl px-8 h-12 text-base font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300">
              Back to Home
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Button>
          </Link>
          <Link href="/help">
            <Button
              variant="outline"
              className="rounded-xl px-8 h-12 text-base font-semibold border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-300"
            >
              Get Help
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-center gap-6">
            {[
              { value: '1-2', label: 'Weeks to launch' },
              { value: '1', label: 'Call needed' },
              { value: '0', label: 'Tech skills required' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center">
                <div className="text-center px-3">
                  <div className="text-lg font-bold bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-[9px] text-gray-400 dark:text-white/30 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
                {i < 2 && (
                  <div className="w-px h-6 bg-gray-200 dark:bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ErrorPageLayout>
  );
}
