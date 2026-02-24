'use client';

import { ErrorPageLayout } from '@/components/ErrorPageLayout';
import { Button } from '@/components/ui/button';
import { setIsErrorPageFlag, useErrorPage } from '@/contexts/ErrorPageContext';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { setIsErrorPage } = useErrorPage();

  setIsErrorPageFlag(true);

  useEffect(() => {
    console.error('Application error:', error);

    return () => {
      setIsErrorPage(false);
    };
  }, [error, setIsErrorPage]);

  return (
    <ErrorPageLayout>
      <div className="text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--purple)]/10 to-blue-500/10 border border-[var(--purple)]/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-[var(--purple)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="text-gray-500 dark:text-white/50 mb-8 max-w-md mx-auto">
          We hit an unexpected error. Don't worry, your data is safe. Try refreshing or head back home.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button 
            onClick={reset}
            className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 hover:from-[#232342] hover:via-[#1e2a4a] hover:to-[#232342] dark:hover:from-gray-100 dark:hover:via-white dark:hover:to-gray-100 rounded-xl px-8 h-12 text-base font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline" className="rounded-xl px-8 h-12 text-base font-semibold border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-300">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Help Link */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10">
          <p className="text-sm text-gray-400 dark:text-white/30 mb-3">
            Still having issues?
          </p>
          <Link 
            href="/help"
            className="text-sm text-[var(--purple)] hover:underline font-medium"
          >
            Contact Support →
          </Link>
        </div>
      </div>
    </ErrorPageLayout>
  );
}
