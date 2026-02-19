'use client';

import AuthLayout from '@/components/auth/AuthLayout';
import AuthTabs from '@/components/auth/AuthTabs';
import { useTranslations } from '@/lib/i18n';
import { useAuth } from '@clerk/nextjs';

export function SignUpClient() {
  const { t } = useTranslations();
  const { isSignedIn, isLoaded } = useAuth();

  // Client redirect if already signed in (keeps route static)
  if (isLoaded && isSignedIn) {
    if (typeof window !== 'undefined') {
      window.location.replace('/dashboard');
    }
  }
  return (
    <AuthLayout
      title={t('auth.signUp.title')}
      subtitle={t('auth.signUp.subtitle')}
      marketingKeys={[
        'auth.marketing.signup.easyStart',
        'auth.marketing.signup.noCreditCard',
        'auth.marketing.signup.getOnlineFast',
      ]}
    >
      <AuthTabs />
    </AuthLayout>
  );
}
