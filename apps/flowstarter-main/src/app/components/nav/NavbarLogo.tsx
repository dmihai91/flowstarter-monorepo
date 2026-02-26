'use client';
import { useTranslations } from '@/lib/i18n';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';

interface NavbarLogoProps {
  href: string;
  showAppName?: boolean;
}

export function NavbarLogo({ href, showAppName = true }: NavbarLogoProps) {
  const { t } = useTranslations();

  return (
    <Link className="flex items-center" href={href}>
      <span className="sr-only">{t('app.name')}</span>
      <Logo size="md" showText={showAppName} />
    </Link>
  );
}
