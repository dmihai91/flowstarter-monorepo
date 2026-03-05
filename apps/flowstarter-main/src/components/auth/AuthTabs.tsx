'use client';

import { CustomSignIn } from './CustomSignIn';

export default function AuthTabs() {
  return (
    <div className="w-full max-w-[520px] mx-auto rounded-2xl bg-white/95 dark:bg-[var(--surface-2)]/90 backdrop-blur-2xl backdrop-saturate-150 py-3 sm:py-5 px-3 sm:px-4 md:px-6 shadow-lg dark:shadow-2xl border border-gray-200/50 dark:border-white/10">

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
