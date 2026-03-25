'use client';

import AuthLayout from '@/components/auth/AuthLayout';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { LoginForm } from '@/components/auth/LoginForm';
import { useTranslations } from '@/lib/i18n';
import { useSignIn } from '@clerk/nextjs/legacy';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function TeamLoginPage() {
  const { isLoaded } = useSignIn();
  const { t } = useTranslations();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        suppressHydrationWarning
      >
        <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
      </div>
    );
  }

  return (
    <AuthLayout
      title={t('team.login.title')}
      subtitle={t('team.login.subtitle')}
      showTeamBadge={true}
      showStats={false}
    >
      <AuthFormCard>
        <LoginForm variant="team" />
      </AuthFormCard>
    </AuthLayout>
  );
}
