'use client';
import { useTranslations } from '@/lib/i18n';
import Image from 'next/image';
import Link from 'next/link';

interface NavbarLogoProps {
  href: string;
  showAppName?: boolean;
}

export function NavbarLogo({ href, showAppName = true }: NavbarLogoProps) {
  const { t } = useTranslations();

  return (
    <Link className="flex items-center gap-2 sm:gap-3 md:gap-4" href={href}>
      <span className="sr-only">{t('app.name')}</span>
      {/* Logo mark */}
      <Image
        src="/logos/flowstarter-mark.svg"
        className="h-8 sm:h-9 w-auto"
        width={36}
        height={36}
        alt="Flowstarter"
        priority
      />
      {/* Text - always visible */}
      {showAppName && (
        <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-600 via-gray-700 to-gray-600 dark:from-gray-300 dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent">
          {t('app.name')}
        </span>
      )}
    </Link>
  );
}
