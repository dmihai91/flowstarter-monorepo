'use client';
import { CustomUserButton } from '@/components/CustomUserButton';
import { CustomNavLink } from '@/components/ui/custom-nav-link';
import { useTranslations } from '@/lib/i18n';
import { useAuth } from '@clerk/nextjs';

export function LoginNavLink() {
  const { isSignedIn } = useAuth();
  const { t } = useTranslations();

  if (isSignedIn) {
    return <CustomUserButton />;
  }

  return <CustomNavLink href="/login">{t('nav.signIn')}</CustomNavLink>;
}
