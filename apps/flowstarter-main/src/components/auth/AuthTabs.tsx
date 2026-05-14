'use client';

import { LoginForm } from './LoginForm';
import { AuthFormCard } from './AuthFormCard';
import { buildTeamLoginHref } from '@/lib/teamLoginHref';
import { useSearchParams } from 'next/navigation';

/**
 * Card-wrapped sign-in surface used by the public sign-up page.
 *
 * For the MVP we only ship a single email + password sign-in flow (social
 * auth has been intentionally removed), so this component just delegates to
 * the unified `LoginForm` instead of duplicating the form logic.
 */
export default function AuthTabs() {
  const searchParams = useSearchParams();
  const teamLoginHref = buildTeamLoginHref(searchParams);

  return (
    <AuthFormCard
      footer={
        <a
          href={teamLoginHref}
          className="text-sm text-[var(--fs-ink-faint)] hover:text-[var(--fs-accent)] transition-colors"
        >
          Admin? Sign in here →
        </a>
      }
    >
      <LoginForm variant="client" />
    </AuthFormCard>
  );
}
