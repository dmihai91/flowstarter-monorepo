'use client';

import { CustomSignIn } from './CustomSignIn';
import { AuthFormCard } from './AuthFormCard';

export default function AuthTabs() {
  return (
    <AuthFormCard
      footer={
        <a
          href="/team/login"
          className="text-sm text-gray-500 dark:text-white/50 hover:text-[var(--purple)] transition-colors"
        >
          Team member? Sign in here →
        </a>
      }
    >
      <CustomSignIn />
    </AuthFormCard>
  );
}
