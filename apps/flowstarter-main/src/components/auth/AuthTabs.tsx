'use client';

import { CustomSignIn } from './CustomSignIn';

export default function AuthTabs() {
  return (
    <div className="w-full max-w-[520px] mx-auto rounded-2xl bg-white/95 dark:bg-[var(--surface-2)]/90 backdrop-blur-2xl backdrop-saturate-150 py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 shadow-lg dark:shadow-2xl my-2 sm:my-4 md:my-6 border border-gray-200/50 dark:border-white/10">
      <h1 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-6">
        Sign in to your account
      </h1>
      <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6 -mt-4">
        New client?{' '}
        <a
          href="https://calendly.com/flowstarter-app/discovery"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#7B6AD8] hover:underline"
        >
          Book a discovery call
        </a>{' '}
        to get started.
      </p>
      <CustomSignIn />
      <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-white/10 text-center">
        <a
          href="/team/login"
          className="text-sm text-gray-500 dark:text-white/50 hover:text-[var(--purple)] transition-colors"
        >
          Team member? Sign in here →
        </a>
      </div>
    </div>
  );
}
