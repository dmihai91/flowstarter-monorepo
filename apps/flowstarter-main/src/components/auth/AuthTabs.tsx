'use client';

import { CustomSignIn } from './CustomSignIn';
import { AuthFormCard } from './AuthFormCard';

export default function AuthTabs() {
  return (
    <AuthFormCard
      footer={
        <a
          href="/team/login"
          className="text-sm text-[var(--fs-ink-faint)] hover:text-[var(--fs-accent)] transition-colors"
        >
          Team member? Sign in here →
        </a>
      }
    >
      <CustomSignIn />
    </AuthFormCard>
  );
}
