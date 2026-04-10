'use client';

import AuthLayout from '@/components/auth/AuthLayout';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { LoginForm } from '@/components/LoginForm';
import { useTranslations } from '@/lib/i18n';

export function LoginPageContent() {
  const t = useTranslations();

  return (
    <AuthLayout
      title={t('code.login.title')}
      subtitle={t('code.login.subtitle')}
    >
      <AuthFormCard
        footer={
          <p className="text-xs text-white/30">
            {t('code.login.footer')}
          </p>
        }
      >
        <LoginForm />
      </AuthFormCard>
    </AuthLayout>
  );
}
